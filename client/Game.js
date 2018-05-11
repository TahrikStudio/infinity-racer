const POS_FACTOR = 1;
const ANGLE_FACTOR = 0.01;


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
		this._target_players;
		this.playing;
		this.cars = [];
		this.room;
		this.socket;
		this.bgm = this.add.audio('bg');
		this.updateFreq;
		this.updateCounter;
		this.controls = {};
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
			_game.world.setBounds(0, 0, data.world.width, data.world.height);
			_game.timeout = false;
			_game.showMessage("Starting game...", 120);
			_game.timer.stop();
			_game.playing = true;
			_game.players = data.players;
			_game.room = data.room;
			_game.updateFreq = data.updateFreq;
			_game.updateCounter = 0;	

			_game.renderDivider();
			_game.renderCars(_game.players);
			_game.renderControls();
			//_game.input.onTap.add(_game.turnCar, _game);
		});
		this.socket.on("update", function(data) {
			_game._target_players = data.players;
		});
		this.socket.on("disconnected", function(data) {
			_game.showMessage("Player " + data.id + " \ndisconnected from server");
		});
	},
	renderControls: function() {
		var center = this.camera.width / 2;
		this.controls.left = this.add.image(center - 60, this.camera.height - 100, 'left');
		this.controls.right = this.add.image(center + 60, this.camera.height - 100, 'right');
		this.controls.up = this.add.image(center, this.camera.height - 140, 'up');
		this.controls.down = this.add.image(center, this.camera.height - 60, 'down');

		this.controls.left.fixedToCamera = true;
		this.controls.right.fixedToCamera = true;
		this.controls.up.fixedToCamera = true;
		this.controls.down.fixedToCamera = true;
		
		this.controls.left.anchor.setTo(1, 0);
		this.controls.up.anchor.setTo(0.5, 0);
		this.controls.down.anchor.setTo(0.5, 0);

		this.controls.left.inputEnabled = true;
		this.controls.right.inputEnabled = true;
		this.controls.up.inputEnabled = true;
		this.controls.down.inputEnabled = true;
	},
	turnLeft: function(a, b) {
		this.turnCar(-1);
	},
	turnRight: function(a, b) {
		this.turnCar(1);
	},
	turnCar: function(factor) {
		console.log('turn car');
		var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
		var player = this.players[index];
		var target_player;

		if (this._target_players != undefined) {
			target_player = this._target_players[index];
			var diff = (target_player.angle - player.angle) / 5;
			if (diff > ANGLE_FACTOR && factor == 1 || diff < -ANGLE_FACTOR && factor == -1) {
				return;
			}
		}

		this.socket.emit('updateAngle', {room: this.room, factor: factor});
	},
	changeSpeed: function(factor) {
		this.socket.emit('updateSpeed', {room: this.room, factor: factor});
	},
	renderCars: function() {
		var tracks = this.players.length;
		var trackWidth = this.world.width / tracks;

		for (var i = 0; i < this.players.length; i++) {
			var player = this.players[i];
			var car = this.add.sprite(player.x, player.y, 'cars');
			car.anchor.setTo(0.5, 0.5);
			car.frame = player.car;
			this.cars.push(car);
		}
	},
	renderDivider: function() {
		for (var i = 0; i < this.world.height; i += 50) {
			this.add.image(this.world.width/ 2, i, 'road-bound').anchor.setTo(0.5, 0.5);
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
			this.checkInput();
			for (var i = 0; i < this.cars.length; i++) {
				var car = this.cars[i];
				var player = this.players[i];
				// var xdiff = Math.cos(player.angle) * player.velocity;
				// if (car.y > 60) {
				// 	car.y -= Math.sin(player.angle) * player.velocity;
				// }
				// if (car.x > 60 && xdiff < 0 || car.x < this.world.width - 60 && xdiff > 0) {
				// 	car.x += xdiff;
				// }
				
				car.angle = player.angle * 180 / Math.PI;

				if (this._target_players) {
					var target = this._target_players[i];
					var diff = target.angle - player.angle;
					if (diff > ANGLE_FACTOR) {
						player.angle += ANGLE_FACTOR;
					} else if (diff < -ANGLE_FACTOR) {
						player.angle -= ANGLE_FACTOR;
					}
					//player.angle = target.angle;
					player.velocity = target.velocity;

					var xdiff = player.x - target.x;
					var ydiff = player.y - target.y;

					if (Math.abs(xdiff) > POS_FACTOR) {
						if (xdiff > 0) {
							player.x -= Math.abs(Math.sin(player.angle) * POS_FACTOR);
						} else {
							player.x += Math.abs(Math.sin(player.angle) * POS_FACTOR);
						}
					} else {
						player.x = target.x;
					}

					if (Math.abs(ydiff) > POS_FACTOR) {
						if (ydiff > 0) {
							player.y -= Math.cos(player.angle) * POS_FACTOR * player.velocity;
						} else {
							player.y += Math.cos(player.angle) * POS_FACTOR * player.velocity;
						}
					} else {
						player.y = target.y;
					}
					car.x = player.x;
					car.y = player.y;
				}
			}
			var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
			var car = this.cars[index];
			this.camera.y = this.world.height - this.camera.height - (this.world.height - car.y) + 200;
		}
	},
	checkInput: function() {
		this.updateCounter = (this.updateCounter + 1) % this.updateFreq;
		if (this.updateCounter == 0 && this.input.activePointer.isDown) {
			if (this.controls.left.input.checkPointerOver(this.input.activePointer)) {
				this.turnLeft();
			} else if (this.controls.right.input.checkPointerOver(this.input.activePointer)) {
				this.turnRight();
			}
			if (this.controls.up.input.checkPointerOver(this.input.activePointer)) {
				this.changeSpeed(1);
			}
			if (this.controls.down.input.checkPointerOver(this.input.activePointer)) {
				this.changeSpeed(-1);
			}
		}
	}
}

