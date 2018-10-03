exports.connectToExchanges = (channel) => {
  return new Promise((resolve, reject) => {
    require("./business/get_vitaboxes").list().then(
      vitaboxes => {
        vitaboxes.push("admin");
        Promise.all(vitaboxes.map(vitabox => _subscribeToVitabox(channel, vitabox))).then(
          () => resolve(channel),
          error => reject(error));
      }, error => reject(error));
  });
}

_subscribeToVitabox = (channel, vitabox) => {
  return new Promise((resolve, reject) => {
    channel.assertExchange(vitabox, 'fanout', { durable: true });
    //setup a queue for receiving messages
    channel.assertQueue('', { exclusive: true }, function (err, q) {
      if (err) reject(err);
      channel.bindQueue(q.queue, vitabox, '');
      resolve();
    });
  });
}
