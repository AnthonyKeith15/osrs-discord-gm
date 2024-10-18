const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

let isExecuting = false;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scoreboard")
    .setDescription(
      "Shows the current positions of all teams and their bribe amounts"
    ),

  async execute(interaction) {
    if (isExecuting) {
      console.log("Scoreboard command is already being executed");
      return;
    }
    isExecuting = true;
    console.log("Executing scoreboard command");

    // Define the paths to the teams.json and gameBoard.json files
    const teamsFilePath = path.join(__dirname, "../../teams.json");
    const gameBoardFilePath = path.join(__dirname, "../../gameBoard.json");

    try {
      // Defer the reply to give us time to process the command
      await interaction.deferReply({ ephemeral: true });
      console.log("Deferred reply for scoreboard");

      // Read teams.json
      const teamsDataRaw = await fs.readFile(teamsFilePath, "utf-8");
      const teamsData = JSON.parse(teamsDataRaw);
      console.log("Successfully read teams.json for scoreboard");

      // Read gameBoard.json
      const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, "utf-8");
      const gameBoardData = JSON.parse(gameBoardDataRaw);
      console.log("Successfully read gameBoard.json for scoreboard");

      // Create a map of positions to descriptions for quick lookup
      const positionDescriptions = {};
      for (const space of gameBoardData.game.board.spaces) {
        positionDescriptions[space.position] = space.description;
      }

      // Sort the teams by their current position (descending order, so closest to finish comes first)
      const sortedTeams = Object.entries(teamsData).sort(
        ([, a], [, b]) => b.position - a.position
      );

      // Create the scoreboard message
      let scoreboard = "**Team Positions, Descriptions, and Bribes Owed:**\n";
      for (const [teamName, teamInfo] of sortedTeams) {
        const position = teamInfo.position;
        const description =
          positionDescriptions[position] || "No description available";
        const bribeOwed = teamInfo.bribeOwed
          ? `${teamInfo.bribeOwed.toLocaleString()} GP`
          : "0 GP";
        scoreboard += `**${teamName}** - Position: ${position} - Description: ${description} - Bribes Owed: ${bribeOwed}\n`;
      }

      // Send the scoreboard message
      await interaction.editReply({ content: scoreboard });
    } catch (error) {
      console.error("Error during scoreboard command execution:", error);
      try {
        await interaction.editReply({
          content:
            "An error occurred while accessing the team or game board data. Please try again later.",
        });
      } catch (editError) {
        console.error(
          "Error when trying to edit reply after scoreboard error:",
          editError
        );
      }
    } finally {
      isExecuting = false;
    }
  },
};
