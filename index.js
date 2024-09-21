const fs = require('fs'); // Regular fs for synchronous functions
const fsp = require('fs').promises; // fs.promises for asynchronous functions
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Load environment variables

// Access the token from process.env
const token = process.env.DISCORD_TOKEN;

// Define the list of admins
const admins = ['196901285071552513', '628042644865679382', '756701883749498981']; // Use Discord IDs for vngchrome, samonbbx, and lazy jesus

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.admins = admins; // Set the admins on the client instance

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath); // Using regular fs for synchronous reading

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // Sync read
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Function to log actions to logs.txt (using fs.promises)
async function addToLog(actionDescription, user) {
    const logsFilePath = path.join(__dirname, 'logs.txt');
    try {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] User: ${user.tag} (ID: ${user.id}) | ${actionDescription}\n`;

        // Append the log message to the logs file using fs.promises (fsp)
        await fsp.appendFile(logsFilePath, logMessage);
        console.log('Action logged:', logMessage.trim());
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    const { cooldowns } = client;

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 2; // Default cooldown duration in seconds
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1_000);
            return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    if (command) {
        try {
            // Check if the command is admin-only
            if (command.adminOnly && !client.admins.includes(interaction.user.id)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            // Execute the command
            await command.execute(interaction);

            // Log the successful command execution
            await addToLog(`Executed command \`${command.data.name}\``, interaction.user);
        } catch (error) {
            if (error.code !== 10062) {
                console.error(`Error executing command: ${error}`);
            }
        }
    }
});

// Global error handlers
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// Log in to Discord with your client's token
client.login(token);

// Log that the bot is running
client.once('ready', () => {
    console.log(`${client.user.tag} is now running!`);
});
