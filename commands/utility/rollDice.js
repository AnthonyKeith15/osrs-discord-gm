const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolldice')
        .setDescription('Rolls a d6 and updates the position of your team'),

    async execute(interaction) {
        console.log('Executing rollDice command');

        // Define the paths to the teams.json and logs.txt files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for rollDice');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json for rollDice');
            const teamsData = JSON.parse(teamsDataRaw);

            // Find the user's team
            let userTeam = null;
            let userTeamName = '';
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                if (teamInfo.members.some(member => member.discordID === interaction.user.id)) {
                    userTeam = teamInfo;
                    userTeamName = teamName;
                    break;
                }
            }

            if (!userTeam) {
                // User is not in any team
                return interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
            }

            // Store the starting position
            const startingPosition = userTeam.position;

            // Roll a d6
            const roll = Math.floor(Math.random() * 6) + 1;
            console.log(`Rolled a d6: ${roll}`);

            // Update the team's position
            userTeam.position += roll;

            // Save the updated teams data back to the JSON file
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json');

            // Log the roll and position change to logs.txt
            const newPosition = userTeam.position;
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: rolldice | Started on: ${startingPosition}, Rolled: ${roll}, Landed on: ${newPosition}\n`;
            await fs.appendFile(logsFilePath, logMessage);
            console.log('Roll logged to logs.txt');

            await interaction.editReply({ content: `You rolled a ${roll}! Your team **${userTeamName}** is now at position ${newPosition}.` });

        } catch (error) {
            console.error('Error during rollDice command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while rolling the dice. Please try again later.' });
            } catch (editError) {
                console.error('Error editing reply in catch:', editError);
            }
        }
    },
};
