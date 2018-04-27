var InfinityFighter = {};

InfinityFighter.Boot = function (game) { };
 
InfinityFighter.Boot.prototype = {
    init: function () {
        this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    },
    preload: function () {
    },
    create: function () {
        this.state.start("start");
    }	
};