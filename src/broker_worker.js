
var workers = [
  { queue: "insert_record", execute: require("./business/insert_record") },
  { queue: "remove_record_by_board", execute: require("./business/remove_record").byBoard },
  { queue: "remove_record_by_sensors", execute: require("./business/remove_record").bySensors },
  { queue: "remove_record_by_board_patient", execute: require("./business/remove_record").byBoardPatient },
  { queue: "remove_record_by_patient", execute: require("./business/remove_record").byPatient },
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
            response.forward.forEach(x => {
              channel.publish(x.room, '', new Buffer(x.key));
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