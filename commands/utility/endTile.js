const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endtile')
        .setDescription('Submit the ending verification screenshot for your current position')
        .addAttachmentOption(option => 
            option.setName('image')
                .setDescription('The screenshot for the ending verification')
                .setRequired(true)),

    async execute(interaction) {
        console.log('Executing endTile command');

        // Define the paths to the teams.json and gameBoard.json files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for endTile');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            const teamsData = JSON.parse(teamsDataRaw);

            // Read gameBoard.json
            const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, 'utf-8');
            console.log('Successfully read gameBoard.json');
            const gameBoardData = JSON.parse(gameBoardDataRaw);

            // Find the user's team and their current position
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

            if (!userTeam || !userMember) {
                // User is not in any team
                await interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
                return;
            }

            // Get the current position of the team
            const currentPosition = userTeam.position.toString(); // Convert to string to use as a key

            // Find the current space on the board
            const currentSpace = gameBoardData.game.board.spaces.find(space => space.position === userTeam.position);
            if (!currentSpace) {
                await interaction.editReply({ content: 'Invalid position on the board. Please try again.' });
                return;
            }

            // Get the attachment (image) from the interaction
            const image = interaction.options.getAttachment('image');
            if (!image) {
                await interaction.editReply({ content: 'No image attached. Please attach an image for verification.' });
                return;
            }

            // Handle `per_team` tiles
            if (currentSpace.verification?.type === 'per_team') {
                // No need for pre-verification, so directly add the post-verification link
                userMember.verificationLinks[currentPosition] = {
                    preVerificationLink: '', // No pre-verification required for per_team
                    postVerificationLink: image.url,
                    isVerified: false
                };

                // Save the updated teams.json file
                await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
                console.log('Successfully updated teams.json for per_team verification');

                // Notify the user that verification is completed
                await interaction.editReply({ content: `Post-verification link submitted for your team at position ${currentPosition}: ${currentSpace.description}. Submission completed.` });

            } else if (currentSpace.verification?.type === 'per_member') {
                // Handle `per_member` tiles

                // Initialize or update the verificationLinks for the current position
                if (!userMember.verificationLinks[currentPosition]) {
                    await interaction.editReply({ content: `No pre-verification link found for position ${currentPosition}. Please submit the starting verification first.` });
                    return;
                }

                // Update the post-verification link
                userMember.verificationLinks[currentPosition].postVerificationLink = image.url;

                // Check if both pre and post links are present and set isVerified to true
                const verificationLinks = userMember.verificationLinks[currentPosition];
                if (verificationLinks.preVerificationLink) {
                    verificationLinks.isVerified = false;

                    // Check if all team members have verified for this tile
                    const teamMembersStillToVerify = userTeam.members.filter(member => {
                        const memberVerification = member.verificationLinks[currentPosition];
                        return !memberVerification?.isVerified;
                    });

                    if (teamMembersStillToVerify.length > 0) {
                        const membersStillToSubmit = teamMembersStillToVerify.map(member => member.discordName).join(', ');
                        await interaction.editReply({ content: `Post-verification link submitted for position ${currentPosition}. Waiting for the following members to submit their verification: ${membersStillToSubmit}.` });
                    } else {
                        await interaction.editReply({ content: `Post-verification link submitted for position ${currentPosition}. All members have completed the verification for this tile.` });
                    }
                } else {
                    await interaction.editReply({ content: `Post-verification link submitted for position ${currentPosition}. Waiting for pre-verification link.` });
                }

                // Save the updated teams.json file
                await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
                console.log('Successfully updated teams.json for per_member verification');
            } else {
                await interaction.editReply({ content: 'Verification type not recognized. Please check the configuration.' });
            }

        } catch (error) {
            console.error('Error during endTile command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while submitting verification. Please try again later.' });
            } catch (editError) {
                console.error('Error editing reply in catch:', editError);
            }
        }
    },
};
