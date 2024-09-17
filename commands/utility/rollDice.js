const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

let isExecuting = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolldice')
        .setDescription('Rolls a d6 and updates the position of your team'),

    execute(interaction) {
        if (isExecuting) {
            return interaction.reply({ content: 'The command is already being executed. Please wait a moment.', ephemeral: true });
        }

        isExecuting = true;
        console.log('Executing rollDice command');

        // Define the path to the teams.json file
        const teamsFilePath = path.join(__dirname, '../../teams.json');

        // Defer the reply to give us time to process the command
        interaction.deferReply({ ephemeral: true })
            .then(() => {
                console.log('Deferred reply for rollDice');

                // Read teams.json
                return fs.readFile(teamsFilePath, 'utf-8');
            })
            .then(teamsDataRaw => {
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
                    isExecuting = false;
                    return interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
                }

                // Roll a d6
                const roll = Math.floor(Math.random() * 6) + 1;
                console.log(`Rolled a d6: ${roll}`);

                // Update the team's position
                userTeam.position += roll;

                // Save the updated teams data back to the JSON file
                return fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2))
                    .then(() => {
                        console.log('Successfully updated teams.json');
                        isExecuting = false;
                        return interaction.editReply({ content: `You rolled a ${roll}! Your team **${userTeamName}** is now at position ${userTeam.position}.` });
                    });
            })
            .catch(error => {
                console.error('Error during rollDice command execution:', error);
                isExecuting = false;
                interaction.editReply({ content: 'An error occurred while rolling the dice. Please try again later.' })
                    .catch(err => console.error('Error editing reply in catch:', err));
            });
    },
};
