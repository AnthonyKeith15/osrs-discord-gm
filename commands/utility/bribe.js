const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bribe")
    .setDescription(
      "Bribe an NPC and roll a d3 to move back tiles. Each bribe costs 15m GP."
    ),

  async execute(interaction) {
    console.log("Executing bribe command");

    // Define the paths to the teams.json and gameBoard.json files
    const teamsFilePath = path.join(__dirname, "../../teams.json");
    const gameBoardFilePath = path.join(__dirname, "../../gameBoard.json");

    try {
      // Find the user's team
      const teamsDataRaw = await fs.readFile(teamsFilePath, "utf-8");
      const teamsData = JSON.parse(teamsDataRaw);

      let userTeam = null;
      for (const teamInfo of Object.values(teamsData)) {
        const member = teamInfo.members.find(
          (member) => member.discordID === interaction.user.id
        );
        if (member) {
          userTeam = teamInfo;
          break;
        }
      }

      if (!userTeam) {
        await interaction.reply({
          content: "You are not in any team. Please join a team first.",
          ephemeral: true,
        });
        return;
      }

      // Confirmation message with buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm_bribe")
          .setLabel("Confirm Bribe")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cancel_bribe")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content:
          "Are you sure you want to bribe an NPC? This will move you backward and cost your team 15m GP.",
        components: [row],
        ephemeral: true,
      });

      // Create a message component collector for the buttons
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 15000, // 15 seconds to respond
      });

      collector.on("collect", async (i) => {
        if (i.customId === "confirm_bribe") {
          await i.update({
            content: "Bribe confirmed! Rolling the dice...",
            components: [],
          });

          // Roll a d3 to determine how many spaces to move back
          const roll = Math.floor(Math.random() * 3) + 1; // d3 roll
          console.log(`Rolled a d3: ${roll}`);

          // Store the initial position and calculate the new position
          const initialPosition = userTeam.position;
          let newPosition = initialPosition - roll;

          // Ensure the new position doesn't go below 1
          newPosition = Math.max(1, newPosition);

          // Read gameBoard.json
          const gameBoardDataRaw = await fs.readFile(
            gameBoardFilePath,
            "utf-8"
          );
          const gameBoardData = JSON.parse(gameBoardDataRaw);

          // Check if the new position is an action space
          const currentSpace = gameBoardData.game.board.spaces.find(
            (space) => space.position === newPosition
          );

          // If it's an action space, move back one additional space
          let additionalMove = 0;
          if (
            currentSpace &&
            currentSpace.action &&
            currentSpace.action.type === "move"
          ) {
            additionalMove = -1; // Move back one more space
            newPosition = Math.max(1, newPosition + additionalMove);
          }

          // Find the description of the new space
          const newSpaceDetails = gameBoardData.game.board.spaces.find(
            (space) => space.position === newPosition
          );
          const newSpaceDescription = newSpaceDetails
            ? newSpaceDetails.description
            : "No description available";

          // Update the team's position and bribe amount in the teams.json data
          userTeam.position = newPosition;

          // Initialize the `bribeOwed` if it doesn't exist
          if (!userTeam.bribeOwed) {
            userTeam.bribeOwed = 0;
          }

          // Add 15m GP to the team's bribe owed
          userTeam.bribeOwed += 15000000;

          // Save the updated teams data back to the JSON file
          await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
          console.log(
            "Successfully updated teams.json with new position after bribe and updated bribeOwed"
          );

          // Send the result message
          let responseMessage = `You rolled a ${roll} and moved back to position ${newPosition} - ${newSpaceDescription}.`;
          if (additionalMove !== 0) {
            responseMessage += `\nYou landed on an action space and were moved back one additional space!`;
          }
          responseMessage += `\nYour team now owes ${userTeam.bribeOwed.toLocaleString()} GP for bribes.`;

          await interaction.followUp({
            content: responseMessage,
            ephemeral: false,
          });
        } else if (i.customId === "cancel_bribe") {
          await i.update({ content: "Bribe canceled.", components: [] });
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          interaction.editReply({
            content: "You did not respond in time, bribe canceled.",
            components: [],
          });
        }
      });
    } catch (error) {
      console.error("Error during bribe command execution:", error);
      try {
        await interaction.editReply({
          content:
            "An error occurred while processing your bribe. Please try again later.",
          ephemeral: true,
        });
      } catch (editError) {
        console.error(
          "Error when trying to edit reply after bribe error:",
          editError
        );
      }
    }
  },
};
