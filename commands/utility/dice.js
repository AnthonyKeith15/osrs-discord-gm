const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gameBoard = require('../../gameBoard.json'); // Adjusted path

// Path to the teams.json file
const teamsFilePath = path.join(__dirname, '../../teams.json'); // Adjust the path as needed

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll-dice')
		.setDescription('Rolls a D6 and moves on the game board'),
	async execute(interaction) {
		// Read the current teams from the teams.json file
		let teams;
		try {
			teams = JSON.parse(fs.readFileSync(teamsFilePath, 'utf8'));
		} catch (error) {
			teams = {}; // If file doesn't exist or is empty, initialize an empty object
		}

		// Find the team to which the user belongs
		let userTeamName = null;
		for (const teamName in teams) {
			if (teams[teamName].members[interaction.user.id]) {
				userTeamName = teamName;
				break;
			}
		}

		// Check if the user is part of any team
		if (!userTeamName) {
			await interaction.reply(`You are not part of any team. Please join or create a team first.`);
			return;
		}

		// Get the user from the team
		const player = teams[userTeamName].members[interaction.user.id];

		// Dice roll logic: generate a random number between 1 and 6
		const diceRoll = Math.floor(Math.random() * 6) + 1;

		// Update the player's position on the board
		player.position += diceRoll;

		// Ensure the player position doesn't exceed the board's length
		if (player.position > gameBoard.boardSpaces.length) {
			player.position = gameBoard.boardSpaces.length; // Cap at the last space
		}

		// Get the current board space based on the player's new position
		const currentSpace = gameBoard.boardSpaces.find(space => space.position === player.position);

		// Write the updated teams back to the teams.json file
		fs.writeFileSync(teamsFilePath, JSON.stringify(teams, null, 2));

		// Construct a response with the new position and the description of the space
		const response = `🎲 You rolled a ${diceRoll}!\nYou moved to space ${currentSpace.position}: ${currentSpace.description}`;

		// Reply to the user with the result
		await interaction.reply(response);
	},
};
