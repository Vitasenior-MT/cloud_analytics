var amqp = require('amqplib/callback_api'),
  url = require('url');

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.AMQP, { servername: url.parse(process.env.AMQP).hostname }, (err, conn) => {
      if (err) reject(err);
      else conn.createChannel((err, channel) => {
        if (err) { conn.close(); reject(err); }
        else resolve(channel);
      });
    });
  });
}
