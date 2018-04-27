var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){

    socket.on('newplayer',function(){
        socket.player = {
            id: this.id,
            x: randomInt(100,400),
            y: randomInt(100,400)
        };
        socket.emit('allplayers',getAllPlayers());

        socket.broadcast.emit('newplayer',socket.player);
        socket.broadcast.emit('addCoin', {x: 20, y:20});

        socket.on('click',function(data){
            console.log('click to '+data.x+', '+data.y);
            socket.player.x = data.x;
            socket.player.y = data.y;
            io.emit('move', socket.player);
        });

        socket.on('collectCoin', function(data) {
            console.log(data.id + ", collected coin");
            socket.broadcast.emit('addCoin', {x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100)});
        });

        socket.on('disconnect',function(){
            io.emit('remove',socket.player.id);
        });
    });

    socket.on('test',function(){
        console.log('test received');
    });
});

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
