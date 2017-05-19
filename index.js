var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var people = [];
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
                //people.push({ "user_id": socket.id, "nick": data[1]});
                console.log(people);
                // Probably uneccessary, just use the socket.emit
                for(var i = 0;i < people.length;i++) {
                    if(people[i].rejoin_id == data[1]) {
                        console.log("gam start")
                        people[i].user_id = socket.id;
                        socket.emit("start game", [people[i].nick, gameId, true]);
                    }
                }

                io.emit("update users", people);
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
        io.emit('update users', people);


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
            if(!people.length) {
                // Set the player in the people array
                people.push({ "user_id": socket.id, "nick": nick, "ready": false });
                io.emit("update users", people);
                socket.emit("name error", false); 
            } else {
                // Since there are people now, check to see if there's any dupes
                var dupe = 0 ;
                for(var i = 0;i < people.length;i++) {
                    if(people[i].nick === nick) {
                        //if there are, set this flag
                        dupe = 1;
                    } 
                }

                // Check to see if the dupe flag was set
                if(dupe) {
                    // There's a dupelicate name! Send an error to the client
                    socket.emit("name error", true);        
                } else {
                    // All good, set the player in the people aray
                    people.push({ "user_id": socket.id, "nick": nick, "ready": false });
                    io.emit("update users", people);
                    socket.emit("name error", false); 
                }
            }
        });


        // Track user disconnections
        socket.on('disconnect', function() {
            current_user_count--;
            io.emit('chat message', 'A user has disconnected');
            console.log("Current usercount: " + current_user_count);

            // Remove user from people array
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    if(people[i].ready) {
                        // Remove 'Start game' button if 'READY' users dips below 5
                        ready--;
                        if(ready < 5) {
                            io.emit('remove start')
                        }
                    }
                    if(!gameStarted) {
                        people.splice(i,1);
                    }
                }
            }

            // Update page userlist
            io.emit('update_users', people);

            // Remove 'Start game' button if users dips below 5
            if(current_user_count < 5) {
                io.emit('remove start')
            }

            console.log("User disconnect ready count: " + ready);
        });

        // TODO: GET INTO THIS
        // Connection check: when you reboot the node server it clears the user count
        // use this function to fix that or at least minimize impact
        socket.on('recon', function() {

        });
        //io.emit('recon')


        /////////////////////////////////////////////////////////////////////////
        // Initial display logic
        /////////////////////////////////////////////////////////////////////////

        // User declares they are ready 
        socket.on('declare ready', function(isReady) {
            // For each user
            for(var i = 0;i < people.length;i++) {
                // If this is the current user
                if(people[i].user_id == socket.id) {
                    // Toggle their ready status
                    if(people[i].ready === true) {
                        people[i].ready = false;  
                        ready--;  
                        console.log("ready count: " + ready);
                        if(ready < 5) {
                            io.emit('remove start');
                        }
                    } else {
                        people[i].ready = true;
                        ready++;
                        console.log("ready count: " + ready);
                    }  
                    
                }
            }

            // If there are more than 5 connections READY, AND you have hit ready
            // display a 'start game' button that anyone can hit
            // which will take everyone past the splash screen to the game screen
            if(current_user_count >= 5 && ready >= 5) {
                for(var i = 0;i < people.length;i++) {
                    if(people[i].ready == true) {
                        io.to(people[i].user_id).emit('start button');
                    } else {
                        io.to(people[i].user_id).emit('remove start');
                    }
                }
            }

            // Call 'update users' to update the user lists with the ready data
            io.emit("update users", people)
        });



        // User has clicked 'Start Game!' push all users to the game screen
        socket.on('game started', function(name) {
            // Create GameId
            gameId = getComplexId(2, 5)

            console.log(people);
            // Trim the non ready users
            for(var i = 0;i < people.length;i++) {
                // If this person is ready
                console.log(i);
                if(people[i].ready != true) {
                    // If they're not ready disconnect them
                    io.to(people[i].user_id).emit("disconnecter", "started");

                    // splice the user from the array
                    people.splice(i, 1);   
                }
            }

            // Here we're going to assign them their allegiance/character
            // This should definitely be it's own function somewhere else. But I'm still in the proof-of-concept phase and no one will ever see this so fuck it.
            // First get a random number from 1 - ready to mark hitler
            var secret_hitler = getRandomIntInclusive(0, ready - 1);
            console.log("secret hitler #: " + secret_hitler);
            console.log("Ready: " +ready);
            // Next cycle through the ready players and assign them random classes based on how many people there are
            switch (ready) {
                case 5:
                var liberals = 3;
                var fascists = 1;
                console.log("Made it!");

                for(var i = 0;i < ready;i++) {
                    if(i === secret_hitler){ 
                        people[i].team = "fascist";
                        people[i].hitler = true;
                        console.log("Hitler!");
                    } else {
                        if(liberals > 0 && fascists > 0) {
                            var allegiance_randomizer = Math.random() >= 0.5;
                            if(allegiance_randomizer === true) {
                                people[i].team = "liberal";
                                liberals--;
                                 console.log("liberal!");
                            } else {
                                people[i].team = "fascist";
                                fascists--;
                                console.log("fasral!");
                            }
                        } else {
                            if(liberals > 0) {
                                people[i].team = "liberal";
                                liberals--;
                                console.log("liberal2!");
                            } else if(fascists > 0) {
                                people[i].team = "fascist";
                                fascists--;
                                console.log("fasral2!");
                            } else {
                                console.log("Error: Your facist liberal count is off or something")
                            }
                        }
                    }

                }
                break;
              case 6:
                console.log('6 player game');
                break;
              case 7:
                console.log('7 player game');
                break;
              case 8:
                console.log('8 player game');
                break;
              case 9:
                console.log('9 player game');
              case 10:
                console.log('10 player game');
                break;
              default:
                console.log('You started a game, but somehow you don\'t have 5 - 10 players. Something went wrong.');
            }

            // Iterate over people array
            for(var i = 0;i < people.length;i++) {
                // Generate unique rejoin ID
                var rejoinId = getComplexId(1, 4);

                // Amend rejoin ID to object property
                people[i]["rejoin_id"] = rejoinId;

                // Emit the start game event to all players
                if(people[i]["hitler"]) {
                    // Emit the start game event to them
                    io.to(people[i].user_id).emit("start game", [name, gameId, false, people[i].rejoin_id, people[i].team, people[i].hitler]);
                } else {
                    io.to(people[i].user_id).emit("start game", [name, gameId, false, people[i].rejoin_id, people[i].team]);
                }   

            }
            console.log(people);

            gameStarted = true;
            console.log(name + " has started the game. There are " + ready + " players in this game.");

            // Fire off the first chancellor vote
            // Select a random player and emit that socket call to them
            var random_starting_player = getRandomIntInclusive(0, people.length);
            io.to(people[random_starting_player].user_id).emit("chancellor select");
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

            console.log("people.length = " + people.length);
            console.log("votes = " + votes);

            if (votes === people.length) {
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

            console.log("people.length = " + people.length);
            console.log("votes = " + votes);

            if (votes === people.length) {
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
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    var add_nick = "<span class='text--bold'>" + people[i].nick + "</span>: " + msg;
                    io.emit('chat message', add_nick);
                }
            }
        });

    } else { 

        console.log("People.length = " + people.length);

        // Too many players or game underway and user isn't reconnecting, refuse access
        for(var i = 0;i < current_user_count;i++) {
            console.log("People id = " + people[i].user_id)
            console.log("Socket id = " + socket.id)
            if (people[i].user_id == socket.id) {
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

