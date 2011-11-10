var express = require('express');
var app = express.createServer();

var io = require('socket.io').listen(app);

// returns a random hex colour
// borrowed from Stackoverflow user Anatoily
// because I couldn't think of, or find a more reliable / simple way! Grr... 
// http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
var get_random_colour = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

// Heroku inspired random name generator ;)
var get_random_name = function(){
    var adj = ['flying','happy','epic','thundering','nifty','speedy','sleepy','funky','dazling','thirsty'];
    var noun = ['ninja','samurai','owl','biscuit','pepper','pirate','rockstar','zombie','beetle','bee'];
    var number = Math.round(Math.random() * 9999);
    
    var r1 = Math.round(Math.random() * (adj.length - 1));
    var r2 = Math.round(Math.random() * (noun.length -1));
    
    return adj[r1] + '-' + noun[r2] + '-' + number;
}

// ensure there isn't a name clash 
var check_if_chatter_exists = function(name) {
    for(var i = 0; i < chatters.length; i++){
        if(chatters[i] == name) {
            return true;
        }
    }
    return false;
}

// pad a time, so you don't end up with times like 9:8 instead of
// 09:08...
var lpad_times = function(number) {
    if(number<10) {
        return "0"+number.toString();
    }
    return number;
}

var get_date = function(){
    var d = new Date();
    var date = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear() + ' ' 
                + lpad_times(d.getHours()) + ':' + lpad_times(d.getMinutes())+ ' ';

    return date;
}

io.configure(function () { 
//configuration for socket.io -- there's no WebSockets on heroku, yet!
//     io.set('transports', ['xhr-polling']); 
//     io.set('polling duration', 10); 
// reduce socket.io debugging
    io.set('log level', 1);
});


// will contain the global chat history. Obviously will reset as the server is restarted.
// might move this to a data store at some point in the future.
var history = [{message: 'Welcome', date: get_date(), colour: '#000000'}];

// will contain a list of people who are online and chatting
var chatters = [];

app.use(express.static(__dirname + '/static'));

// pickup a port from heroku to serve on, or a sensible default of 3000 for local invocation
var port = process.env.PORT || 3000;
app.listen(port);
//

// log that port
console.log('Listening on ' + port);


// route from / to index.html (inferred)
app.get('/', express.static(__dirname));

// stuff happens when a client connects
io.sockets.on('connection', function (socket) {
   
   // send the global chat history to the client. perhaps should be limited to the last x messages.
   socket.emit('history', {history: history});
   
   // get a new colour for this user. This should persist as long as their socket is maintained.
   var ucolour = get_random_colour();
   var uname = get_random_name();
   
   chatters.push({"name":uname, "colour":ucolour});
   
   // send a hello message to the client containing the user's colour and username
   socket.emit('hello', {'colour':ucolour, 'username': uname});
   
   io.sockets.emit('update',{'chatters':chatters, 'message': uname + 'joined the chat', date: get_date()});
   
   
   
   // when a message is received...
   socket.on('message', function (data) {
      // build the date
      var date = get_date();
      
      // strip html
      var cleaned_message = data.message.replace('<','&lt;').replace('>','&gt;');
      
      // build our message object and push it to the global history
      var msg = {message: cleaned_message, date: date, colour: ucolour, from: uname};
      history.push(msg);
      
      // and finally send to clients
      io.sockets.emit('message', msg);
      console.log('Message: ' + data.message)
  });
  
  // stuff happens when a client disconnects
  socket.on('disconnect', function(){
      // remove the client from the list of chatters
      
  });
});