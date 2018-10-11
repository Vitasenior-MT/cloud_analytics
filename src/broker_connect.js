var amqp = require('amqplib/callback_api'),
  url = require('url');

var workers = [
  { queue: "insert_record", execute: require("./business/insert_record") },
  { queue: "remove_record_by_board", execute: require("./business/remove_record").byBoard },
  { queue: "remove_record_by_sensors", execute: require("./business/remove_record").bySensors },
  { queue: "remove_record_by_board_patient", execute: require("./business/remove_record").byBoardPatient },
  { queue: "remove_record_by_patient", execute: require("./business/remove_record").byPatient },
  { queue: "log", execute: require("./business/log") }
];

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.AMQP, { servername: url.parse(process.env.AMQP).hostname }, (err, conn) => {
      if (err) reject(err);
      else conn.createChannel((err, channel) => {
        if (err) { conn.close(); reject(err); }

        Promise.all([
          _connectToWorkers(channel),
          _connectToExchanges(channel)
        ]).then(
          () => resolve(),
          error => { console.log(error); reject() });
      });
    });
  });
}

_connectToWorkers = (channel) => {
  return new Promise((resolve, reject) => {
    let promises = workers.map(worker => {
      return new Promise((resolve, reject) => {
        channel.assertQueue(worker.queue, { durable: true });

        channel.prefetch(1);

        channel.consume(worker.queue, (msg) => {
          worker.execute(JSON.parse(msg.content)).then(
            response => {
              channel.ack(msg);
              response.forward.forEach(x => {
                channel.publish(x.room, '', new Buffer(JSON.stringify({ content: x.key, msg: "" })));
              });
            }, error => {
              channel.ack(msg);
              console.log("broker error: ", error);
            });
        }, { noAck: false });

        resolve();
      });
    });

    Promise.all(promises).then(
      () => resolve(),
      error => reject(error));
  });
}

_connectToExchanges = (channel) => {
  return new Promise((resolve, reject) => {
    require("./business/get_vitaboxes").list().then(
      vitaboxes => {
        vitaboxes.push("admin");

        Promise.all(vitaboxes.map(vitabox => {
          return new Promise((resolve, reject) => {
            channel.assertExchange(vitabox, 'fanout', { durable: true });
            
            channel.assertQueue('', { exclusive: true }, function (err, q) {
              if (err) reject(err);
              channel.bindQueue(q.queue, vitabox, '');
              resolve();
            });
          });
        })).then(
          () => resolve(channel),
          error => reject(error));
      }, error => reject(error));
  });
}