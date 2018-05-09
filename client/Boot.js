var InfinityFighter = {};

InfinityFighter.Boot = function(game) {}

InfinityFighter.Boot.prototype = {
	preload: function() {
		this.load.image('preloaderBar', 'client/img/loader_bar.png');
		this.load.image('titleimage', 'client/img/TitleImage.png');
	},
	create: function() {
		this.input.maxPointers = 1;
		this.stage.disableVisibilityChange = true;
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.minWidth = 270;
		this.scale.minHeight = 400;
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlighVertically = true;
		this.stage.forcePortrait = true;
		this.scale.setScreenSize(true);

		this.input.addPointer();
		this.stage.backgroundColor = '#171642';

		this.state.start('Preloader');
	},
	update: function() {}
}