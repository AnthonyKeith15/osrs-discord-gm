const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaveteam')
        .setDescription('Leave your current team'),

    async execute(interaction) {
        console.log('Executing leaveTeam command');

        // Define the path to the teams.json file
        const teamsFilePath = path.join(__dirname, '../../teams.json');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for leaveTeam');

            console.log('Attempting to read teams.json file...');

            // Read and parse teams.json
            const data = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            const teamsData = JSON.parse(data);

            // Find the user's team
            let userTeamName = null;
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                if (teamInfo.members.some(member => member.discordID === interaction.user.id)) {
                    userTeamName = teamName;
                    // Remove the user from the team
                    teamInfo.members = teamInfo.members.filter(member => member.discordID !== interaction.user.id);
                    break;
                }
            }

            if (!userTeamName) {
                // User is not in any team
                await interaction.editReply({ content: 'You are not in any team.' });
                return;
            }

            // Save the updated teams data back to the JSON file
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json');
            await interaction.editReply({ content: `You have successfully left the team **${userTeamName}**.` });

        } catch (error) {
            console.error('Error during leaveTeam command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while leaving the team. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after catching error for leaveTeam:', editError);
            }
        }
    },
};
