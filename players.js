 'use strict';


/* Example object 
{ 
  "user_id"    : socket,     // Large alpha numeric id assigned by socket.io when he user connects
  "nick"       : "Bill",     // String, no restrictions yet
  "ready"      : true,       // Boolean, Whether the player is ready or not 
  "chancellor" : true,       // Boolean, if the player is chancellor
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
        if (element.nick == nick) {
            player = element;
        }
    })

    return player || false;
};

// Get current President
Players.prototype.getPresident = function(remove) {
    var player;
    var local = this;

    this.playerList.forEach(function(element, index, array) {
        if (element.president == true) {
            console.log("President exists, it is: " + element.nick);
            player = element;
            if(remove) {
                local.modifyPlayer(index, "president", false);
            }
        }
    })

    if(!remove) {
        return player || false;
    }
};

// Get current Chancellor
Players.prototype.getChancellor = function(remove) {
    var player;
    var local = this;

    this.playerList.forEach(function(element, index, array) {
        if (element.chancellor == true) {
            console.log("Chancellor exists, it is: " + element.nick);
            player = element;
            if(remove) {
                local.modifyPlayer(index, "chancellor", false);
            }
        }
    })

    if(!remove) {
        return player || false;
    }
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

