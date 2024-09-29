const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('starttile')
        .setDescription('Submit a start verification image for your current tile')
        .addAttachmentOption(option => 
            option.setName('image')
                .setDescription('Screenshot of your collection log for the current tile (if applicable)')
                .setRequired(false) // Image required only if it's a per_member tile
        ),

    async execute(interaction) {
        console.log('Executing starttile command');

        // Define the paths to the teams.json, gameBoard.json, and logs.txt files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for starttile');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            const teamsData = JSON.parse(teamsDataRaw);

            // Read gameBoard.json
            const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, 'utf-8');
            console.log('Successfully read gameBoard.json');
            const gameBoardData = JSON.parse(gameBoardDataRaw);

            // Find the user's team and current position
            let userTeam = null;
            let userTeamName = '';
            let userMember = null;
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                const member = teamInfo.members.find(member => member.discordID === interaction.user.id);
                if (member) {
                    userTeam = teamInfo;
                    userTeamName = teamName;
                    userMember = member;
                    break;
                }
            }

            if (!userTeam) {
                return interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
            }

            const currentPosition = userTeam.position;
            const currentSpace = gameBoardData.game.board.spaces.find(space => space.position === currentPosition);
            if (!currentSpace) {
                return interaction.editReply({ content: 'Invalid position on the board. Please try again.' });
            }

            // Check if the current tile is per_member or per_team
            const verificationType = currentSpace.verification?.type; // Safely check for verification type
            if (!verificationType) {
                return interaction.editReply({ content: 'Verification type not specified correctly. Please check the board configuration.' });
            }

            if (verificationType === 'per_team') {
                // Log the tile info for the team
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] Team: ${userTeamName} | Tile: ${currentPosition} | Description: ${currentSpace.description} | Verification: per_team\n`;
                await fs.appendFile(logsFilePath, logMessage);
                console.log('Logged start tile (per_team) to logs.txt');

                // For per_team tiles, no pre-verification is needed
                return interaction.editReply({ content: `This is a per-team tile: ${currentSpace.description}. Just submit the final verification when you complete the task! Good luck!` });
            } else if (verificationType === 'per_member') {
                // For per_member tiles, ensure an image is provided
                const image = interaction.options.getAttachment('image');
                if (!image) {
                    return interaction.editReply({ content: 'No image attached. Please attach an image for verification as this is a per-member tile.' });
                }

                // Log the tile info for the team
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] Team: ${userTeamName} | Tile: ${currentPosition} | Description: ${currentSpace.description} | Verification: per_member\n`;
                await fs.appendFile(logsFilePath, logMessage);
                console.log('Logged start tile (per_member) to logs.txt');

                // Update the user's verificationLinks with the pre-verification link and reset if necessary
                const positionKey = currentPosition.toString(); // Convert to string for key
                userMember.verificationLinks[positionKey] = {
                    preVerificationLink: image.url,
                    postVerificationLink: '', // Clear the post-verification link since the user has restarted the tile
                    isVerified: false // Reset verification status
                };

                // Save the updated teams.json file
                await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
                console.log('Successfully updated teams.json with pre-verification link');

                // Check which team members have not submitted their pre-verification
                const membersStillToSubmit = userTeam.members.filter(member => {
                    const memberVerification = member.verificationLinks[currentPosition];
                    return !memberVerification?.preVerificationLink;
                });

                let responseMessage = `Start verification submitted for position ${currentPosition}: ${currentSpace.description}.\n`;
                if (membersStillToSubmit.length > 0) {
                    const membersStillToSubmitNames = membersStillToSubmit.map(member => member.discordName).join(', ');
                    responseMessage += `The following members still need to submit their starting verification: ${membersStillToSubmitNames}.`;
                } else {
                    responseMessage += 'All team members have submitted their starting verification for this tile. Best of luck!';
                }

                // Reply to the user
                await interaction.editReply({ content: responseMessage });
            } else {
                return interaction.editReply({ content: 'Verification type not recognized. Please check the configuration.' });
            }

        } catch (error) {
            console.error('Error during starttile command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while submitting the start verification. Please try again later.' });
            } catch (editError) {
                console.error('Error editing reply in catch:', editError);
            }
        }
    },
};
