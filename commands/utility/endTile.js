const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("endtile")
    .setDescription("Submit an ending verification screenshot for your current position")
    .addAttachmentOption(option => 
      option.setName("image")
        .setDescription("Upload a single screenshot")
        .setRequired(true)),

  async execute(interaction) {
    console.log("Executing endtile command");

    const teamsFilePath = path.join(__dirname, "../../teams.json");
    const gameBoardFilePath = path.join(__dirname, "../../gameBoard.json");

    // Hash map defining required images per tile (default: 1 image)
    const requiredImagesPerTile = {
      "1": 4, "15": 2, "27": 3, "35": 2
    };

    try {
      await interaction.deferReply({ ephemeral: true });

      console.log("Interaction options:", interaction.options.data); // Debugging step

      const teamsData = JSON.parse(await fs.readFile(teamsFilePath, "utf-8"));
      const gameBoardData = JSON.parse(await fs.readFile(gameBoardFilePath, "utf-8"));

      let userTeam = null, userTeamName = "", userMember = null;
      for (const [teamName, teamInfo] of Object.entries(teamsData)) {
        const member = teamInfo.members.find(m => m.discordID === interaction.user.id);
        if (member) {
          userTeam = teamInfo;
          userTeamName = teamName;
          userMember = member;
          break;
        }
      }

      if (!userTeam || !userMember) {
        await interaction.editReply({ content: "You are not in a team. Please join a team first." });
        return;
      }

      const currentPosition = userTeam.position.toString();
      const currentSpace = gameBoardData.game.board.spaces.find(space => space.position === userTeam.position);

      if (!currentSpace) {
        await interaction.editReply({ content: "Invalid position on the board. Please try again." });
        return;
      }

      const requiredImages = requiredImagesPerTile[currentPosition] || 1;
      const image = interaction.options.getAttachment("image");

      if (!image) {
        await interaction.editReply({ content: "No image attached. Please upload an image." });
        return;
      }

      // Initialize verification storage if not present
      if (!userMember.verificationLinks[currentPosition]) {
        userMember.verificationLinks[currentPosition] = { postVerificationLinks: [], isVerified: false };
      }

      // Store the submitted image
      userMember.verificationLinks[currentPosition].postVerificationLinks.push(image.url);
      await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));

      console.log(`Updated verification for tile ${currentPosition}`);

      // Count total images submitted across the team for this tile
      let totalImagesSubmitted = 0;
      userTeam.members.forEach(member => {
        if (member.verificationLinks[currentPosition]?.postVerificationLinks) {
          totalImagesSubmitted += member.verificationLinks[currentPosition].postVerificationLinks.length;
        }
      });

      if (totalImagesSubmitted >= requiredImages) {
        await interaction.followUp({
          content: `🎉 **Team ${userTeamName}** has successfully completed tile ${currentPosition} with ${totalImagesSubmitted}/${requiredImages} images!`,
          ephemeral: false,
        });

        userMember.verificationLinks[currentPosition].isVerified = true;
      } else {
        await interaction.editReply({
          content: `✅ Your image has been submitted for position ${currentPosition}. Waiting for more images... (${totalImagesSubmitted}/${requiredImages} needed)`,
        });
      }
    } catch (error) {
      console.error("Error during endtile execution:", error);
      await interaction.editReply({ content: "An error occurred. Please try again later." });
    }
  },
};
