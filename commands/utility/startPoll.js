const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Admin command to start a new poll')
        .addStringOption(option => 
            option.setName('question')
                .setDescription('The question for the poll')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('How long the poll lasts (in hours)')
                .setRequired(true)) // duration comes before non-required options
        .addStringOption(option => 
            option.setName('answer1')
                .setDescription('First answer option')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('answer2')
                .setDescription('Second answer option')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('answer3')
                .setDescription('Third answer option')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('answer4')
                .setDescription('Fourth answer option')
                .setRequired(false)),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const answer1 = interaction.options.getString('answer1');
        const answer2 = interaction.options.getString('answer2');
        const answer3 = interaction.options.getString('answer3') || null;
        const answer4 = interaction.options.getString('answer4') || null;
        const duration = interaction.options.getInteger('duration') * 60 * 60 * 1000; // Convert hours to ms

        // Create poll content
        let pollContent = `**${question}**\nSelect your vote:`;

        // Create dropdown menu for voting
        const options = [
            { label: answer1, value: 'answer1' },
            { label: answer2, value: 'answer2' }
        ];
        if (answer3) options.push({ label: answer3, value: 'answer3' });
        if (answer4) options.push({ label: answer4, value: 'answer4' });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('poll_vote')
                    .setPlaceholder('Select your vote')
                    .addOptions(options)
            );

        // Send the poll message
        const message = await interaction.reply({
            content: pollContent,
            components: [row],
            fetchReply: true,
            ephemeral: true // Keep voting anonymous
        });

        // Set up vote tracking
        const votes = {
            answer1: new Set(),
            answer2: new Set(),
            answer3: new Set(),
            answer4: new Set()
        };

        // Handle vote collection
        const filter = (i) => i.customId === 'poll_vote' && !i.user.bot;
        const collector = message.createMessageComponentCollector({ filter, time: duration });

        collector.on('collect', async i => {
            const userVote = i.values[0]; // Get selected option
            const userId = i.user.id;

            // Clear any previous vote from this user
            for (const key in votes) {
                votes[key].delete(userId);
            }

            // Add new vote
            votes[userVote].add(userId);

            // Log live results in the console
            console.log('Current poll results:');
            console.log(`${answer1}: ${votes['answer1'].size} votes`);
            console.log(`${answer2}: ${votes['answer2'].size} votes`);
            if (answer3) console.log(`${answer3}: ${votes['answer3'].size} votes`);
            if (answer4) console.log(`${answer4}: ${votes['answer4'].size} votes`);

            // Confirm vote anonymously
            await i.reply({ content: 'Your vote has been recorded!', ephemeral: true });
        });

        collector.on('end', async () => {
            // Prepare the final results
            let results = '**Final Poll Results:**\n';
            results += `${answer1}: ${votes['answer1'].size} votes\n`;
            results += `${answer2}: ${votes['answer2'].size} votes\n`;
            if (answer3) results += `${answer3}: ${votes['answer3'].size} votes\n`;
            if (answer4) results += `${answer4}: ${votes['answer4'].size} votes\n`;

            // Display the final results
            await interaction.followUp({ content: results });
        });
    },
};
