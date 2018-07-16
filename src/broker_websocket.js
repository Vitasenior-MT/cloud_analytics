exports.subscribe = (channel, vitabox_id) => {
  return new Promise((resolve, reject) => {

    channel.assertExchange(vitabox_id, 'fanout', { durable: true });

    //setup a queue for receiving messages
    channel.assertQueue('', { exclusive: true }, function (err, q) {
      if (err) reject(err);

      channel.bindQueue(q.queue, vitabox_id, '');

      let exchanges = {
        emitMessage: emitMessage,
        onMessageReceived: onMessageReceived
      };

      //listen for messages
      channel.consume(q.queue, function (msg) {
        exchanges.onMessageReceived(vitabox_id, JSON.parse(msg.content.toString()));
      }, { noAck: true });

      function emitMessage(message) {
        channel.publish(vitabox_id, '', new Buffer(JSON.stringify(message)));
      }
      function onMessageReceived() { }

      resolve(exchanges);

    });
  });
}