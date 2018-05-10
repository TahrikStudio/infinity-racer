InfinityFighter.Preloader = function(game) {
    this.preloadBar = null;
    this.titleText = null;
    this.ready = false;
};

InfinityFighter.Preloader.prototype = {
	
	preload: function () {
		this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY, 'preloaderBar');
		this.preloadBar.anchor.setTo(0.5, 0.5);
		this.load.setPreloadSprite(this.preloadBar);
		this.titleText = this.add.image(this.world.centerX, this.world.centerY-220, 'titleimage');
        this.titleText.anchor.setTo(0.5, 0.5);
        this.load.spritesheet('cars', 'client/img/cars.png', 76.8, 128, 5);
        this.load.image('titlescreen', 'client/img/TitleBG.png');
        this.load.bitmapFont('eightbitwonder', 'client/fonts/eightbitwonder.png', 'client/fonts/eightbitwonder.fnt');
        this.load.image('road-bound', 'client/img/roadbound.png');
        this.load.image('up', 'client/img/up.png');
        this.load.image('down', 'client/img/down.png');
        this.load.image('left', 'client/img/left.png');
        this.load.image('right', 'client/img/right.png');
        // this.load.image('hill', 'images/hill.png');
        // this.load.image('sky', 'images/sky.png');
        // this.load.atlasXML('bunny', 'images/spritesheets/bunny.png', 'images/spritesheets/bunny.xml');
        // this.load.atlasXML('spacerock', 'images/spritesheets/SpaceRock.png', 'images/spritesheets/SpaceRock.xml');
        // this.load.image('explosion', 'images/explosion.png');
        // this.load.image('ghost', 'images/ghost.png');
        // this.load.audio('explosion_audio', 'audio/explosion.mp3');
        // this.load.audio('hurt_audio', 'audio/hurt.mp3');
        // this.load.audio('select_audio', 'audio/select.mp3');
        // this.load.audio('game_audio', 'audio/bgm.mp3');
        this.load.audio('bg', ['client/sound/bg.mid', 'client/sound/bg.wav', 'client/sound/bg.mp3']);
	},

	create: function () {
		this.preloadBar.cropEnabled = false;
	},

	update: function () {
        if(/*this.cache.isSoundDecoded('game_audio') && */this.ready == false) {
            this.ready = true;
            this.state.start('StartMenu');
        }
	}
};