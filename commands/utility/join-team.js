const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the teams.json file
const teamsFilePath = path.join(__dirname, '../../teams.json'); // Adjust the path as needed

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join-team')
		.setDescription('Join an existing team')
		.addStringOption(option =>
			option.setName('teamname')
				.setDescription('The name of the team you want to join')
				.setRequired(true)),
	async execute(interaction) {
		const teamName = interaction.options.getString('teamname');

		// Read the current teams from the teams.json file
		let teams;
		try {
			teams = JSON.parse(fs.readFileSync(teamsFilePath, 'utf8'));
		} catch (error) {
			teams = {}; // If file doesn't exist or is empty, initialize an empty object
		}

		// Check if the team exists
		if (!teams[teamName]) {
			await interaction.reply(`Team "${teamName}" does not exist. Please create it first.`);
			return;
		}

		// Check if the user is already part of the team
		if (teams[teamName].members[interaction.user.id]) {
			await interaction.reply(`You are already a member of the team "${teamName}".`);
			return;
		}

		// Add the user to the team
		teams[teamName].members[interaction.user.id] = {
			username: interaction.user.username,
		};

		// Write the updated teams back to the teams.json file
		fs.writeFileSync(teamsFilePath, JSON.stringify(teams, null, 2));

		await interaction.reply(`You have successfully joined the team "${teamName}".`);
	},
};
