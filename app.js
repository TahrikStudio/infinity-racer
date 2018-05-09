//import express.js 
var express = require('express');
//assign it to variable app 
var app = express();
//create a server and pass in app as a request handler
var serv = require('http').Server(app); //Server-11

const TIMEOUT_BEFORE_START = 5;
const TURN_FACTOR = 0.10;

//send a index.html file when a get request is fired to the given 
//route, which is ‘/’ in this case
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});


app.use('/client', express.static(__dirname + '/client'));

//listen on port 2000
serv.listen(process.env.PORT || 2000);
console.log("Server started.");

// binds the serv object we created to socket.io
var io = require('socket.io')(serv, {});

var roomIndex = 0;
var rooms = [];

class Player {
	constructor(id, car, track) {
		this.id = id;
		this.car = car;
		this.track = track;
		this.angle = Math.PI / 2;
		this.velocity = 1;
	}
}

class Room {
	constructor(id) {
		this.id = id;
		this.players = [];
		this.started = false;
	}

	isfull (){
		return this.players.length == 2 || this.started;
	}

	isEmpty() {
		return this.players.length == 0;
	}

	addPlayer (socket) {
		var player = new Player(socket.id, Math.floor((Math.random() * 5)), this.players.length);
		this.players.push(player);
	}

	removePlayer(socket) {
		var index = this.players.map(function(o) {
			return o.id;
		}).indexOf(socket.id);
		
		if (index > -1) {
			this.players.splice(index, 1);
		}
	}

	start() {
		this.started = true;
	}
}

/**
 * Pickup a room with spaces or create a new room if any room
 * 
 */
var pickupRoom = function () {

	for (var room of rooms) {
		if (!room.isfull()) {
			return room;
		}
	}

	var room = new Room(roomIndex++);
	rooms.push(room);
	return room;
}

function findRoomWithSocket(socket) {
	var currentRoom;
	for (var room of rooms) {
		if (room.players.map(function (o) {
			return o.id;
		}).indexOf(socket.id) > -1) {
			currentRoom = room;
			break;
		}
	}
	return currentRoom;
}

function sendData(room, event, data) {
	for (var player of room.players) {
		io.sockets.connected[player.id].emit(event, data);
	}
}

function updateAngle(data) {
	var socket = this;
	var roomIndex = rooms.map(function(o) {return o.id}).indexOf(data.room);
	if (roomIndex > -1) {
		var room = rooms[roomIndex];
		var playerIndex = room.players.map(function (o) {return o.id}).indexOf(socket.id);
		if (playerIndex > -1) {
			var player = room.players[playerIndex];
			player.angle += data.factor * TURN_FACTOR;
			sendData(room, 'update', {room: room.id, players: room.players});
		}
	}
}

// listen for a connection request from any client
io.sockets.on('connection', function (socket) {
	socket.emit('connect', {message: 'Connection established'});

	var room = pickupRoom();
	room.addPlayer(socket);
	if (!room.isfull()) {
		socket.emit('message', {message: 'Waiting for other\nplayers'});
	} else {
		sendData(room, 'timeout', {timeout: TIMEOUT_BEFORE_START});
		room.start();
		setTimeout(function() {
			sendData(room, 'start', {room: room.id, players: room.players});
		}, TIMEOUT_BEFORE_START);
	}

	socket.on('updateAngle', updateAngle);

	socket.on('disconnect', function() {
		var room = findRoomWithSocket(socket);
		if (room) {
			room.removePlayer(socket);
			if (room.isEmpty()) {
				var index = rooms.indexOf(room);
				rooms.splice(index, 1);
			} else {
				sendData(room, 'disconnected', {id: socket.id});
			}
		}
		//socket.removeAllListeners('disconnect');
	});

});

