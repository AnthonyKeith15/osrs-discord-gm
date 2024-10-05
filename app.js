const fs = require('fs');

// Load gameBoard.json
fs.readFile('gameBoard.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading gameBoard.json:', err);
        return;
    }

    try {
        const gameBoard = JSON.parse(data);
        const board = gameBoard.boards[0]; // Assuming we're only checking the first board
        const missingNotes = [];

        // Iterate through spaces to check prefix and suffix
        board.spaces.forEach(space => {
            const { notes } = space;
            
            // Check if the completion_requirements is 'action'
            if (space.completion_requirements === 'action') {
                // If action, it should only have a prefix
                if (!notes.prefix || notes.suffix) {
                    missingNotes.push({
                        id: space.id,
                        title: space.title,
                        issue: !notes.prefix ? 'Missing prefix' : 'Should not have suffix for action'
                    });
                }
            } else {
                // If not 'action', it should have both prefix and suffix
                if (!notes.prefix || !notes.suffix) {
                    missingNotes.push({
                        id: space.id,
                        title: space.title,
                        issue: !notes.prefix ? 'Missing prefix' : 'Missing suffix'
                    });
                }
            }
        });

        // Output tiles missing prefix or suffix
        if (missingNotes.length > 0) {
            console.log('Tiles with missing or incorrect notes:', missingNotes);
        } else {
            console.log('All tiles have the correct notes.');
        }

    } catch (err) {
        console.error('Error parsing gameBoard.json:', err);
    }
});
