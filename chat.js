var express = require('express');
var app = express.createServer();

var io = require('socket.io').listen(app);

var history = [];

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Listening on " + port);

function get_random_colour() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

// route for a static file
app.get('/', express.static(__dirname));

io.sockets.on('connection', function (socket) {
   
   var ucolour = get_random_colour();
   
   socket.emit('history', {history: history});
   
   socket.on('message', function (data) {
     var d = new Date();
     var date = d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes()+ " ";

     var cleaned_message = data.message.replace('<','&lt;').replace('>','&gt;');

     var msg = {message: cleaned_message, date: date, colour: ucolour};
     history.push(msg);
     
     io.sockets.emit('message', msg);
     console.log("Message: " + data.message)
  });
});
