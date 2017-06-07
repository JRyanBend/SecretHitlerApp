var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Players = require('./public/js/conn');

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
var currentPresident;
var currentChancellorCandidate;
var currentChancellor;
var voteRecord = [];

// BASE EXPRESS FUNCTIONS
// Create path to static files
app.use(express.static('public'))

// Routing? I'm not even sure what this does
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// RESET FUNCTION
// I want this to fire when the server restarts to reset all vars and connections
io.emit("disconnecter", "reset");




http.listen(3000, function() {
    console.log('listening on *:3000');
});

