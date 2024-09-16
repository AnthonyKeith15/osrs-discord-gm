const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gameBoard = require('../../gameBoard.json'); // Adjusted path

// Path to the teams.json file
const teamsFilePath = path.join(__dirname, '../../teams.json'); // Adjust the path as needed

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team-status')
		.setDescription('Displays the status of the team you are on'),
	async execute(interaction) {
		// Read the current teams from the teams.json file
		let teams;
		try {
			teams = JSON.parse(fs.readFileSync(teamsFilePath, 'utf8'));
		} catch (error) {
			teams = {}; // If file doesn't exist or is empty, initialize an empty object
		}

		// Find the team to which the user belongs
		let userTeam = null;
		let userTeamName = '';
		for (const teamName in teams) {
			if (teams[teamName].members[interaction.user.id]) {
				userTeam = teams[teamName];
				userTeamName = teamName;
				break;
			}
		}

		// Check if the user is part of any team
		if (!userTeam) {
			await interaction.reply(`You are not part of any team. Please join or create a team first.`);
			return;
		}

		// Get the team's current position
		const teamPosition = userTeam.position;
		const currentSpace = gameBoard.boardSpaces.find(space => space.position === teamPosition);
		const spaceDescription = currentSpace ? currentSpace.description : 'Unknown space';

		// Construct the response with the team's current status
		let response = `**Team ${userTeamName} Status:**\n`;
		response += `- Position ${teamPosition} - ${spaceDescription}\n`;
		response += `**Members:**\n`;
		for (const memberId in userTeam.members) {
			const member = userTeam.members[memberId];
			response += `- **${member.username}**\n`;
		}

		await interaction.reply(response);
	},
};
