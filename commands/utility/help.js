const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Displays a list of available commands and their descriptions"
    ),

  async execute(interaction) {
    const helpMessage = `
**Available Commands:**

1. **/createteam** - Create a team and join the game.
   - This command allows you to create your own single-player team and participate in the game.

2. **/rolldice** - Roll a d6 to move forward on the board.
   - This command will roll a 6-sided dice and move your team forward on the game board accordingly.

3. **/scoreboard** - View the current team standings.
   - Displays the current positions of all teams and their progress on the game board.

4. **/endtile** - Submit the post-verification screenshot for your current tile.
   - Use this command to submit an image for verification when you finish a tile task.

5. **/bribe** - Bribe an NPC to move back a few tiles.
   - Roll a d3 to move back a few tiles, but beware, you may face penalties if you land on an action space. A bribe costs 15m.

**How to Play:**
- Start by creating your own team using **/createteam**.
- Roll the dice using **/rolldice** to move forward.
- Check the standings anytime with **/scoreboard**.
- Submit your post-verification screenshots with **/endtile** when you finish a task.
- Use **/bribe** to manipulate your position on the board by moving back, but it comes at a cost.
        `;

    // Reply with the help message
    await interaction.reply({ content: helpMessage, ephemeral: true });
  },
};
