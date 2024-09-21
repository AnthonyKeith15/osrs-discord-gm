const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bribe')
        .setDescription('Bribe an NPC and roll a d3 to move back tiles. Additional penalty if you land on an action space.'),

    async execute(interaction) {
        console.log('Executing bribe command');

        // Define the paths to the teams.json and gameBoard.json files
        const teamsFilePath = path.join(__dirname, '../../teams.json');
        const gameBoardFilePath = path.join(__dirname, '../../gameBoard.json');

        // Define the humorous prompts with `${roll}` for the dice roll value
        const prompts = [
            "The Drunken Dwarf mistakes you for his best friend and forces a kebab into your hands. You lose your next turn trying to sober up while moving back ${roll} space(s).",
            "A Goblin Chief forces you to carry his loot back to Goblin Village. Move back ${roll} space(s).",
            "The Wise Old Man convinces you to 'donate' your gold for his next heist. Move back ${roll} space(s) while he runs off with your money.",
            "You go on a wild goose chase during a Treasure Trail. Move back ${roll} space(s) while digging up junk.",
            "A mischievous wizard sells you an 'enhanced' air rune, which blows up! You’re sent flying back ${roll} space(s).",
            "Tenzing charges you for useless climbing boots, causing you to trip and move back ${roll} space(s).",
            "You get lost in the Stronghold of Security and move back ${roll} space(s) trying to avoid a minotaur.",
            "You lose a bet on a Gnomeball game and have to move back ${roll} space(s) in shame.",
            "You hop on a Dwarven mine cart, only for it to go backward! Move back ${roll} space(s).",
            "You bribe the Nardah Genie for an extra wish, but he misinterprets it, sending you back ${roll} space(s).",
            "Saradomin frowns upon your greed. In his disappointment, he sends you back ${roll} space(s).",
            "Zamorak laughs at your foolish attempt to bribe, causing chaos in your path. Move back ${roll} space(s).",
            "Guthix is disturbed by your imbalance. To restore harmony, he moves you back ${roll} space(s).",
            "Armadyl punishes you for meddling with mortal affairs. You feel a gust of wind push you back ${roll} space(s).",
            "Bandos, angered by your lack of strength, throws you back ${roll} space(s) with a mighty blow.",
            "Seren gently scolds you for your impatience, nudging you back ${roll} space(s) to reflect on your journey."
        ];

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for bribe');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            const teamsData = JSON.parse(teamsDataRaw);

            // Read gameBoard.json
            const gameBoardDataRaw = await fs.readFile(gameBoardFilePath, 'utf-8');
            const gameBoardData = JSON.parse(gameBoardDataRaw);

            // Find the user's team
            let userTeam = null;
            for (const teamInfo of Object.values(teamsData)) {
                const member = teamInfo.members.find(member => member.discordID === interaction.user.id);
                if (member) {
                    userTeam = teamInfo;
                    break;
                }
            }

            if (!userTeam) {
                await interaction.editReply({ content: 'You are not in any team. Please join a team first.' });
                return;
            }

            // Roll a d3 to determine how many spaces to move back
            const roll = Math.floor(Math.random() * 3) + 1; // d3 roll
            console.log(`Rolled a d3: ${roll}`);

            // Store the initial position and calculate the new position
            const initialPosition = userTeam.position;
            let newPosition = initialPosition - roll;

            // Ensure the new position doesn't go below 1
            newPosition = Math.max(1, newPosition);

            // Check if the new position is an action space
            const currentSpace = gameBoardData.game.board.spaces.find(space => space.position === newPosition);

            // If it's an action space, move back one additional space
            let additionalMove = 0;
            if (currentSpace && currentSpace.action && currentSpace.action.type === 'move') {
                additionalMove = -1; // Move back one more space
                newPosition = Math.max(1, newPosition + additionalMove);
            }

            // Find the description of the new space
            const newSpaceDetails = gameBoardData.game.board.spaces.find(space => space.position === newPosition);
            const newSpaceDescription = newSpaceDetails ? newSpaceDetails.description : 'No description available';

            // Randomly select a humorous prompt and replace `${roll}` with the actual dice roll
            let selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            selectedPrompt = selectedPrompt.replace('${roll}', roll);
            console.log('Selected prompt:', selectedPrompt);

            // Update the team's position in the teams.json data
            userTeam.position = newPosition;

            // Save the updated teams data back to the JSON file
            await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
            console.log('Successfully updated teams.json with new position after bribe');

            // Log the outcome for the user
            let responseMessage = `${selectedPrompt}\nYou moved back to position ${newPosition} - ${newSpaceDescription}.`;
            if (additionalMove !== 0) {
                responseMessage += `\nYou landed on an action space and were moved back one additional space!`;
            }

            await interaction.editReply({ content: responseMessage });

        } catch (error) {
            console.error('Error during bribe command execution:', error);
            try {
                await interaction.editReply({ content: 'An error occurred while processing your bribe. Please try again later.' });
            } catch (editError) {
                console.error('Error when trying to edit reply after bribe error:', editError);
            }
        }
    },
};
