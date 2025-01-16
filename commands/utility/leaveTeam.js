const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaveteam')
        .setDescription('Leave your current team'),

    async execute(interaction) {
        console.log('Executing leaveTeam command');

        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const logsFilePath = path.join(__dirname, '../../logs.txt');

        try {
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for leaveTeam');

            // Read and parse teams.json
            console.log('Attempting to read teams.json file...');
            const data = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            let teamsData = JSON.parse(data);

            // Find the user's team
            let userTeamName = null;
            for (const [teamName, teamInfo] of Object.entries(teamsData)) {
                if (teamInfo.members.some(member => member.discordID === interaction.user.id)) {
                    userTeamName = teamName;
                    // Remove the user from the team
                    teamInfo.members = teamInfo.members.filter(member => member.discordID !== interaction.user.id);

                    // If team is empty, delete it
                    if (teamInfo.members.length === 0) {
                        delete teamsData[teamName]; // Remove the team from JSON
                        console.log(`Team "${teamName}" has been deleted due to no members.`);
                    }
                    break;
                }
            }

            if (!userTeamName) {
                await interaction.editReply({ content: 'You are not in any team.' });
                return;
            }

            // Save the updated teams.json
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json');

            // Log the leave team action
            const timestamp = new Date().toISOString();
            let logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: leaveteam | Left team: ${userTeamName}\n`;
            
            if (!teamsData[userTeamName]) {
                logMessage += `[${timestamp}] Team "${userTeamName}" has been deleted due to no members.\n`;
            }

            await fs.appendFile(logsFilePath, logMessage);
            console.log('Leave team action logged to logs.txt');

            // Send final response
            let responseMessage = `You have successfully left the team **${userTeamName}**.`;
            if (!teamsData[userTeamName]) {
                responseMessage += `\n💀 **Team "${userTeamName}" has been disbanded due to no remaining members.**`;
            }

            await interaction.editReply({ content: responseMessage });

        } catch (error) {
            console.error('Error during leaveTeam command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while leaving the team. Please try again later.' });
            } catch (editError) {
                console.error('Error editing reply after leaveTeam error:', editError);
            }
        }
    },
};
