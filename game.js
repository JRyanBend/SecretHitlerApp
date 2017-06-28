'use strict';

var Players = require('./Players');

function Game() {
  this.board = {"liberal": 0, "fascist": 0};
}

function allegianceRandomizer() {
	return Math.random() >= 0.5;
}

// Function for shuffling the array, found here: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
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
                     console.log(players[i] + " is a liberal!");
                } else {
                    Players.modifyPlayer(i, "team", "fascist");
                    fascists--;
                    console.log(players[i] + " is a fascist!");
                }
            } else {
                if(liberals > 0) {
                    Players.modifyPlayer(i, "team", "liberal");
                    liberals--;
                    console.log("We have enough fascists so " + players[i] + " is a liberal!");
                } else if(fascists > 0) {
                    Players.modifyPlayer(i, "team", "fascist");
                    fascists--;
                    console.log("We have enough fascists so " + players[i] + " is a fascist!");
                } else {
                    console.error("Error: Your facist/liberal count is off or something")
                }
            }
        }
    }

    return Players.getPlayers();
};

// Manages the policy cards, shuffling 
Game.prototype.getCards = function(stack) {

    var cards = [
        { "id": 1, "type": "liberal" },
        { "id": 2, "type": "liberal" },
        { "id": 3, "type": "liberal" },
        { "id": 4, "type": "liberal" },
        { "id": 5, "type": "liberal" },
        { "id": 6, "type": "liberal" },
        { "id": 7, "type": "fascist" },
        { "id": 8, "type": "fascist" },
        { "id": 9, "type": "fascist" },
        { "id": 10, "type": "fascist" },
        { "id": 11, "type": "fascist" },
        { "id": 12, "type": "fascist" },
        { "id": 13, "type": "fascist" },
        { "id": 14, "type": "fascist" },
        { "id": 15, "type": "fascist" },
        { "id": 16, "type": "fascist" },
        { "id": 17, "type": "fascist" }
    ];

    var cardStack;

    if (!stack || stack.length < 3) {
        cardStack = shuffle(cards);
    } else {
        cardStack = stack;
    }

    return cardStack;
};

// Return the current state of the board
Game.prototype.getBoard = function(card) {
    return this.board;
};

// Add a policy card to the board 
Game.prototype.addPolicy = function(card) {
    console.log("CARD:")
    console.log(card);
    if(card === "liberal") {
        this.board.liberal++;
    } else {
        this.board.fascist++;
    }

    console.log(this.board);
};


module.exports = new Game();