var amqp = require('amqplib/callback_api'),
  url = require('url');

var uri = "";
if (process.env.NODE_ENV === "production") {
  uri = 'amqps://admin:EDWTTTFIPYYJTKHE@portal-ssl241-11.bmix-lon-yp-527bf6a8-196a-4434-bac2-20581b651b99.565374449.composedb.com:26654/bmix-lon-yp-527bf6a8-196a-4434-bac2-20581b651b99';
} else {
  uri = 'amqp://root:123qwe@192.168.161.79:5672';
}

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(uri, { servername: url.parse(uri).hostname }, (err, conn) => {
      if (err) reject(err);
      else {
        console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with RabbitMQ');
        resolve(conn);
      }
    });
  });
}