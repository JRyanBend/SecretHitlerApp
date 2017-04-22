var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var people = [];
var current_user_count = 0;
var votes = 0;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    // Check against max players
    if(people.length < 2) {

        // Connection check: when you reboot the node server it clears the user count
        // use this function to fix that or at least minimize impact
        socket.on('recon', function() {

        });

        //io.emit('recon')

        // Call for a vote
        socket.on('call vote', function(test) {
            console.log("Vote called");
            io.emit("vote called", "data");
        });

        // User has voted
        socket.on('voted', function(vote) {
            if(vote) {
                console.log("Voted Yes");
            } else {
                console.log("Voted No");
            }
            votes++;
        });

        // Track user connections
        io.emit('chat message', 'A user has connected');
        current_user_count = people.length + 1;
        console.log("Current Usercount: " + current_user_count);

        // Generate new user id
        socket.on('nickname', function(nick) {
            people.push({ "user_id": socket.id, "nick": nick });
            io.emit("update users", people);
        });

        // Update page userlist
        io.emit("update users", people);

        console.log(people);
        
        // Track user disconnections
        socket.on('disconnect', function() {
            io.emit('chat message', 'A user has disconnected');
            console.log("Current usercount: " + current_user_count);

            // Remove user from people array
            for(var i = 0;i < people.length;i++) {
                if(people[i].user_id == socket.id) {
                    people.splice(i, 1);
                }
            }

            // Update page userlist
            io.emit("update_users", people);
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
        io.emit("disconnecter", true);
        socket.disconnect(true);
    }

    
});


http.listen(3000, function() {
    console.log('listening on *:3000');
});

