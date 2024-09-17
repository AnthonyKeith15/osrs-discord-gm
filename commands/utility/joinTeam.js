const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jointeam')
        .setDescription('Join an existing team'),

    async execute(interaction) {
        console.log('Executing joinTeam command');

        // Define the path to the teams.json and logs.txt files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        // Defer the reply to give us time to process the command
        await interaction.deferReply({ ephemeral: true });
        console.log('Deferred reply for joinTeam');

        try {
            console.log('Attempting to read teams.json file...');

            // Read and parse teams.json before making changes
            let teamsData = JSON.parse(await fs.readFile(teamsFilePath, 'utf-8'));
            const originalData = JSON.parse(JSON.stringify(teamsData)); // Deep copy for comparison

            // Check if the user is already in a team
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                if (teamInfo.members.some(member => member.discordID === interaction.user.id)) {
                    await interaction.editReply({ content: `You are already a member of the team **${teamName}**.` });
                    return;
                }
            }

            // Create an array of options for the select menu
            const teamOptions = Object.keys(teamsData).map(teamName => {
                return {
                    label: teamName,
                    value: teamName
                };
            });

            // Check if there are any teams available
            if (teamOptions.length === 0) {
                await interaction.editReply({ content: 'No teams available to join.' });
                return;
            }

            // Create a select menu for the user to choose a team
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_team')
                .setPlaceholder('Select a team to join')
                .addOptions(teamOptions);

            // Create the action row to hold the select menu
            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Send the select menu to the user
            await interaction.editReply({ content: 'Choose a team to join:', components: [row] });
            console.log('Sent team selection menu to user');

            // Create a message component collector to handle the user's selection
            const filter = i => i.customId === 'select_team' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 15000 });

            collector.on('collect', async i => {
                if (!i.isStringSelectMenu()) return;

                const selectedTeam = i.values[0];
                console.log(`User selected team: ${selectedTeam}`);

                // Add the user to the selected team
                teamsData[selectedTeam].members.push({
                    discordID: interaction.user.id,
                    discordName: interaction.user.username, // Include the Discord username
                    verificationLinks: {}  // Initialize an empty verification links object
                });

                // Save the updated teams data back to the JSON file
                console.log('Updating teams.json with new member');
                try {
                    await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
                    console.log('Successfully wrote to teams.json');

                    // Log the changes to logs.txt
                    const changes = {
                        teamJoined: selectedTeam,
                        newMember: {
                            discordID: interaction.user.id,
                            discordName: interaction.user.username
                        }
                    };
                    const timestamp = new Date().toISOString();
                    const logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: jointeam | Changes: ${JSON.stringify(changes)}\n`;
                    await fs.appendFile(logsFilePath, logMessage);
                    console.log('Changes logged to logs.txt');

                    await i.update({ content: `You have joined **${selectedTeam}**!`, components: [], ephemeral: true });
                } catch (writeError) {
                    console.error('Error writing to teams.json:', writeError);
                    await i.update({ content: 'Error saving team data. Please try again later.', components: [], ephemeral: true });
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    try {
                        await interaction.editReply({ content: 'No team selected.', components: [] });
                    } catch (error) {
                        console.error('Error when trying to edit reply after collector end:', error);
                    }
                }
            });

        } catch (error) {
            console.error('Error during joinTeam command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while accessing the team data. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after catching error for joinTeam:', editError);
            }
        }
    },
};
