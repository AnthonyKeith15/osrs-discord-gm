const fs = require('fs');
const path = require('path');

// Path to the teams.json file
const filePath = path.join(__dirname, 'teams.json');

// Function to display the scoreboard
function displayScoreboard(teams) {
  console.clear(); // Clear the console before showing the new scoreboard
  console.log("===== SCOREBOARD =====");
  console.log("Team Standings:\n");

  // Sort teams by position
  const sortedTeams = Object.entries(teams).sort(([, teamA], [, teamB]) => teamA.position - teamB.position);

  sortedTeams.forEach(([teamName, teamInfo]) => {
    console.log(`Team: ${teamName} | Position: ${teamInfo.position}`);
    console.log("Members:");

    // Display each member's Discord name
    teamInfo.members.forEach(member => {
      console.log(`  - ${member.discordName}`);
    });

    console.log(''); // Add an empty line between teams for better readability
  });
}

// Function to load the JSON file and update the scoreboard
function loadAndDisplayScoreboard() {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      const teams = JSON.parse(data);
      displayScoreboard(teams);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  });
}

// Initial load of the scoreboard
loadAndDisplayScoreboard();

// Watch the teams.json file for changes
fs.watch(filePath, (eventType) => {
  if (eventType === 'change') {
    console.log('\nteams.json has been updated. Reloading scoreboard...');
    loadAndDisplayScoreboard(); // Reload the scoreboard on changes
  }
});
