const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submitverification')
        .setDescription('Submit a verification screenshot for your current position')
        .addAttachmentOption(option => 
            option.setName('image')
                .setDescription('The screenshot for verification')
                .setRequired(true)
        ),

    async execute(interaction) {
        console.log('Executing submitVerification command');

        // Define the paths to the teams.json and logs.txt files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for submitVerification');

            console.log('Attempting to read teams.json file...');

            // Read and parse teams.json before making changes
            const data = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            const teamsData = JSON.parse(data);

            // Deep copy of teamsData for change comparison
            const originalData = JSON.parse(JSON.stringify(teamsData));

            // Find the user's team and their current position
            let userTeam = null;
            let userMember = null;
            for (const teamInfo of Object.values(teamsData)) {
                const member = teamInfo.members.find(member => member.discordID === interaction.user.id);
                if (member) {
                    userTeam = teamInfo;
                    userMember = member;
                    break;
                }
            }

            if (!userTeam || !userMember) {
                // User is not in any team
                await interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
                return;
            }

            // Get the attachment (image) from the interaction
            const image = interaction.options.getAttachment('image');
            if (!image) {
                await interaction.editReply({ content: 'No image attached. Please attach an image for verification.' });
                return;
            }

            // Update the user's verification links with a key-value pair (position: link)
            const currentPosition = userTeam.position.toString(); // Convert to string to use as a key
            userMember.verificationLinks[currentPosition] = image.url;

            // Save the updated teams data back to the JSON file
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json with verification link');

            // Log the changes to logs.txt
            const changes = {
                verificationSubmitted: {
                    team: userTeam,
                    member: interaction.user.username,
                    position: currentPosition,
                    imageUrl: image.url
                }
            };
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: submitverification | Changes: ${JSON.stringify(changes)}\n`;
            await fs.appendFile(logsFilePath, logMessage);
            console.log('Changes logged to logs.txt');

            await interaction.editReply({ content: `Verification submitted for position ${currentPosition}.` });

        } catch (error) {
            console.error('Error during submitVerification command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while submitting verification. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after catching error for submitVerification:', editError);
            }
        }
    },
};
