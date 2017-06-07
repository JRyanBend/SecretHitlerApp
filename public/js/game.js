'use strict';

var Players = require('./Players');

function Game() {
  //this.store = {};
}

function allegianceRandomizer() {
	return Math.random() >= 0.5;
}

Game.prototype.teamOrganizer = function(playerList, liberals, fascists, secretHitler) {
	var liberals = liberals;
	var fascists = fascists;
	var players = liberals + fascists + 1;
	var secretHitler = secretHitler;
    Players.setPlayers(playerList);

    console.log("Player List:");
	console.log(playerList);

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
                    console.log("fascist!");
                }
            } else {
                if(liberals > 0) {
                    Players.modifyPlayer(i, "team", "liberal");
                    liberals--;
                    console.log("liberal2!");
                } else if(fascists > 0) {
                    Players.modifyPlayer(i, "team", "fascist");
                    fascists--;
                    console.log("fascist2!");
                } else {
                    console.error("Error: Your facist/liberal count is off or something")
                }
            }
        }
    }

    return Players.getPlayers();
};

module.exports = new Game();