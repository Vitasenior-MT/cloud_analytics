// https://github.com/john-pettigrew/scaling-socket-io-talk/blob/master/code/app.js
exports.listen = (socketIO, channel) => {
  require("./business/get_vitaboxes").list().then(
    vitaboxes => {
      vitaboxes.push("admin");
      Promise.all(vitaboxes.map(vitabox => require("./broker_websocket").subscribe(channel, vitabox))).then(
        exchanges => {
          exchanges.forEach(exchange => exchange.onMessageReceived = onMessageReceived);

          socketIO.on('connection', (socket) => {
            if (socket.handshake.query && socket.handshake.query.token) {
              require("./business/validate_token").validateToken(socket.handshake.query.token).then(
                boxes => {
                  socket.join(boxes, (err) => {
                    if (err) socket.emit("message", "error on join rooms: " + err.message);
                    else socketIO.to(boxes[0]).emit('message', "Hello from server");

                    console.log("\x1b[32mnew connection\x1b[0m assigned to rooms: ", Object.keys(socket.rooms));

                    socket.on('disconnect', () => { console.log("\x1b[35muser disconect\x1b[0m: ", socket.conn.id); });
                  })
                },
                error => { socket.emit("message", "Unauthorized: " + error.message); socket.disconnect(true) });
            } else { socket.emit("message", "Unauthorized: token undefined"); socket.disconnect(true); }
          });

          function onMessageReceived(room, message) {
            socketIO.to(room).emit('message', message);
          }

          console.log('\x1b[32m%s %s\x1b[0m', '(PLAIN) Worker ', process.pid, 'listening rooms')
        }, error => console.log(error))
    }, error => console.log(error));
}