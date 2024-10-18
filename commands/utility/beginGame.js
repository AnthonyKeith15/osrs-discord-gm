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
    .setName("begingame")
    .setDescription(
      "Admin-only: Begins the game by resetting all teams and clearing verification links."
    ),

  adminOnly: true, // This marks it as an admin-only command

  async execute(interaction) {
    console.log("Executing begingame command");

    // Prompt the admin with a confirmation message
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_reset")
        .setLabel("Yes, start the game!")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_reset")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content:
        "This will reset all teams back to the beginning, and all progress will be lost. Are you sure you want to start the game?",
      components: [row],
      ephemeral: true, // Only visible to the admin
    });

    // Create a button interaction collector to handle the response
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 15000, // 15 seconds to respond
    });

    collector.on("collect", async (i) => {
      if (i.customId === "confirm_reset") {
        await i.update({
          content: "Get ready, the game is about to begin!",
          components: [],
        });

        // Perform the reset and dramatic countdown
        await resetGame(interaction);

        // Start the dramatic countdown
        await interaction.followUp({ content: "3...", ephemeral: false });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second pause
        await interaction.followUp({ content: "2...", ephemeral: false });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second pause
        await interaction.followUp({ content: "1...", ephemeral: false });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second pause
        await interaction.followUp({
          content: "Go! The game has begun! Best of luck to all teams!",
          ephemeral: false,
        });
      } else if (i.customId === "cancel_reset") {
        await i.update({ content: "Game start canceled.", components: [] });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "You did not respond in time, game start canceled.",
          components: [],
        });
      }
    });
  },
};

// Function to reset the game
async function resetGame(interaction) {
  const teamsFilePath = path.join(__dirname, "../../teams.json");

  try {
    // Create an empty object to reset teams data
    const emptyTeamsData = {};

    // Save the blank object to the teams.json file
    await fs.writeFile(teamsFilePath, JSON.stringify(emptyTeamsData, null, 2));
    console.log("Successfully reset teams.json to a blank object.");

    // Optionally, you can send a success message to the interaction
    await interaction.editReply({
      content: "The game has been successfully reset.",
    });
  } catch (error) {
    console.error("Error during game reset:", error);
    try {
      await interaction.editReply({
        content:
          "An error occurred while resetting the game. Please try again later.",
      });
    } catch (editError) {
      console.error(
        "Error when trying to edit reply after game reset error:",
        editError
      );
    }
  }
}
