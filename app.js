const fs = require('fs');

// Read the JSON file
fs.readFile('./gameBoard.json', 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading gameBoard.json:', err);
    return;
  }

  try {
    // Parse the JSON data
    const gameBoards = JSON.parse(data);

    // Loop through each board and display required information
    gameBoards.boards.forEach((board) => {
      console.log(`Name: ${board.board_name}`);
      console.log(`Type: ${board.type}`);
      
      // Handle dynamic size for linear boards
      if (board.type === 'linear') {
        const size = board.spaces ? board.spaces.length : 'Unknown';
        console.log(`Size: ${size}`);
      } else if (board.type === 'bingo') {
        const size = board.spaces ? board.spaces.length : 'Unknown';
        console.log(`Size: ${size}`);
      }

      // Display startText if available
      if (board.startText) {
        console.log(`Start Text: ${board.startText}`);
      }

      // Display the first space of the board
      if (board.type === 'linear' && board.spaces && board.spaces.length > 0) {
        const firstSpace = board.spaces[0];
        console.log(`First Space (Linear) - ID: ${firstSpace.id}, Title: ${firstSpace.title}, Description: ${firstSpace.description}`);
      } else if (board.type === 'bingo' && board.spaces && board.spaces.length > 0) {
        const firstTile = board.spaces[0];
        console.log(`First Tile (Bingo) - ID: ${firstTile.id}, Title: ${firstTile.title}, Description: ${firstTile.description}`);
      }

      console.log('------------------------');  // Separator for clarity
    });

  } catch (err) {
    console.error('Error parsing gameBoard.json:', err);
  }
});
