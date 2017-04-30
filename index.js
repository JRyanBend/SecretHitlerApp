var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var people = [];
var current_user_count = 0;
var votes = 0;
var yes = 0;
var no = 0;
var ready = 0;
var gameStarted = false;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// RESET FUNCTION
// I want this to fire when the server restarts to reset all vars and connections
io.emit("disconnecter", "reset");

io.on('connection', function(socket){

    // Check if max players, if under 10, proceed, if over 10 reject connection
    if(current_user_count <= 10 && gameStarted === false) {
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
            people.push({ "user_id": socket.id, "nick": nick, "ready": false });
            io.emit("update users", people);
            console.log(people);
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
                    people.splice(i, 1);
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
            // Iterate over people array
            for(var i = 0;i < people.length;i++) {
                // If this person is ready
                if(people[i].ready == true) {
                    // Emit the start game event to them
                    io.to(people[i].user_id).emit("start game", name);
                } else {
                    // If they're not ready disconnect them
                    io.to(people[i].user_id).emit("disconnecter", true);
                    io.to(people[i].user_id).emit(true);  
                }
            }

            gameStarted = true;
            console.log(name + " has started the game. There are " + ready + " players in this game.");
        });


        /////////////////////////////////////////////////////////////////////////
        // Game Logic
        /////////////////////////////////////////////////////////////////////////

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

        // Too many players or game underway, refuse access
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

