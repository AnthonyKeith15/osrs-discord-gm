# OSRS Themed Board Game - Rules & Commands

Welcome to the **OSRS Themed Board Game**! This project provides an interactive board game experience using a Discord bot. Teams compete to complete OSRS (Old School RuneScape) tasks, challenges, and events, racing to be the first to reach the final tile.

## Sections
1. [Before the Start](#section-1-before-the-start)
2. [The Game Start & Gameplay Loop](#section-2-the-game-start--gameplay-loop)
3. [Helper Functions & Extra Information](#section-3-helper-functions--extra-information)

## Section 1: Before the Start

### Creating, Joining, and Leaving Teams
Before the game begins, players must organize into teams.

### 1.1 Create a Team
- **Command:** `/create_team [team_name]`
- **Usage:** The player who uses this command becomes the team leader and the first member of the team.
- **Example:** `/create_team TeamAlpha`

### 1.2 Join a Team
- **Command:** `/jointeam`
- **Usage:** This command will bring up a list of available teams that you can join. Choose your team, and you will be added as a member.
- **Note:** You can only be in one team at a time, so choose wisely!

### 1.3 Leave a Team
- **Command:** `/leaveteam`
- **Usage:** Use this command to leave your current team.

### 1.4 View Team Info
- **Command:** `/teaminfo`
- **Usage:** View the current members of any teams.

---

## Section 2: The Game Start & Gameplay Loop

Once all the teams are formed, the game begins! Here’s everything you need to know:

### 2.1 Starting the Game
- **Command:** `/begingame`
- **Admin Only:** This command resets all teams and verification links, putting everyone back at square 1. After a 3... 2... 1... countdown, the game officially begins.

### 2.2 The Gameplay Loop
**Rolling the Dice:**
- **Command:** `/rolldice`
- **Usage:** Roll the dice to move your team forward on the board. Your team’s new position will be automatically updated based on the dice roll.

**Start Tile:**
- **Command:** `/starttile`
- **Usage:** After landing on a tile that requires verification (AKA a “Per Member” Tile), submit a starting screenshot of your current progress (e.g., Collection Log or !KC command).
- **Note:** This is required only for per_member tiles. For per_team tiles, you will only need to submit verification upon completion.

**End Tile:**
- **Command:** `/endtile`
- **Usage:** After completing the task for the tile, submit a final screenshot to verify your team’s completion. Admins will verify tiles and message teams as required.

**Bribe:**
- **Command:** `/bribe`
- **Usage:** Feeling desperate? You can bribe JD or PsyFungi (30M?) to roll a d3 and move back 1-3 spaces. Beware though—if you land on an action space, you’ll move back an additional space! The game will give you a funny reason for your misfortune.

**Landing on Action Tiles:**
- Move: Some tiles will have an action (e.g., moving you backward or forward). If you land on an action tile, you’ll be automatically moved as per the game board's instructions.
- **Example:** "You landed on an action tile and moved back an additional space due to a Goblin Chief's tax!"

---

## Section 3: Helper Functions & Extra Information

### 3.1 Scoreboard
- **Command:** `/scoreboard`
- **Usage:** View the current positions of all teams and check who’s leading the game.

### 3.2 Admin Commands
Admins have access to several additional commands:

**Move Team:**
- **Command:** `/moveteam [team_name] [position]`
- **Usage:** This command allows admins to manually adjust a team's position on the board.

**Verify Tiles:**
- **Command:** `/verify`
- **Usage:** Admins can verify completed tiles by reviewing submitted screenshots for each team. Once approved, the tile will be marked as complete.

---

### Additional Notes:
- **Game Objectives:** The goal of the game is to be the first team to reach the final tile (position 62) by completing challenges and tasks on the way.
- **Verification:** Every team must submit the correct pre- and post-verification screenshots to prove they’ve completed a challenge.

Good luck to all teams, and may the best adventurers win!
