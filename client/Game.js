const POS_FACTOR = 1;
const ANGLE_FACTOR = 0.01;
const STATUS_HEIGHT = 60;


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
		this.updateCounter = 0;
		this.controls = {};
		this.current_player;
		this.status = {};
		this.score_board = {};
	},
	create: function () {
		var _game = this;
		this.socket = io.connect(); // send a connection request to the server
		console.log("client started");
		this.socket.on("message", function(data) {
			_game.showMessage(data.message);
		});
		this.socket.on("timeout", function(data) {
			_game.timeout = true;
			_game.countdown = data.timeout;
			_game.timer.start();
			_game.showMessage("Game will start \nin " + data.timeout + " seconds", 90);
		});
		this.socket.on("start", function(data) {
			console.log("Received start command");
			console.log("initial data " + data.players);
			_game.bgm.play();
			if (_game.sound.usingWebAudio &&
				_game.sound.context.state === 'suspended') {
				_game.input.onTap.addOnce(_game.sound.context.resume, _game.sound.context);
			}
			_game.world.setBounds(0, 0, data.world.width, data.world.height);
			_game.timeout = false;
			_game.showMessage("Starting game...", 120);
			_game.timer.stop();
			_game.playing = true;
			_game.players = data.players;
			_game.room = data.room;
			_game.updateFreq = data.updateFreq;
			_game.updateCounter = 0;	
			_game.time.advancedTiming = true;
			_game.camera.width = data.world.width;
			_game.renderRoad();
			_game.renderFinish();
			_game.renderCars(_game.players);
			_game.renderControls();
			_game.renderStatus()
			_game.renderScoreBoard();
			
			//_game.input.onTap.add(_game.turnCar, _game);
		});
		this.socket.on("update", function(data) {
			_game._target_players = data.players;
		});
		this.socket.on("disconnected", function(data) {
			_game.showMessage("Player " + data.id + " \ndisconnected from server");
		});
	},
	renderFinish() {
		var finish = this.add.image(0, STATUS_HEIGHT, 'finish');
	},
	renderStatus: function() {
		// Render background
		var width = this.camera.width;
		var height = STATUS_HEIGHT;
		var bmd = this.add.bitmapData(width, height);
		bmd.ctx.beginPath();
		bmd.ctx.rect(0, 0, width, height);
		bmd.ctx.fillStyle = 'black';
		bmd.ctx.fill();
		this.add.sprite(0, 0, bmd).fixedToCamera = true;

		var player = this.currentPlayer();
		this.status.position = this.add.text(20, 20, "Position : " + player.position, {
			font: "16px Arial", 
			fill: "#fff"
		});
		this.status.speed = this.add.text(this.camera.width - 20, 20,    "Speed : " + player.velocity, {
			font: "16px Arial", 
			fill: "#fff"
		});
		this.status.speed.anchor.setTo(1, 0);

		this.status.position.fixedToCamera = true;
		this.status.speed.fixedToCamera = true;
	},
	updateStatus: function() {
		var player = this.currentPlayer();
		this.status.position.setText("Position : " + player.position);
		this.status.speed.setText("Speed : " + player.velocity)
	},
	currentPlayer: function() {
		if (this.current_player == undefined) {
			var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
			this.current_player = this.players[index];
		}
		return this.current_player;
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
		this.turnCar(1);
	},
	turnRight: function(a, b) {
		this.turnCar(-1);
	},
	turnCar: function(factor) {
		var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
		var player = this.players[index];
		var target_player;

		if (this._target_players != undefined) {
			target_player = this._target_players[index];
			var diff = (target_player.angle - player.angle) / 5;
			// if (target_player.angle > Math.PI / 2 || target_player.angle < -Math.PI / 2) {
			// 	return;
			// }
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
	renderRoad: function() {
		for (var i = 0; i < this.world.height; i += 204) {
			this.add.image(0, i, 'road');
		}
	},
	showMessage: function(message, x = this.camera.width / 2){
		if (this.message) {
			this.message.destroy();
		}
		this.message = this.add.text(x, this.world.centerY, message, {
			font: "bold 24px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.message.anchor.setTo(0.5, 0.5);
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
		console.log(this.time.fps);
		this.updateTimeoutMessage();
		if (this.playing) {
			this.checkInput();
			this.updateStatus();
			for (var i = 0; i < this.cars.length; i++) {
				var car = this.cars[i];
				var player = this.players[i];
				if (player.finished) continue;

				
				car.angle = this.math.radToDeg(Math.PI / 2 - player.angle);// * 180 / Math.PI;

				if (this._target_players) {
					var target = this._target_players[i];
					var diff = target.angle - player.angle;
					if (diff > ANGLE_FACTOR) {
						player.angle += ANGLE_FACTOR;
					} else if (diff < -ANGLE_FACTOR) {
						player.angle -= ANGLE_FACTOR;
					}
					//player.angle = target.angle;

					player.position = target.position;
					if (!target.bound) {
						player.velocity = target.velocity;
					}

					var xdiff = player.x - target.x;
					var ydiff = player.y - target.y;


					var change = Math.abs(Math.cos(player.angle) * POS_FACTOR * player.velocity)
					if (xdiff > 0) {
						if (player.x - change >= 60) {
							player.x -= change;
						} else {
							player.x = target.x;
						}
					} else {
						if (player.x + change < this.camera.width - 60) {
							player.x += change;
						} else {
							player.x = target.x;
						}
					}

					change = Math.abs(Math.sin(player.angle) * POS_FACTOR * player.velocity);
					if (ydiff > 0) {
						if (player.y - change >= 2 * STATUS_HEIGHT) {
							player.y -= change;
						} else {
							player.y = 2 * STATUS_HEIGHT;
						}
					} else {
						if (player.y + change <= this.world.height - 60) {
							player.y += change;
						} else {
							player.y = this.world.height - 60;
						}
					}
					

					car.x = player.x;
					car.y = player.y;
					if (target.bound && (player.y <= 2 * STATUS_HEIGHT || player.y >= this.world.height - 60)){
						player.velocity = target.velocity;
					}
					if (target.finished && player.y <= 2 * STATUS_HEIGHT){
						player.finished = true;
					}
				}
			}
			var index = this.players.map(function(o) {return o.id}).indexOf(this.socket.id);
			var car = this.cars[index];
			this.camera.y = this.world.height - this.camera.height - (this.world.height - car.y) + 200;
			this.updateScoreBoard();
		}
	},
	updateScoreBoard: function() {
		var finished = false;
		var unfinished = false;
		for (var i = 0; i < this.players.length; i++) {
			var player = this.players[i];
			if (player.finished) {
				finished = true;
			} else {
				unfinished = true;
			}
		}

		if (finished) {
			if (this.score_board.board.visible == false) {
				this.score_board.board.visible = true;
				this.score_board.title.visible = true;
				this.score_board.pstnTitle.visible = true;
				this.score_board.plyerTitle.visible = true;
				this.score_board.position.visible = true;
				this.score_board.player.visible = true;
			}

			var players = "";
			var positions = "";
			for (var i = 0; i < this.players.length; i++) {
				var player = this.players[i];
				if (player.finished) {
					var desc = '';
					if (player.id == this.socket.id) {
						desc = ' (You)';
					}
					players = players + player.id + desc + "\n";
					positions = positions + player.position + "\n";
 				}
			}
			this.score_board.position.setText(positions);
			this.score_board.player.setText(players);

			if (!unfinished && !this.score_board.restart.visible) {
				this.score_board.restart.visible = true;
				this.playing = false;
			}
		}
	},
	renderScoreBoard: function() {

		var width = this.camera.width;
		var height = 60 + this.players.length * 60;
		var xpos = this.camera.width / 2;
		var ypos = (this.camera.height - height) / 2;
		var bmd = this.add.bitmapData(width, height);
		bmd.ctx.beginPath();
		bmd.ctx.rect(0, 0, width, height);
		bmd.ctx.fillStyle = 'black';
		bmd.ctx.fill();
		this.score_board.board = this.add.sprite(0, ypos, bmd);
		this.score_board.board.fixedToCamera = true;
		this.score_board.board.alpha = 0.2;

		this.score_board.title = this.add.text(this.camera.width / 2, ypos + 10, "Score board", {
			font: "bold 20px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.score_board.title.fixedToCamera = true;
		this.score_board.title.anchor.setTo(0.5, 0);

		this.score_board.pstnTitle = this.add.text(60, ypos + 30, "Position", {
			font: "bold 14px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.score_board.pstnTitle.fixedToCamera = true;

		this.score_board.plyerTitle = this.add.text(this.camera.width - 60, ypos + 30, "Player", {
			font: "bold 14px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.score_board.plyerTitle.anchor.setTo(1, 0);
		this.score_board.plyerTitle.fixedToCamera = true;

		this.score_board.position = this.add.text(60, ypos + 60, "", {
			font: "14px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.score_board.position.fixedToCamera = true;
		this.score_board.player = this.add.text(this.camera.width - 60, ypos + 60, "", {
			font: "14px Arial", 
			fill: "#fff", 
			align: "center"
		});
		this.score_board.player.anchor.setTo(1, 0);
		this.score_board.player.fixedToCamera = true;
		
		this.score_board.restart = this.add.image(this.camera.width / 2, ypos + height + 10, 'restart');
		this.score_board.restart.anchor.setTo(0.5, 0);
		this.score_board.restart.fixedToCamera = true;
		this.score_board.restart.inputEnabled = true;
		this.score_board.restart.events.onInputDown.add(this.restartGame, this);

		// hide everything
		this.score_board.restart.visible = false;
		this.score_board.board.visible = false;
		this.score_board.title.visible = false;
		this.score_board.pstnTitle.visible = false;
		this.score_board.plyerTitle.visible = false;
		this.score_board.position.visible = false;
		this.score_board.player.visible = false;
			
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
		if (this.score_board.restart.input.checkPointerOver(this.input.activePointer)) {
			this.restartGame();
		}
	},
	restartGame: function() {
		// Reset all values
		this._target_players = undefined;
		this.players = undefined;
		this.cars = [];
		this.socket.disconnect();
		this.socket = undefined;
		this.current_player = undefined;
		this.bgm.stop();
		this.bgm = undefined;

		this.state.start('StartMenu');
	}
}

