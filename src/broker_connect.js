var amqp = require('amqplib/callback_api'),
  url = require('url');

var uri = "";
if (process.env.NODE_ENV === "production") {
  uri = '';
} else {
  uri = 'amqp://root:123qwe@192.168.161.224:5672';
}

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(uri, { servername: url.parse(uri).hostname }, (err, conn) => {
      if (err) reject(err);
      else conn.createChannel((err, channel) => {
        if (err) { conn.close(); reject(err); }
        else resolve(channel);
      });
    });
  });
}