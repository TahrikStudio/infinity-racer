

InfinityFighter.Game = {
    init: function(){
        this.playerMap = {};
        this.coins = [];
        this.stage.disableVisibilityChange = true;
    },
    preload: function() {
        this.load.image('sprite','assets/sprites/sprite.png');
        this.load.spritesheet('coin','assets/sprites/coin.png', 44, 40);
    },
    create: function(){
        this.physics.startSystem(Phaser.Physics.ARCADE);
        
        var testKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        testKey.onDown.add(Client.sendTest, this);
        this.stage.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
        this.input.onDown.add(this.getCoordinates, this);
        Client.askNewPlayer();
    },
    getCoordinates:function(pointer){
        Client.sendClick(pointer.clientX, pointer.clientY);
    },

    addNewPlayer: function(id, x, y){
        var player = this.add.sprite(x, y,'sprite');
        this.physics.enable(player);
        player.collideWorldBounds = true;
        this.playerMap[id] = player;
    },
    movePlayer: function(id, x, y){
        var player = this.playerMap[id];
        var distance = Phaser.Math.distance(player.x,player.y,x,y);
        var tween = game.add.tween(player);
        var duration = distance*10;
        tween.to({x:x,y:y}, duration);
        tween.start();
    },
    removePlayer: function(id){
        this.playerMap[id].destroy();
        delete this.playerMap[id];
    },
    addCoin: function(x, y) {
        var coin = this.add.sprite(x, y, 'coin', 0);
        coin.animations.add('spin');
        coin.animations.play('spin', 8, true);
        this.coins.push(coin);
        this.physics.enable(coin);

        for (var id in this.playerMap) {
            var player = this.playerMap[id];
            this.physics.arcade.collide(player, coin, this.collectCoin, null, this);
        }
        console.log("Added coin");
    },
    collectCoin: function(player, coin) {
        console.log('Collected coin');
        Client.collectCoin(player.id);
        coin.kill();
    },
    update: function() {
        for (var id in this.playerMap) {
            var player = this.playerMap[id];
            for (var i = 0; i < this.coins.length; i++) {
                var coin = this.coins[i];
                this.physics.arcade.collide(player, coin, this.collectCoin, null, this);
            }
        }
    }

};