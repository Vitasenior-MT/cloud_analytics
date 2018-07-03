// server.js

// BASE SETUP
// =============================================================================
var cluster = require('cluster');

if (cluster.isMaster) {
  var db = require('./src/models/index');
  db.sequelize.sync(process.env.NODE_ENV === "development" ? { alter: true } : {}).then(
    () => {
      console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MongoDB and MySQL');

      let workers = [];
      for (var i = 0; i < require('os').cpus().length; i++) workers.push(cluster.fork());
      console.log('(PLAIN) Master cluster created ' + workers.length + ' workers...');

      cluster.on('exit', (worker, code, signal) => { console.log('(PLAIN) Worker ' + worker.process.pid + ' died -> Starting a new worker'); cluster.fork(); });
    }, error => { console.log('Unable to connect to Databases.', error); process.exit(1); });
} else {
  // connect RabbitMQ
  require("./src/broker_connect").connect().then(
    connection => {
      // start workers
      require("./src/broker_worker").startWorkers(connection);

      var express = require('express');
      var server = require('http').Server(express());

      //Handle messaging
      require('./src/message_handler').listen(require('socket.io')(server), connection);

      let port = process.env.PORT || 8080;
      server.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });

    }, error => { console.log('Unable to connect RabbitMQ.', error); process.exit(1); }
  )
}