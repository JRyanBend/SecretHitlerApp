 'use strict';

function Players() {
    this.playerList = [];
}

// Set Player list
Players.prototype.setPlayers = function(players) {
    this.playerList = players;
};


// Return Player list
Players.prototype.getPlayers = function() {
    return this.playerList;
};

// Add Player
Players.prototype.addPlayer = function(socket, nick, ready) {
    this.playerList.push({ 
  		"user_id": socket,
  		"nick": nick,
  		"ready": ready }
  	)
};

// Remove Player
Players.prototype.removePlayer = function(remove) {
	this.playerList.splice(remove,1);
};

// Modify Player
Players.prototype.modifyPlayer = function(player, modifier, value) {
	this.playerList[player][modifier] = value;
};

module.exports = new Players();

