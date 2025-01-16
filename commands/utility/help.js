const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Displays a list of available commands and their descriptions"
    ),

  async execute(interaction) {
    const helpMessage = `
# 📜 Available Commands:

## **Team Management Commands:**
### `/createteam` - Create a team and join the game.
- This command allows you to create a **new team**.
- You **cannot** join an existing team with this command.

### `/jointeam` - Join an existing team.
- Use this command to **join an available team** if one has already been created.

### `/leaveteam` - Leave your current team.
- This command removes you from your team.
- **If a team becomes empty, it will be automatically disbanded.**

---

## **Gameplay Commands:**
### `/rolldice` - Roll a d6 to move forward on the board.
- This command rolls a **6-sided dice** and moves your team **forward** on the board.
- **You cannot roll until your team has submitted all required verification images** for the current tile.

### `/scoreboard` - View the current team standings.
- Displays **all team positions** and their progress on the game board.

### `/teaminfo` - View your team's details.
- Displays **your team's current position and members.**

---

## **Verification Commands:**
### `/submitimage` - Submit a verification image for your team.
- **Only one image can be submitted per command.**
- Some tiles **require multiple items** before the tile is completed.
- Once all required images are submitted, the team can **roll again**.

### **Rules for Multi-Item Tiles:**
✅ **Full Set Tiles** →  
- If a tile requires multiple pieces (**e.g., Barrows Set, DK Rings**),  
  **teams can submit images as they obtain each item.**  
- **The game will hold the submitted pieces** and **mark the tile complete** once all are collected.  
- Teams **do not have to submit the full set in one image.**  

        `;

    // Reply with the help message
    await interaction.reply({ content: helpMessage, ephemeral: true });
  },
};
