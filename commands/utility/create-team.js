const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the teams.json file
const teamsFilePath = path.join(__dirname, '../../teams.json'); // Adjust the path as needed

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-team')
		.setDescription('Creates a new team')
		.addStringOption(option =>
			option.setName('teamname')
				.setDescription('The name of your team')
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

		// Check if the team already exists
		if (teams[teamName]) {
			await interaction.reply(`A team with the name "${teamName}" already exists.`);
			return;
		}

		// Create a new team with all members starting at position 1
		teams[teamName] = {
			position: 1, // Set the starting position for the team
			members: {
				[interaction.user.id]: {
					username: interaction.user.username,
				}
			}
		};

		// Write the updated teams back to the teams.json file
		fs.writeFileSync(teamsFilePath, JSON.stringify(teams, null, 2));

		await interaction.reply(`Team "${teamName}" has been created and you have been added as the first member.`);
	},
};
