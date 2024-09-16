const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gameBoard = require('../../gameBoard.json'); // Adjusted path

// Path to the teams.json file
const teamsFilePath = path.join(__dirname, '../../teams.json'); // Adjust the path as needed

module.exports = {
	data: new SlashCommandBuilder()
		.setName('board-status')
		.setDescription('Displays the status of all teams on the board'),
	async execute(interaction) {
		// Read the current teams from the teams.json file
		let teams;
		try {
			teams = JSON.parse(fs.readFileSync(teamsFilePath, 'utf8'));
		} catch (error) {
			teams = {}; // If file doesn't exist or is empty, initialize an empty object
		}

		// Construct the response with the status of all teams
		let response = `**Board Status:**\n`;
		for (const teamName in teams) {
			const team = teams[teamName];
			const teamPosition = team.position; // Get the team's position
			const currentSpace = gameBoard.boardSpaces.find(space => space.position === teamPosition);
			const spaceDescription = currentSpace ? currentSpace.description : 'Unknown space';

			// Add team and position info
			response += `**Team ${teamName}:**\n`;
			response += `- Position ${teamPosition} - ${spaceDescription}\n`;

			// List all members of the team
			for (const memberId in team.members) {
				const member = team.members[memberId];
				response += `  - **${member.username}**\n`;
			}
			response += '\n';
		}

		await interaction.reply(response);
	},
};
