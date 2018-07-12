// consumer
var amqp = require('amqplib/callback_api');
amqp.connect('amqp://root:123qwe@192.168.161.79:5672', (err, conn) => {
  conn.createChannel((err, ch) => {
    if (err) { console.log(err); reject(err); }

    ch.assertQueue('records2', { durable: true });
    ch.prefetch(1);

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", 'hello2');

    ch.consume('records', (msg) => {
      let obj = JSON.parse(msg.content);
      console.log("result: ", obj);
      ch.ack(msg);
    }, { noAck: false });

  });
});
// publisher
var amqp = require('amqplib/callback_api');
amqp.connect('amqp://root:123qwe@192.168.161.79:5672', (err, conn) => {
  if (err) { console.log(err); }
  conn.createChannel((err, ch) => {
    if (err) { console.log(err); }

    ch.assertQueue('hello2', { durable: true });
    // Note: on Node 6 Buffer.from(msg) should be used~
    let msg = { array: [Math.random() * 100, Math.random() * 100], str: "50000", i: Math.random() * 100 }
    ch.sendToQueue('hello2', new Buffer(JSON.stringify(msg)));
    console.log("send: ", msg)
    ch.close();
  });

});
