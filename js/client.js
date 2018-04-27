/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
Client.socket = io.connect();

Client.sendTest = function(){
    console.log("test sent");
    Client.socket.emit('test');
};

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.sendClick = function(x, y){
  Client.socket.emit('click', {x:x, y:y});
};

Client.collectCoin = function(id) {
    console.log(id + ", collected coin");
    Client.socket.emit('collectCoin', {id:id});
}

Client.socket.on('newplayer',function(data){
    InfinityFighter.Game.addNewPlayer(data.id,data.x,data.y);
});

Client.socket.on('allplayers',function(data){
    for(var i = 0; i < data.length; i++){
        InfinityFighter.Game.addNewPlayer(data[i].id,data[i].x,data[i].y);
    }

    Client.socket.on('move',function(data){
        InfinityFighter.Game.movePlayer(data.id,data.x,data.y);
    });

    Client.socket.on('remove',function(id){
        InfinityFighter.Game.removePlayer(id);
    });
});


Client.socket.on('addCoin', function(data) {
    console.log("Requested to add coin");
    InfinityFighter.Game.addCoin(data.x, data.y);
});


