const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teaminfo')
        .setDescription('Displays information about team members'),

    async execute(interaction) {
        console.log('Executing teaminfo command');

        // Define the path to the teams.json file
        const teamsFilePath = path.join(__dirname, '../../teams.json');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for teaminfo');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            const teamsData = JSON.parse(teamsDataRaw);
            console.log('Successfully read teams.json for teaminfo');

            // Create an array of team options for the select menu
            const teamOptions = [
                {
                    label: 'Show All Teams',
                    value: 'all_teams',
                },
            ];

            // Add each team as an option
            for (const teamName of Object.keys(teamsData)) {
                teamOptions.push({
                    label: teamName,
                    value: teamName,
                });
            }

            // Create a select menu for teams
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_team')
                .setPlaceholder('Select a team')
                .addOptions(teamOptions);

            // Create an action row for the select menu
            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Send the select menu to the user
            await interaction.editReply({ content: 'Choose a team to view its members:', components: [row] });

            // Set up a collector to handle the user's selection
            const filter = i => i.customId === 'select_team' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async i => {
                const selectedTeam = i.values[0];
                let content = '';

                if (selectedTeam === 'all_teams') {
                    // Show all teams
                    content += '**All Teams and Members:**\n\n';
                    for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                        content += `**${teamName}:**\n`;
                        for (const member of teamInfo.members) {
                            content += `- ${member.discordName}\n`;
                        }
                        content += '\n';
                    }
                } else {
                    // Show specific team
                    const teamInfo = teamsData[selectedTeam];
                    content += `**${selectedTeam} Members:**\n\n`;
                    if (teamInfo && teamInfo.members.length > 0) {
                        for (const member of teamInfo.members) {
                            content += `- ${member.discordName}\n`;
                        }
                    } else {
                        content += 'No members in this team.\n';
                    }
                }

                // Update the original reply with the team info
                await i.update({ content, components: [] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No team selected.', components: [] });
                }
            });

        } catch (error) {
            console.error('Error during teaminfo command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while retrieving team information. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after catching error for teaminfo:', editError);
            }
        }
    },
};
