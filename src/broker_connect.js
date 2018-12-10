var amqp = require('amqplib/callback_api'),
  url = require('url');

var channel;

_connectToWorkers = () => {
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

                _subscribeToEntity(x.room).then(
                  () => channel.publish(x.room, 'broadcast', new Buffer(JSON.stringify({ content: x.key, msg: "" }))),
                  error => console.log("broker exchange error: ", error.message));
              });
            }, error => {
              channel.ack(msg);
              console.log("broker execution error: ", error.message);
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

_subscribeToEntity = (entity_id) => {
  return new Promise((resolve, reject) => {
    channel.assertExchange(entity_id, 'direct', { autoDelete: true, durable: false }, function (err, ok) {
      if (err) reject(err);
      else resolve();
    });
  });
}

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
      else conn.createChannel((err, ch) => {
        if (err) { conn.close(); reject(err); }

        channel = ch;

        _connectToWorkers().then(
          () => resolve(),
          error => { console.log(error); reject() });
      });
    });
  });
}