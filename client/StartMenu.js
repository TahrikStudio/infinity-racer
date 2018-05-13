InfinityFighter.StartMenu = function(game) {
    this.startBG;
    this.startPrompt;
    this.ding;
}

InfinityFighter.StartMenu.prototype = {
	
	create: function () {
        // this.ding = this.add.audio('select_audio');
        
		startBG = this.add.image(0, 0, 'titlescreen');
		startBG.inputEnabled = true;
		startBG.events.onInputDown.addOnce(this.startGame, this);
		
		startPrompt = this.add.text(this.camera.width / 2, this.camera.height / 2, 'Touch to Start!', {
			font: "bold 24px Arial", 
			fill: "#fff", 
			boundsAlignH: "center", 
			boundsAlignV: "middle" 
		});
		startPrompt.anchor.setTo(0.5, 0.5);
	},

	startGame: function (pointer) {
        // this.ding.play();
		this.state.start('Game', true);
	}
};