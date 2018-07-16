
var workers = [
  { queue: "insert_record", execute: require("./business/insert_record") },
  { queue: "remove_record", execute: require("./business/remove_record") },
  { queue: "log", execute: require("./business/log") }
];

exports.startWorkers = (channel) => {

  let promises = workers.map(worker => {
    return new Promise((resolve, reject) => {
      channel.assertQueue(worker.queue, { durable: true });

      channel.prefetch(1);

      channel.consume(worker.queue, (msg) => {
        worker.execute(JSON.parse(msg.content)).then(
          response => {
            channel.ack(msg);
            if (response.error) channel.publish("admin", '', new Buffer(JSON.stringify("error")));
            if (response.warnings.length > 0) response.warnings.forEach(room => {
              channel.publish(room, '', new Buffer(JSON.stringify("warning")));
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
    () => console.log('\x1b[32m%s %s\x1b[0m', '(PLAIN) Worker ', process.pid, 'listening queues'),
    error => console.log("Queue error", error));
}