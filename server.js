// server.js

// BASE SETUP
// =============================================================================

// var cluster = require('cluster');
// require('dotenv').config();

// if (cluster.isMaster) {
//   require('./src/models/index').sequelize.sync().then(
//     () => {
//       // console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MongoDB and MySQL');

//       for (var i = 0; i < require('os').cpus().length; i++) cluster.fork();

//       cluster.on('exit', (worker, code, signal) => {
//         console.log('(PLAIN) Worker ' + worker.process.pid + ' died with code: ' + code + ', signal: ' + signal + ' -> Born a new worker');
//         cluster.fork();
//       });
//     }, error => { console.log('Unable to connect to Databases.', error); process.exit(1); });
// } else {
//   // connect RabbitMQ
//   require("./src/broker_connect").connect().then(
//     channel => {
//       // start workers
//       require("./src/broker_vitaboxes").connectToExchanges(channel).then(
//         () => {
//           require("./src/broker_worker").startWorkers(channel);

//           let express = require('express');
//           var server = require('http').Server(express());

//           let port = process.env.PORT || 8000;
//           server.listen(port, () => {
//             console.log(`Server running on port ${port}`);
//           });
//         }, error => { console.log('Unable to assert exchanges to vitaboxes.', error); process.exit(1); });
//     }, error => { console.log('Unable to connect RabbitMQ.', error); process.exit(1); }
//   )
// }


// Get the env variables from .env
if (process.env.NODE_ENV !== "docker") {
  require('dotenv').config();
}

Promise.all([
  require('./src/models/index').sequelize.sync(),
  require("./src/broker_connect").connect()
]).then(
  () => {
    console.log('\x1b[32m(PLAIN) Connection established with External Services\x1b[0m.');

    let express = require('express');
    var server = require('http').Server(express());

    let port = process.env.PORT || 8000;
    server.listen(port, () => {
      console.log('\x1b[32m%s %d\x1b[0m.', '(PLAIN) Server listening on port', port);
    });
  }, error => { console.log('Unable to connect to External Services.', error); process.exit(1); });