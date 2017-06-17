'use strict';


function Conn() {
    this.express = require('express');
    this.app = this.express();
    this.http = require('http').Server(this.app);
    this.io = require('socket.io')(this.http);
}

// export express
Conn.prototype.express = function() {
    return this.express;
};

// export express app
Conn.prototype.app = function() {
    return this.app;
};

// export express
Conn.prototype.http = function() {
    return this.http;
};

// export express
Conn.prototype.io = function() {
    return this.io;
};

module.exports = new Conn();

