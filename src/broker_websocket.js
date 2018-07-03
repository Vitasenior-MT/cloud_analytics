exports.subscribe = (conn, vitabox_id) => {
  return new Promise((resolve, reject) => {

    conn.createChannel(function (err, ch) {
      if (err) reject(err);
      ch.assertExchange(vitabox_id, 'fanout', { durable: true });

      //setup a queue for receiving messages
      ch.assertQueue('', { exclusive: true }, function (err, q) {
        if (err) reject(err);

        ch.bindQueue(q.queue, vitabox_id, '');

        //listen for messages
        ch.consume(q.queue, function (msg) {
          onMessageReceived(vitabox_id, JSON.parse(msg.content.toString()));
        }, { noAck: true });

        function emitMessage(message) {
          ch.publish(vitabox_id, '', new Buffer(JSON.stringify(message)));
        }
        function onMessageReceived() { }

        resolve({ id: vitabox_id, emitMessage: emitMessage, onMessageReceived: onMessageReceived });

      });
    });
  });
}