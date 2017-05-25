'use strict';

var Players = require('./Players');

function Game() {
  //this.store = {};
}

function allegianceRandomizer() {
	return Math.random() >= 0.5;
}

Game.prototype.teamOrganizer = function(player_list, liberals, fascists, secretHitler) {
	var liberals = liberals;
	var fascists = fascists;
	var players = liberals + fascists + 1;
	var secretHitler = secretHitler;
    Players.setPlayers(player_list);

	console.log("DID YO MAKE IT?")
	console.log(player_list);
	console.log("Players length:"+ players.length);
	console.log(secretHitler + " " + liberals + " " + fascists);

	for(var i = 0;i < players;i++) {
        if(i === secretHitler){ 
            Players.modifyPlayer(i, "team", "fascist");
            Players.modifyPlayer(i, "hitler", true);
            console.log("Hitler!");
        } else {
            if(liberals > 0 && fascists > 0) {
                var allegiance_randomizer = Math.random() >= 0.5;
                if(allegiance_randomizer === true) {
                    Players.modifyPlayer(i, "team", "liberal");
                    liberals--;
                     console.log("liberal!");
                } else {
                    Players.modifyPlayer(i, "team", "fascist");
                    fascists--;
                    console.log("fasral!");
                }
            } else {
                if(liberals > 0) {
                    Players.modifyPlayer(i, "team", "liberal");
                    liberals--;
                    console.log("liberal2!");
                } else if(fascists > 0) {
                    Players.modifyPlayer(i, "team", "fascist");
                    fascists--;
                    console.log("fasral2!");
                } else {
                    console.log("Error: Your facist liberal count is off or something")
                }
            }
        }
    }

    return Players.getPlayers();
};

module.exports = new Game();