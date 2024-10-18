const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rolldice")
    .setDescription("Rolls a d6 and updates the position of your team"),

  async execute(interaction) {
    console.log("Executing rollDice command");

    const teamsFilePath = path.join(__dirname, "../../teams.json");
    const gameBoardFilePath = path.join(__dirname, "../../gameBoard.json");
    const logsFilePath = path.join(__dirname, "../../logs.txt");

    try {
      // Defer the reply to give us time to process the command
      await interaction.deferReply({ ephemeral: true });
      console.log("Deferred reply for rollDice");

      // Read teams.json and gameBoard.json
      const teamsDataRaw = await fs.readFile(teamsFilePath, "utf-8");
      const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, "utf-8");
      const teamsData = JSON.parse(teamsDataRaw);
      const gameBoardData = JSON.parse(gameBoardDataRaw);

      // Find the user's team
      let userTeam = null;
      let userTeamName = "";
      let userMember = null;
      for (const [teamName, teamInfo] of Object.entries(teamsData)) {
        const member = teamInfo.members.find(
          (member) => member.discordID === interaction.user.id
        );
        if (member) {
          userTeam = teamInfo;
          userTeamName = teamName;
          userMember = member;
          break;
        }
      }

      if (!userTeam || !userMember) {
        return interaction.editReply({
          content: "You are not in any team. Please join a team first.",
        });
      }

      const currentPosition = userTeam.position.toString(); // Convert position to string

      // Check if a verification link exists for the current tile
      if (userMember.verificationLinks[currentPosition]) {
        const verification = userMember.verificationLinks[currentPosition];
        if (!verification.postVerificationLink) {
          return interaction.editReply({
            content:
              "You must submit a post-verification link for the current tile before rolling the dice. Please submit your verification first.",
          });
        }
      } else {
        return interaction.editReply({
          content:
            "You have not started verification for the current tile. Please submit verification before rolling the dice.",
        });
      }

      // If no verification is required or verification is complete, proceed with the roll
      const startingPosition = userTeam.position;
      const roll = Math.floor(Math.random() * 6) + 1;
      let newPosition = userTeam.position + roll;
      let additionalMovement = 0;
      let initialSpaceDescription = "No special action";
      let actionMessage = "";

      const lastSpacePosition = gameBoardData.game.board.size;
      const lastSpaceDetails = gameBoardData.game.board.spaces.find(
        (space) => space.position === lastSpacePosition
      );

      // Check if the new position exceeds the board size
      if (newPosition >= lastSpacePosition) {
        newPosition = lastSpacePosition;
        initialSpaceDescription = lastSpaceDetails
          ? lastSpaceDetails.description
          : "You've reached the last square!";
        initialSpaceDescription += ". Complete this task to win the game!";
        userTeam.position = newPosition;
      } else {
        userTeam.position = newPosition;

        // Check for space details
        const spaceDetails = gameBoardData.game.board.spaces.find(
          (space) => space.position === userTeam.position
        );
        if (spaceDetails) {
          initialSpaceDescription =
            spaceDetails.description || "No description available";

          // Check for 'move' action
          if (spaceDetails.action && spaceDetails.action.type === "move") {
            additionalMovement = spaceDetails.action.spaces || 0;
            userTeam.position += additionalMovement;
            actionMessage = `Result: You moved ${
              additionalMovement > 0 ? "forward" : "backward"
            } ${Math.abs(additionalMovement)} space(s).`;

            // Check the new space after additional movement
            const finalSpaceAfterAction = gameBoardData.game.board.spaces.find(
              (space) => space.position === userTeam.position
            );
            if (finalSpaceAfterAction) {
              actionMessage += `\nAfter the action, you landed on position ${userTeam.position}: ${finalSpaceAfterAction.description}`;
            }
          }

          // Check for 'per_member' verification
          if (
            spaceDetails.verification &&
            spaceDetails.verification.type === "per_member"
          ) {
            actionMessage += `\nReminder: You landed on a 'per_member' tile. Please submit your collection log or use the !kc command before proceeding.`;
          }
        }
      }

      // Save the updated teams data
      await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
      console.log("Successfully updated teams.json");

      // Log the roll and movement to logs.txt
      const finalPosition = userTeam.position;
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] User: ${interaction.user.tag} (ID: ${interaction.user.id}) | Command: rolldice | Started on: ${startingPosition}, Rolled: ${roll}, Landed on: ${newPosition}, Space Description: ${initialSpaceDescription}, Additional Move: ${additionalMovement}, Final Position: ${finalPosition}\n`;
      await fs.appendFile(logsFilePath, logMessage);
      console.log("Roll logged to logs.txt");

      // Construct the detailed response message
      let responseMessage = `You rolled a ${roll}. You landed on position ${newPosition}. ${initialSpaceDescription}`;
      if (actionMessage) {
        responseMessage += `\n${actionMessage}`;
      }

      // Reply with the detailed result
      await interaction.editReply({ content: responseMessage });
    } catch (error) {
      console.error("Error during rollDice command execution:", error);
      try {
        await interaction.editReply({
          content:
            "An error occurred while rolling the dice. Please try again later.",
        });
      } catch (editError) {
        console.error("Error editing reply in catch:", editError);
      }
    }
  },
};
