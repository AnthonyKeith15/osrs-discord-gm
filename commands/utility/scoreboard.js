const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');


let isExecuting = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Displays the current positions of all teams with descriptions'),

    execute(interaction) {
        if (isExecuting) {
            console.log('Scoreboard command is already being executed');
            return;
        }
        isExecuting = true;
        console.log('Executing scoreboard command');

        // Define the paths to the teams.json and gameBoard.json files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');

        // Defer the reply to give us time to process the command
        interaction.deferReply({ ephemeral: true })
            .then(() => {
                console.log('Deferred reply for scoreboard');

                // Read teams.json
                return fs.readFile(teamsFilePath, 'utf-8');
            })
            .then(teamsDataRaw => {
                console.log('Successfully read teams.json for scoreboard');
                const teamsData = JSON.parse(teamsDataRaw);

                // Read gameBoard.json
                return fs.readFile(gameBoardFilePath, 'utf-8')
                    .then(gameBoardDataRaw => {
                        console.log('Successfully read gameBoard.json for scoreboard');
                        const gameBoardData = JSON.parse(gameBoardDataRaw);

                        // Create a map of positions to descriptions for quick lookup
                        const positionDescriptions = {};
                        for (const space of gameBoardData.game.board.spaces) {
                            positionDescriptions[space.position] = space.description;
                        }

                        // Create the scoreboard message
                        let scoreboard = '**Team Positions and Descriptions:**\n';
                        for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                            const position = teamInfo.position;
                            const description = positionDescriptions[position] || 'No description available';
                            scoreboard += `**${teamName}** - Position: ${position} - Description: ${description}\n`;
                        }
                        interaction.editReply({ content: scoreboard });
                    })
                    .catch(error => {
                        console.error('Error during scoreboard command execution:', error);
                        interaction.editReply({ content: 'An error occurred while accessing the team or game board data. Please try again later.' })
                            .catch(err => console.error('Error editing reply in catch:', err));
                    })
                    .finally(() => {
                        isExecuting = false;
                    });
            })
            .catch(error => {
                console.error('Error during scoreboard command execution:', error);
                interaction.editReply({ content: 'An error occurred while accessing the team or game board data. Please try again later.' })
                    .catch(err => console.error('Error editing reply in catch:', err));
            });
    },
};
