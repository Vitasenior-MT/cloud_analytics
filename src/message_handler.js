var channels;
// https://github.com/john-pettigrew/scaling-socket-io-talk/blob/master/code/app.js
exports.listen = (socketIO, conn) => {
  require("./business/get_vitaboxes").list().then(
    vitaboxes => Promise.all(vitaboxes.map(vitabox => require("./broker_websocket").subscribe(conn, vitabox))).then(
      res => {
        channels = res;
        channels.forEach(channel => channel.onMessageReceived = onMessageReceived);

        // https://stackoverflow.com/questions/36788831/authenticating-socket-io-connections
        socketIO.use((socket, next) => {
          if (socket.handshake.query && socket.handshake.query.token) {
            require("./business/validate_token").validateToken(socket.handshake.query.token).then(
              boxes => { socket.vitaboxes = boxes; next(); },
              error => next(new Error('Authentication error')));
          } else next(new Error('Authentication error'));
        }).on('connection', (socket) => {

          console.log("new connection, pid: ", process.pid);
          socket.join(socket.vitaboxes, (err) => {
            if (err) console.log("client cannot connect", err.message);
            else socketIO.to(socket.vitaboxes[0]).emit('message', "Hello from server");
          });
        });

        function onMessageReceived(room, message) {
          socketIO.to(room).emit('message', message);
        }

      }, error => console.log(error)),
    error => console.log(error));
}

exports.send = (vitabox_id, message) => {
  channels.find(c => c.id === vitabox_id).emitMessage(message);
}