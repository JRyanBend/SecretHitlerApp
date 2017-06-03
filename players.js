 'use strict';


/* Example object 
{ 
  "user_id"    : socket,     // Large alpha numeric id assigned by socket.io when he user connects
  "nick"       : "Bill",     // String, no restrictions yet
  "ready"      : true,       // Boolean, Whether the player is ready or not 
  "president"  : true,       // Boolean, if the player is president
  "team"       : "liberal",  // String, either liberal or fascist
  "hitler"     : true        // Boolean, whether the user is hitler
}
*/

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

// Get Player with nick
Players.prototype.getPlayerWithNick = function(nick) {
    var player;

    this.playerList.forEach(function(element, index, array) {
        console.log("Players prototype element " + element.nick);
        console.log("Players prototype nick " + nick);
        if (element.nick == nick) {
            console.log("Why isn't this returning?")
            player = element;
        }
    })

    return player || false;
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

