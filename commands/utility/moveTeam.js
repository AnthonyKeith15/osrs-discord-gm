const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moveteam')
        .setDescription('Admin command to move a team'),

    adminOnly: true, // Restrict command to admins

    async execute(interaction) {
        console.log('Executing moveteam command');

        // Define the path to the teams.json file
        const teamsFilePath = path.join(__dirname, '../../teams.json');

        try {
            // Defer the reply to give us time to process the command
            await interaction.deferReply({ ephemeral: true });
            console.log('Deferred reply for moveteam');

            // Read teams.json
            const teamsDataRaw = await fs.readFile(teamsFilePath, 'utf-8');
            console.log('Successfully read teams.json');
            const teamsData = JSON.parse(teamsDataRaw);

            // Create an array of options for the select menu, including team name and current position
            const teamOptions = Object.entries(teamsData).map(([teamName, teamInfo]) => ({
                label: `${teamName} (Current: ${teamInfo.position})`, // Shows both the team name and its current position
                value: teamName
            }));

            // Check if there are any teams available
            if (teamOptions.length === 0) {
                return interaction.editReply({ content: 'No teams available to move.' });
            }

            // Create a select menu for the admin to choose a team
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_team')
                .setPlaceholder('Select a team to move')
                .addOptions(teamOptions);

            // Create the action row to hold the select menu
            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Send the select menu to the admin
            await interaction.editReply({ content: 'Choose a team to move:', components: [row] });
            console.log('Sent team selection menu to admin');

            // Create a message component collector to handle the admin's selection
            const filter = i => i.customId === 'select_team' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 15000 });

            collector.on('collect', async i => {
                if (!i.isStringSelectMenu()) return;

                const selectedTeam = i.values[0];
                console.log(`Admin selected team: ${selectedTeam}`);

                // Create a modal to ask for the position
                const modal = new ModalBuilder()
                    .setCustomId('position_modal')
                    .setTitle(`Move ${selectedTeam}`);

                const positionInput = new TextInputBuilder()
                    .setCustomId('position_input')
                    .setLabel('Enter the position to move the team to')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const modalRow = new ActionRowBuilder().addComponents(positionInput);
                modal.addComponents(modalRow);

                // Show the modal to the admin
                await i.showModal(modal);

                // Collect the modal input (position)
                const modalFilter = (interaction) => interaction.customId === 'position_modal' && interaction.user.id === i.user.id;
                const submitted = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 });

                const newPosition = parseInt(submitted.fields.getTextInputValue('position_input'));
                if (isNaN(newPosition) || newPosition < 1) {
                    return submitted.reply({ content: 'Invalid position. Please enter a valid number.', ephemeral: true });
                }

                // Move the selected team to the specified position
                teamsData[selectedTeam].position = newPosition;

                // Save the updated teams.json file
                await fs.writeFile(teamsFilePath, JSON.stringify(teamsData, null, 2));
                console.log(`Successfully moved ${selectedTeam} to position ${newPosition}`);

                // Update the message to confirm the movement
                await submitted.reply({ content: `Team **${selectedTeam}** has been moved to position **${newPosition}**.` });
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    console.log('Team selection menu expired without a selection');
                    await interaction.editReply({ content: 'No team selected.', components: [] });
                }
            });

        } catch (error) {
            console.error('Error during moveteam command execution:', error);
            await interaction.editReply({ content: 'An error occurred while moving the team. Please try again later.' });
        }
    },
};
