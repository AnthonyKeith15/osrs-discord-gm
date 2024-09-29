const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolldice')
        .setDescription('Rolls a d6 and updates the position of your team'),

    async execute(interaction) {
        console.log('Executing rollDice command');

        // Define the paths to the teams.json, gameBoard.json, and logs.txt files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for rollDice');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json for rollDice');
            const teamsData = JSON.parse(teamsDataRaw);

            // Read gameBoard.json
            const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, 'utf-8');
            console.log('Successfully read gameBoard.json');
            const gameBoardData = JSON.parse(gameBoardDataRaw);

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

            // Calculate the new position
            let newPosition = userTeam.position + roll;

            // Initialize message details
            let additionalMovement = 0;
            let initialSpaceDescription = 'No special action';
            let actionMessage = '';

            // Get the last space details
            const lastSpacePosition = gameBoardData.game.board.size;
            const lastSpaceDetails = gameBoardData.game.board.spaces.find(space => space.position === lastSpacePosition);

            // Check if the new position is greater than or equal to the board size
            if (newPosition >= lastSpacePosition) {
                // Cap the position to the last space on the board
                newPosition = lastSpacePosition;
                initialSpaceDescription = lastSpaceDetails ? lastSpaceDetails.description : "You've reached the last square!";
                initialSpaceDescription += ". Complete this task to win the game!";
                userTeam.position = newPosition;
            } else {
                // Otherwise, update the team's position based on the roll
                userTeam.position = newPosition;

                // Check if the new position has an action of type 'move'
                const spaceDetails = gameBoardData.game.board.spaces.find(space => space.position === userTeam.position);
                if (spaceDetails) {
                    initialSpaceDescription = spaceDetails.description || 'No description available';
                    
                    // Check for action space
                    if (spaceDetails.action && spaceDetails.action.type === 'move') {
                        additionalMovement = spaceDetails.action.spaces || 0;
                        userTeam.position += additionalMovement;
                        actionMessage = `Result: You moved ${additionalMovement > 0 ? 'forward' : 'backward'} ${Math.abs(additionalMovement)} space(s).`;
                    }
                    
                    // Check if the new space is a per_member space
                    if (spaceDetails.verification && spaceDetails.verification.type === 'per_member') {
                        actionMessage += `\nReminder: You landed on a 'per_member' tile. Please submit your collection log or use the !kc command before proceeding.`;
                    }
                }
            }

            // Get the description of the new space after movement
            const finalSpaceDetails = gameBoardData.game.board.spaces.find(space => space.position === userTeam.position);
            const finalSpaceDescription = finalSpaceDetails ? finalSpaceDetails.description : 'No description available';

            // Save the updated teams data back to the JSON file
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json');

            // Log the roll and position change to logs.txt
            const finalPosition = userTeam.position;
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: rolldice | Started on: ${startingPosition}, Rolled: ${roll}, Landed on: ${newPosition}, Space Description: ${initialSpaceDescription}, Additional Move: ${additionalMovement}, Final Position: ${finalPosition}, Final Space Description: ${finalSpaceDescription}\n`;
            await fs.appendFile(logsFilePath, logMessage);
            console.log('Roll logged to logs.txt');

            // Construct the detailed response message
            let responseMessage = `You rolled a ${roll}. You landed on position ${newPosition}. ${initialSpaceDescription}`;
            if (actionMessage) {
                responseMessage += `\n${actionMessage}`;
            }

            // Reply with the detailed result
            await interaction.editReply({ content: responseMessage });

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
