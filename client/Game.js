
InfinityFighter.Game = function(game){
};

InfinityFighter.Game.prototype = {
	preload: function() {
		this.message;
		this.timer = this.time.create(false);
		this.timer.loop(1000, this.updateTimeout, this)
		this.timeout;
		this.countdown;
		this.players;
		this.playing;
		this.cars = [];
		this.room;
		this.socket;
		this.bgm = this.add.audio('bg');
	},
	create: function () {
		var _game = this;
		this.socket = io.connect(); // send a connection request to the server
		console.log("client started");
		this.socket.on("message", function(data) {
			_game.showMessage(data.message, 80);
		});
		this.socket.on("timeout", function(data) {
			_game.timeout = true;
			_game.countdown = data.timeout;
			_game.timer.start();
			_game.showMessage("Game will start \nin " + data.timeout + " seconds", 90);
		});
		this.socket.on("start", function(data) {
			_game.bgm.play();
			_game.world.setBounds(0, 0, _game.world.width, 2000);
			_game.timeout = false;
			_game.showMessage("Starting game...", 120);
			_game.timer.stop();
			_game.playing = true;
			_game.players = data.players;
			_game.room = data.room;			

			_game.renderRoadBound();
			_game.renderCars(_game.players);
			_game.input.onTap.add(_game.turnCar, _game);
		});
		this.socket.on("update", function(data) {
			_game.players = data.players;
		});
		this.socket.on("disconnected", function(data) {
			_game.showMessage("Player " + data.id + " \ndisconnected from server");
		});
	},
	turnCar: function(pointer) {
		if (pointer.clientX > this.world.width / 2) {
			this.socket.emit('updateAngle', {room: this.room, factor: -1});
		} else {
			this.socket.emit('updateAngle', {room: this.room, factor: 1});
		}
	},
	renderCars: function() {
		var tracks = this.players.length;
		var trackWidth = this.world.width / tracks;

		for (var i = 0; i < this.players.length; i++) {
			var player = this.players[i];
			var car = this.add.sprite((player.track + 0.5) * trackWidth, this.world.height - 100, 'cars');
			car.anchor.setTo(0.5, 0.5);
			car.frame = player.car;
			this.cars.push(car);
		}
	},
	renderRoadBound: function() {
		for (var i = 0; i < this.world.height; i += 50) {
			this.add.image(20, i, 'road-bound');
			this.add.image(this.world.width - 40, i, 'road-bound');
		}
	},
	showMessage: function(message, x = 0){
		if (this.message) {
			this.message.destroy();
		}
		this.message = this.add.bitmapText(x, this.world.centerY, 
			'eightbitwonder', message, 24);
		this.message.align = "center";
	},
	updateMessage: function(text) {
		this.message.setText(text);
	},
	updateTimeoutMessage: function(){
		if (this.timeout) {
			this.updateMessage("Game will start \nin " + this.countdown + " seconds");
		}
	},
	updateTimeout: function() {
		this.countdown--;
	},
	update: function() {
		this.updateTimeoutMessage();
		if (this.playing) {
			for (var i = 0; i < this.cars.length; i++) {
				var car = this.cars[i];
				var player = this.players[i];
				var xdiff = Math.cos(player.angle) * player.velocity;
				if (car.y > 60) {
					car.y -= Math.sin(player.angle) * player.velocity;
				}
				if (car.x > 60 && xdiff < 0 || car.x < this.world.width - 60 && xdiff > 0) {
					car.x += xdiff;
				}
				
				car.angle = -(player.angle - Math.PI / 2) * 180 / Math.PI;
			}
			var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
			var car = this.cars[index];
			this.camera.y = this.world.height - this.camera.height - (this.world.height - car.y) + 200;
		}
	}
}

