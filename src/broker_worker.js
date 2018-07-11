
var workers = [
  { queue: "insert_record", execute: require("./business/insert_record") },
  { queue: "remove_record", execute: require("./business/remove_record") },
  { queue: "log", execute: require("./business/log") }
];

exports.startWorkers = (conn) => {
  let promises = workers.map(worker => {
    return new Promise((resolve, reject) => {

      conn.createChannel((err, ch) => {
        if (err) reject(err);

        ch.assertQueue(worker.queue, { durable: true });
        ch.prefetch(1);

        ch.consume(worker.queue, (msg) => {
          worker.execute(JSON.parse(msg.content)).then(
            () => ch.ack(msg),
            error => {
              ch.ack(msg);
              // console.log("broker error: ", error)
            });
        }, { noAck: false });

        resolve(worker.queue);
      });
    });
  });

  Promise.all(promises).then(
    queues => console.log('\x1b[32m%s %s\x1b[0m', '(PLAIN) Worker ', process.pid, 'listening on queues: ', queues),
    error => console.log("Queue error", error));
}