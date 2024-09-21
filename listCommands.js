const fs = require('fs');
const path = require('path');

const commandsFolderPath = path.join(__dirname, 'commands', 'utility');

// Function to read and log all command names and descriptions
function getSlashCommands() {
    fs.readdir(commandsFolderPath, (err, files) => {
        if (err) {
            return console.error(`Error reading commands folder: ${err.message}`);
        }

        const commands = files.filter(file => file.endsWith('.js'));

        if (commands.length === 0) {
            return console.log('No commands found.');
        }

        console.log(`Found ${commands.length} commands:\n`);
        commands.forEach(file => {
            const filePath = path.join(commandsFolderPath, file);
            const command = require(filePath);
            if (command.data && command.data.name && command.data.description) {
                console.log(`Command: /${command.data.name}`);
                console.log(`Description: ${command.data.description}\n`);
            } else {
                console.log(`Warning: Command in ${file} is missing 'name' or 'description'.`);
            }
        });
    });
}

getSlashCommands();
