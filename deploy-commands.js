const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, 'commands'); // Base commands folder

// Recursively read all subdirectories (including 'commands/utility/')
const getAllCommandFiles = (dirPath) => {
    let commandFiles = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            commandFiles = commandFiles.concat(getAllCommandFiles(filePath)); // Recursively read subfolders
        } else if (file.endsWith('.js')) {
            commandFiles.push(filePath);
        }
    }
    return commandFiles;
};

// Load commands from all subdirectories
const commandFiles = getAllCommandFiles(commandsPath);

for (const filePath of commandFiles) {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
