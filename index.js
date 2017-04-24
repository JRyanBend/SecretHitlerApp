var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var people = [];
var current_user_count = 0;
var votes = 0;
var yes = 0;
var no = 0;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    //console.log(io.sockets.manager.connected);

    console.log("New user");
    // Check against max players
    if(current_user_count <= 10) {

        // Track user connections
        // (There has to be a better way to do this, but I have yet to find one)
        current_user_count++;
        io.emit('chat message', 'A user has connected');
        console.log("Current Usercount: " + current_user_count);


        // Connection check: when you reboot the node server it clears the user count
        // use this function to fix that or at least minimize impact
        socket.on('recon', function() {

        });

        //io.emit('recon')

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

        // Generate new user id
        socket.on('nickname', function(nick) {
            people.push({ "user_id": socket.id, "nick": nick, "ready": false });
            io.emit("update users", people);
        });

        // Update page userlist
        io.emit('update users', people);
        console.log(people);
        
        // User declares they are ready 
        socket.on('declare ready', function() {
            console.log(people);
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    if(people[i].ready === true) {
                        people[i].ready = false;    
                    } else {
                        people[i].ready = true;
                    }
                    
                }
            }
            console.log(people);
            io.emit("update users", people)
        });

        // Track user disconnections
        socket.on('disconnect', function() {
            current_user_count--;
            io.emit('chat message', 'A user has disconnected');
            console.log("Current usercount: " + current_user_count);

            // Remove user from people array
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    people.splice(i, 1);
                }
            }

            // Update page userlist
            io.emit('update_users', people);
        });

        // When message submitted, emits to entire userbase
        socket.on('chat message', function(msg) {
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    var add_nick = "<span class='messages__name'>" + people[i].nick + "</span>: " + msg;
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
                console.log("Here?")
                socket.emit("disconnecter", true);
                socket.disconnect(true);        
            }
        }
        
    }

    
});


http.listen(3000, function() {
    console.log('listening on *:3000');
});

