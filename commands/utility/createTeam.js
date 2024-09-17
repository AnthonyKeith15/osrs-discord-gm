const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_team')
        .setDescription('Create a new team')
        .addStringOption(option =>
            option.setName('team_name')
                .setDescription('The name of the team')
                .setRequired(true)),

    async execute(interaction) {
        const teamName = interaction.options.getString('team_name');
        
        // Define the path to the teams.json file
        const teamsFilePath = path.join(__dirname, '../../teams.json');

        console.log('Received command to create team:', teamName);
        console.log('Teams file path:', teamsFilePath);

        // Defer the reply to give us time to process the command
        await interaction.deferReply({ ephemeral: true });
        console.log('Deferred reply');

        // Read and process the file
        try {
            const data = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            let teamsData = JSON.parse(data);

            // Check if the user is already a member of any team
            for (const [existingTeamName, team] of Object.entries(teamsData)) {
                if (team.members.some(member => member.discordID === interaction.user.id)) {
                    console.log(`User already in team: ${existingTeamName}`);
                    return interaction.editReply({ content: `You are already a member of **${existingTeamName}**. You must leave your current team before creating a new one.` });
                }
            }

            // Check if the team already exists
            if (teamsData[teamName]) {
                console.log(`Team name ${teamName} already exists`);
                return interaction.editReply({ content: `A team with the name **${teamName}** already exists!` });
            }

            // Create a new team object and add the creator as the first member
            console.log('Creating new team:', teamName);
            teamsData[teamName] = {
                position: 1,  // Initial position on the board
                members: [
                    {
                        discordID: interaction.user.id,
                        discordName: interaction.user.username, // Include the Discord username
                        verificationLinks: {}  // Initialize an empty verification links object
                    }
                ],
            };

            // Save the updated teams data back to the JSON file
            console.log('Attempting to write to teams.json');
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully wrote to teams.json');
            return interaction.editReply(`Team **${teamName}** has been created successfully, and you have joined the team!`);
            
        } catch (error) {
            console.error('Error during file operation:', error);
            // More detailed error messages for common file issues
            if (error.code === 'ENOENT') {
                console.error('File not found. Please ensure teams.json exists and is accessible.');
            } else if (error.code === 'EACCES') {
                console.error('Permission denied. Please ensure the bot has write access to teams.json.');
            }
            return interaction.editReply({ content: 'An error occurred while accessing or saving the team data.' });
        }
    },
};
