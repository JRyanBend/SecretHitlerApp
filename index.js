var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//Pattern test
var Players = require('./players');
var Game = require('./game');

var players = Players.getPlayers();
var game = Game;
var current_user_count = 0;
var votes = 0;
var yes = 0;
var no = 0;
var ready = 0;
var gameStarted = false;
var gameId = "";
var validUser = false;

// BASE EXPRESS FUNCTIONS
// Create path to static files
app.use(express.static('public'))

// Routing? I'm not even sure what this does
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Helper functions
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getComplexId(base, top) {
    return Math.random().toString(36).substr(base, top);
}

// RESET FUNCTION
// I want this to fire when the server restarts to reset all vars and connections
io.emit("disconnecter", "reset");

io.on('connection', function(socket){

    console.log("Current usercount: " + current_user_count + " and gameStarted: "+ gameStarted);
    // Game is in progress, but there's a possibility that they lost a player
    if(current_user_count < 10 && gameStarted === true) {
        // Check the user's cookie
        socket.emit("check cookie", socket.id);

        // They have a game id
        socket.on('cookie success', function(data) {
            console.log("Cokie suces")
            if(data[0] == gameId) {
                console.log("data = gameid suces")
                // If their gameId is the same as the current one, add them to the game
                //players.push({ "user_id": socket.id, "nick": data[1]});
                console.log(players);
                // Probably uneccessary, just use the socket.emit
                for(var i = 0;i < players.length;i++) {
                    if(players[i].rejoin_id == data[1]) {
                        console.log("gam start")
                        players[i].user_id = socket.id;
                        socket.emit("start game", [players[i].nick, gameId, true]);
                    }
                }

                io.emit("update users", Players.getPlayers());
                validUser = true;
            } else {
                // User has a valid game id, but it's not the current one
                socket.emit("disconnecter", "full");
                socket.disconnect(true);  
            }
        })

        socket.on('cookie failed', function(data){
            socket.emit("disconnecter", "full");
            socket.disconnect(true); 
        })
    }


    // Check if max players, if under 10, proceed, if over 10, reject connection
    if(current_user_count <= 10 && gameStarted === false) {
        validUser = true;
    }

    if(validUser) {
        /////////////////////////////////////////////////////////////////////////
        // User Tracking
        /////////////////////////////////////////////////////////////////////////

        // On connection, update everyones user list
        io.emit('update users', players);


        // Track user connections
        // (There has to be a better way to do this, but I have yet to find one)
        current_user_count++;


        // If game has started announce users connecting/disconnecting
        if(gameStarted) {
            io.emit('chat message', 'A user has connected');
        }
        console.log("Current Usercount: " + current_user_count);


        // Generate new user id
        socket.on('nickname', function(nick) {
            // On first run don't check for dupe names
            if(!players.length) {
                // Set the player in the players array
                Players.addPlayer(socket.id, nick, false);
                io.emit("update users", players);
                socket.emit("name error", false); 
            } else {
                // Since there are players now, check to see if there's any dupes
                var dupe = 0 ;
                for(var i = 0;i < players.length;i++) {
                    if(players[i].nick === nick) {
                        //if there are, set this flag
                        dupe = 1;
                    } 
                }

                // Check to see if the dupe flag was set
                if(dupe) {
                    // There's a dupelicate name! Send an error to the client
                    socket.emit("name error", true);        
                } else {
                    // All good, set the player in the players aray
                    Players.addPlayer(socket.id, nick, false);
                    io.emit("update users", players);
                    socket.emit("name error", false); 
                }
            }
        });


        // Track user disconnections
        socket.on('disconnect', function() {
            current_user_count--;
            io.emit('chat message', 'A user has disconnected');
            console.log("Current usercount: " + current_user_count);

            // Remove user from players array
            for(var i = 0;i < players.length;i++) {
                if(players[i].user_id == socket.id) {
                    if(players[i].ready) {
                        // Remove 'Start game' button if 'READY' users dips below 5
                        ready--;
                        if(ready < 5) {
                            io.emit('remove start')
                        }
                    }
                    if(!gameStarted) {
                        Players.removePlayer(i);
                    }
                }
            }

            // Update page userlist
            io.emit('update_users', Players.getPlayers());

            // Remove 'Start game' button if users dips below 5
            if(current_user_count < 5) {
                io.emit('remove start')
            }

            console.log("User disconnect ready count: " + ready);
        });



        /////////////////////////////////////////////////////////////////////////
        // Initial display logic
        /////////////////////////////////////////////////////////////////////////

        // User declares they are ready 
        socket.on('declare ready', function(isReady) {
            // For each user
            for(var i = 0;i < players.length;i++) {
                // If this is the current user
                if(players[i].user_id == socket.id) {
                    // Toggle their ready status
                    if(players[i].ready === true) {
                        Players.modifyPlayer(i, "ready", false);
                        ready--;  
                        console.log("ready count: " + ready);
                        if(ready < 5) {
                            io.emit('remove start');
                        }
                    } else {
                        Players.modifyPlayer(i, "ready", true);
                        ready++;
                        console.log("ready count: " + ready);
                    }  
                    
                }
            }

            // If there are more than 5 connections READY, AND you have hit ready
            // display a 'start game' button that anyone can hit
            // which will take everyone past the splash screen to the game screen
            if(current_user_count >= 5 && ready >= 5) {
                for(var i = 0;i < players.length;i++) {
                    if(players[i].ready == true) {
                        io.to(players[i].user_id).emit('start button');
                    } else {
                        io.to(players[i].user_id).emit('remove start');
                    }
                }
            }

            // Call 'update users' to update the user lists with the ready data
            io.emit("update users", Players.getPlayers())
        });



        // User has clicked 'Start Game!' push all users to the game screen
        socket.on('game started', function(name) {
            // Create GameId
            gameId = getComplexId(2, 5)

            console.log(players);
            // Trim the non ready users
            for(var i = 0;i < players.length;i++) {
                // If this person is ready
                console.log(i);
                if(players[i].ready != true) {
                    // If they're not ready disconnect them
                    io.to(players[i].user_id).emit("disconnecter", "started");

                    // splice the user from the array
                    Players.removePlayer(i);
                }
            }

            // Here we're going to assign them their allegiance/character
            // This should definitely be it's own function somewhere else. But I'm still in the proof-of-concept phase and no one will ever see this so fuck it.
            // First get a random number from 1 - ready to mark hitler
            var secretHitler = getRandomIntInclusive(0, ready - 1);
            console.log("secret hitler #: " + secretHitler);
            console.log("Ready: " +ready);

            // Next cycle through the ready players and assign them random classes based on how many players there are
            switch (ready) {
                case 5:
                    var liberals = 3;
                    var fascists = 1;
                    console.log("Game organizer: " + ready);

                    players = game.teamOrganizer(players, liberals, fascists, secretHitler);
                    break;
                case 6:
                    var liberals = 3;
                    var fascists = 2;
                    console.log("Game organizer: " + ready);

                    game.teamOrganizer(players, liberals, fascists, secretHitler);
                    break;
                case 7:
                    var liberals = 4;
                    var fascists = 2;
                    console.log("Game organizer: " + ready);

                    game.teamOrganizer(players, liberals, fascists, secretHitler);
                    break;
                case 8:
                    var liberals = 4;
                    var fascists = 3;
                    console.log("Game organizer: " + ready);

                    game.teamOrganizer(players, liberals, fascists, secretHitler);
                    break;
                case 9:
                    var liberals = 5;
                    var fascists = 3;
                    console.log("Game organizer: " + ready);

                    game.teamOrganizer(players, liberals, fascists, secretHitler);
                case 10:
                    var liberals = 5;
                    var fascists = 4;
                    console.log("Game organizer: " + ready);

                    game.teamOrganizer(players, liberals, fascists, secretHitler);
                    break;
                default:
                console.log('You started a game, but somehow you don\'t have 5 - 10 players. Something went wrong.');
            }

            // Iterate over players array
            for(var i = 0;i < players.length;i++) {
                // Generate unique rejoin ID
                var rejoinId = getComplexId(1, 4);

                // Amend rejoin ID to object property
                Players.modifyPlayer(i, "rejoin_id", rejoinId);

                // Emit the start game event to all players
                if(players[i]["hitler"]) {
                    // Emit the start game event to them
                    io.to(players[i].user_id).emit("start game", [name, gameId, false, players[i].rejoin_id, players[i].team, players[i].hitler]);
                } else {
                    io.to(players[i].user_id).emit("start game", [name, gameId, false, players[i].rejoin_id, players[i].team]);
                }   

            }
            console.log(players);

            gameStarted = true;
            console.log(name + " has started the game. There are " + ready + " players in this game.");

            // Fire off the first chancellor vote
            // Select a random player and emit that socket call to them
///////////////// WAS BREAKING STUFF SO COMMENTED OUT FOR NOW
            // var random_starting_player = getRandomIntInclusive(0, players.length);
            // io.to(players[random_starting_player].user_id).emit("chancellor select");
        });


        /////////////////////////////////////////////////////////////////////////
        // Game Logic
        /////////////////////////////////////////////////////////////////////////

        /* Old test voting
        // Call for a vote
        socket.on('call vote', function(test) {
            console.log("Vote called");
            io.emit("vote called", "data");

            console.log("votes = " + votes);
        });


        // User has voted
        socket.on('voted', function(vote) {
            if(vote) {
                console.log("Voted Yes");
                yes++;
            } else {
                console.log("Voted No");
                no++;
            }
            votes++;

            console.log("players.length = " + players.length);
            console.log("votes = " + votes);

            if (votes === players.length) {
                if(yes > no) {
                    console.log("The Ja's have it!");
                    io.emit("vote complete", true);
                } else {
                    console.log("The Nein's have it!");
                    io.emit("vote complete", false);
                }
                votes = 0;
                yes = 0;
                no = 0;
                console.log("Vote has concluded, values should be reset.");
            }
        }); */

        // Vote has been collected
        socket.on('call vote', function(vote) {
            if(vote) {
                console.log("Voted Yes");
                yes++;
            } else {
                console.log("Voted No");
                no++;
            }
            votes++;

            console.log("players.length = " + players.length);
            console.log("votes = " + votes);

            if (votes === players.length) {
                if(yes > no) {
                    console.log("The Ja's have it!");
                    io.emit("vote complete", true);
                } else {
                    console.log("The Nein's have it!");
                    io.emit("vote complete", false);
                }
                votes = 0;
                yes = 0;
                no = 0;
                console.log("Vote has concluded, values should be reset.");
            }
        });


        // When message submitted, emits to entire userbase
        socket.on('chat message', function(msg) {
            for(var i = 0;i < players.length;i++) {
                if(players[i].user_id == socket.id) {
                    var add_nick = "<span class='text--bold'>" + players[i].nick + "</span>: " + msg;
                    io.emit('chat message', add_nick);
                }
            }
        });

    } else { 

        console.log("players.length = " + players.length);

        // Too many players or game underway and user isn't reconnecting, refuse access
        for(var i = 0;i < current_user_count;i++) {
            console.log("players id = " + players[i].user_id)
            console.log("Socket id = " + socket.id)
            if (players[i].user_id == socket.id) {
                //do nothing!
                console.log("You get to stay!");
            } else {
                if(gameStarted) {
                    socket.emit("disconnecter", "started");
                } else {
                    socket.emit("disconnecter", "full");
                }
                socket.disconnect(true);        
            }
        }
        
    }

    
});


http.listen(3000, function() {
    console.log('listening on *:3000');
});

