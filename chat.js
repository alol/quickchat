var express = require('express');
var app = express.createServer();

var io = require('socket.io').listen(app);

//configuration for socket.io -- there's no WebSockets on heroku, yet!

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

// will contain the global chat history. Obviously will reset as the server is restarted.
var history = [];

// pickup a port from heroku to serve on, or a sensible default of 3000
var port = process.env.PORT || 3000;
app.listen(port);
// log that port
console.log("Listening on " + port);

// returns a random hex colour
// borrowed from Stackoverflow user Anatoily:
// http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
function get_random_colour() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

// route from / to index.html (inferred)
app.get('/', express.static(__dirname));


io.sockets.on('connection', function (socket) {
   
   // get a new colour for this user. This should persist as long as their socket is maintained.
   var ucolour = get_random_colour();
   
   // send the global chat history to the client. perhaps should be limited to the last x messages.
   socket.emit('history', {history: history});
   
   socket.on('message', function (data) {
      // build the date
      var d = new Date();
      var date = d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear() + " " 
                  + d.getHours() + ":" + d.getMinutes()+ " ";
      
      // strip html
      var cleaned_message = data.message.replace('<','&lt;').replace('>','&gt;');
      
      // build our message object and push it to the global history
      var msg = {message: cleaned_message, date: date, colour: ucolour};
      history.push(msg);
      
      
      io.sockets.emit('message', msg);
      console.log("Message: " + data.message)
  });
});
