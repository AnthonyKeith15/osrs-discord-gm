const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify the submitted tiles for all teams'),

    async execute(interaction) {
        console.log('Executing verify command');

        // Define the paths to the teams.json and gameBoard.json files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for verify');

            // Read teams.json and gameBoard.json
            const [teamsDataRaw, gameBoardDataRaw] = await Promise.all([
                fs.readFile(teamsFilePath, 'utf-8'),
                fs.readFile(gameBoardFilePath, 'utf-8')
            ]);

            const teamsData = JSON.parse(teamsDataRaw);
            const gameBoardData = JSON.parse(gameBoardDataRaw);

            let unverifiedTiles = [];

            // Loop through all teams and gather unverified submissions
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                const unverifiedTeamTiles = {};

                for (const member of teamInfo.members) {
                    for (const [tile, links] of Object.entries(member.verificationLinks)) {
                        if (!links.isVerified) {
                            if (!unverifiedTeamTiles[tile]) {
                                unverifiedTeamTiles[tile] = {
                                    team: teamName,
                                    tile,
                                    description: gameBoardData.game.board.spaces.find(space => space.position === parseInt(tile))?.description || 'Unknown description',
                                    members: []
                                };
                            }

                            unverifiedTeamTiles[tile].members.push({
                                discordName: member.discordName,
                                preVerificationLink: links.preVerificationLink,
                                postVerificationLink: links.postVerificationLink
                            });
                        }
                    }
                }

                unverifiedTiles.push(...Object.values(unverifiedTeamTiles));
            }

            if (unverifiedTiles.length === 0) {
                await interaction.editReply({ content: 'No unverified tiles found.' });
                return;
            }

            // Sort unverified tiles by tile number
            unverifiedTiles.sort((a, b) => a.tile - b.tile);

            // Display unverified tiles one by one
            for (const tile of unverifiedTiles) {
                let content = `**Team:** ${tile.team}\n`;
                content += `**Tile:** ${tile.tile} - *${tile.description}*\n\n`;

                for (const member of tile.members) {
                    content += `**Member:** ${member.discordName}\n`;
                    content += `**Pre Verification Link:** ${member.preVerificationLink || 'Not provided'}\n`;
                    content += `**Post Verification Link:** ${member.postVerificationLink || 'Not provided'}\n\n`;
                }

                // Add the approve/reject buttons for the whole tile (affects all members)
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_${tile.team}_${tile.tile}`)
                            .setLabel('Approve')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`reject_${tile.team}_${tile.tile}`)
                            .setLabel('Reject')
                            .setStyle(ButtonStyle.Danger)
                    );

                // Send the message with buttons for each tile
                await interaction.followUp({ content, components: [row], ephemeral: true });
            }

            // Handle button interactions (approvals and rejections)
            const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                const [action, teamName, tile] = i.customId.split('_');
                const team = teamsData[teamName];

                if (team) {
                    // Loop through all team members to verify the tile
                    for (const member of team.members) {
                        if (member.verificationLinks[tile]) {
                            member.verificationLinks[tile].isVerified = (action === 'approve');
                        }
                    }

                    // Save the updated teams data back to the JSON file
                    await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));

                    // Update the interaction message
                    await i.update({ content: `Tile ${tile} for team ${teamName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`, components: [] });
                }
            });

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} interactions.`);
            });

        } catch (error) {
            console.error('Error during verify command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred during verification. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after catching error for verify command:', editError);
            }
        }
    },
};
