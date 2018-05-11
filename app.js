//import express.js 
var express = require('express');
//assign it to variable app 
var app = express();
//create a server and pass in app as a request handler
var serv = require('http').Server(app); //Server-11

const TIMEOUT_BEFORE_START = 5;
const TURN_FACTOR = 0.40;
const INITIAL_VELOCITY = 2;
const PLAYER_COUNT = 2;
// Update angle & speed once in every UPDATE_FREQ frame
const UPDATE_FREQ = 20;
const SCREEN_HEIGHT = 800;
const SCREEN_WIDTH = 350;
const WORLD_HEIGHT = 4000;
const WORLD_WIDTH = SCREEN_WIDTH;
const SYNC_PERIOD = 300;
const POS_FACTOR = 30;
const TRACK_WIDTH = SCREEN_WIDTH / PLAYER_COUNT;
const SPEED_FACTOR = 1;

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
	constructor(id, car, track, x, y) {
		this.id = id;
		this.car = car;
		this.track = track;
		this.angle = 0;
		this.velocity = INITIAL_VELOCITY;
		this.x = x;
		this.y = y;
	}
}

class Room {
	constructor(id) {
		this.id = id;
		this.players = [];
		this.started = false;
	}

	isfull (){
		return this.players.length == PLAYER_COUNT || this.started;
	}

	isEmpty() {
		return this.players.length == 0;
	}

	addPlayer (socket) {
		var car_ix = Math.floor((Math.random() * 5));
		var track = this.players.length;
		var x = (track + 0.5) * TRACK_WIDTH;
		var y = WORLD_HEIGHT - 60;
		var player = new Player(socket.id, car_ix, track, x, y);
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

function updateSpeed(data) {
	var socket = this;
	var roomIndex = rooms.map(function(o) {return o.id}).indexOf(data.room);
	if (roomIndex > -1) {
		var room = rooms[roomIndex];
		var playerIndex = room.players.map(function (o) {return o.id}).indexOf(socket.id);
		if (playerIndex > -1) {
			var player = room.players[playerIndex];
			player.velocity += data.factor * SPEED_FACTOR;
			//sendData(room, 'update', {room: room.id, players: room.players});
		}
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

function updateParams(room) {
	for (var player of room.players) {
		var xdiff = Math.sin(player.angle) * player.velocity * POS_FACTOR;
		var ydiff = -Math.cos(player.angle) * player.velocity * POS_FACTOR;
		if (player.y > 60 && ydiff < 0 || player.y <= WORLD_HEIGHT - 60 && ydiff > 0) {
			player.y += ydiff;
		}
		if (player.x > 60 && xdiff < 0 || player.x < WORLD_WIDTH - 60 && xdiff > 0) {
			player.x += xdiff;
		}
	}
}

function syncClient(room) {
	updateParams(room);
	sendData(room, 'update', {room: room.id, players: room.players});
	setTimeout(syncClient.bind(null, room), SYNC_PERIOD);
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
			sendData(room, 'start', {
				room: room.id,
				players: room.players, 
				updateFreq: UPDATE_FREQ,
				world: {
					width: WORLD_WIDTH,
					height: WORLD_HEIGHT
				}
			});
			setTimeout(syncClient.bind(null, room), SYNC_PERIOD);
		}, TIMEOUT_BEFORE_START);
	}

	socket.on('updateAngle', updateAngle);
	socket.on('updateSpeed', updateSpeed);

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

