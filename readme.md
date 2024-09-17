# OSRS Themed Discord Game Bot

This Discord bot is designed for a team-based game inspired by Old School RuneScape (OSRS). It facilitates team management, game board movement, and task verification through a set of slash commands within a Discord server.

## Features

- **Team Management**: Create, join, and leave teams.
- **Game Board Movement**: Roll a six-sided die (d6) to advance your team on the game board.
- **Task Verification**: Submit screenshots as verification for tasks completed in the game.
- **Logging**: Automatically logs key actions such as team creation, dice rolls, and verification submissions to a log file for monitoring.

## Setup Instructions

1. **Environment Setup**: 
   - Ensure Node.js and npm are installed on your machine.
   - Obtain a Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications) and add it to a `.env` file as `DISCORD_TOKEN`.

2. **Install Dependencies**:
   - Run `npm install` to install the required dependencies.

3. **Prepare JSON Files**:
   - Make sure `teams.json` and `gameBoard.json` are present in the root directory. Initialize `teams.json` as an empty object `{}`. Define the game board layout in `gameBoard.json`.

4. **Run the Bot**:
   - Start the bot using `node index.js`.

## Commands Overview

- `/createteam <team_name>`: Creates a new team and adds the user to it.
- `/jointeam`: Lists available teams and allows the user to join one.
- `/leaveteam`: Allows a user to leave their current team.
- `/rolldice`: Rolls a d6 and moves the team forward on the board.
- `/submitverification`: Submits a screenshot for verification related to the team's current position.
- `/scoreboard`: Displays the current positions of all teams on the game board.

## Logging

Actions such as creating a team, joining a team, rolling dice, and leaving a team are logged in `logs.txt`. Each entry includes the user, the action performed, and relevant details (e.g., dice roll results).

## Internal Use Only

This bot is currently for internal use and testing. Future updates and additional documentation will be provided as the project evolves.

## Notes

- Ensure `teams.json` and `gameBoard.json` are kept updated and in sync with game logic.
- The bot must be added to a Discord server with appropriate permissions to execute these commands.
- Regularly check `logs.txt` for an overview of user actions and game progress.

---

For any issues or further assistance, please refer to the project maintainer.
