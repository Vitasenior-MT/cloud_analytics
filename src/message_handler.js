// https://github.com/john-pettigrew/scaling-socket-io-talk/blob/master/code/app.js
exports.listen = (socketIO, channel) => {
  require("./business/get_vitaboxes").list().then(
    vitaboxes => {
      vitaboxes.push("admin");
      Promise.all(vitaboxes.map(vitabox => require("./broker_websocket").subscribe(channel, vitabox))).then(
        exchanges => {
          exchanges.forEach(exchange => exchange.onMessageReceived = onMessageReceived);

          // https://stackoverflow.com/questions/36788831/authenticating-socket-io-connections
          socketIO.use((socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
              require("./business/validate_token").validateToken(socket.handshake.query.token).then(
                boxes => { socket.vitaboxes = boxes; next(); },
                error => next(new Error('Authentication error')));
            } else next(new Error('Authentication error'));
          }).on('connection', (socket) => {
              socket.join(socket.vitaboxes, (err) => {
                if (err) console.log("error on connect", err.message);
                else socketIO.to(socket.vitaboxes[0]).emit('message', "Hello from server");

                console.log("\x1b[32mnew connection\x1b[0m assigned to rooms: ", Object.keys(socket.adapter.rooms));

                socket.on('disconnect', () => {
                  console.log("\x1b[35muser disconect\x1b[0m: ", socket.conn.id);
                });

              });
            });

          function onMessageReceived(room, message) {
            socketIO.to(room).emit('message', message);
          }
          
          console.log('\x1b[32m%s %s\x1b[0m', '(PLAIN) Worker ', process.pid, 'listening rooms')
        }, error => console.log(error))
    }, error => console.log(error));
}