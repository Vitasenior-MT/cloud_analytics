// server.js

// BASE SETUP
// =============================================================================

// var cluster = require('cluster');

// if (cluster.isMaster) {
//   require('./src/models/index').sequelize.sync(process.env.NODE_ENV === "development" ? { alter: true } : {}).then(
//     () => {
//       console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MongoDB and MySQL');

//       let workers = [];
//       for (var i = 0; i < require('os').cpus().length; i++) workers.push(cluster.fork());
//       console.log('(PLAIN) Master cluster created ' + workers.length + ' workers...');

//       cluster.on('exit', (worker, code, signal) => { console.log('(PLAIN) Worker ' + worker.process.pid + ' died -> Starting a new worker'); cluster.fork(); });
//     }, error => { console.log('Unable to connect to Databases.', error); process.exit(1); });
// } else {
//   // connect RabbitMQ
//   require("./src/broker_connect").connect().then(
//     channel => {
//       // start workers
//       require("./src/broker_worker").startWorkers(channel);

//       var express = require('express');
//       var server = require('http').Server(express());

//       //Handle messaging
//       require('./src/message_handler').listen(require('socket.io')(server), channel);

//       let port = process.env.PORT || 8000;
//       server.listen(port, () => {
//         console.log(`Server running on port ${port}`);
//       });

//     }, error => { console.log('Unable to connect RabbitMQ.', error); process.exit(1); }
//   )
// }

// Promise.all([
//   require("./src/broker_connect").connect(),
//   require('./src/models/index').sequelize.sync(process.env.NODE_ENV === "development" ? { alter: true } : {})
// ]).then(
//   res => {
//     let channel = res[0];
//     console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MongoDB, MySQL and RabbitMQ');
//     // start workers
//     require("./src/broker_worker").startWorkers(channel);

//     let options = {
//       proxy: true, //activate layer 4 patching
//       header: 'x-forwarded-for', //provide here your header containing the users ip
//     };

//     var sticky = require('socketio-sticky-session');
//     sticky(options, function () {

//       // This code will be executed only in slave workers
//       var express = require('express');
//       var server = require('http').createServer(express());

//       //Handle messaging
//       require('./src/message_handler').listen(require('socket.io')(server), channel);

//       return server;
//     }).listen(process.env.PORT || 8000, () => {
//       console.log(`Server running on port ${process.env.PORT || 8000}`);
//     });

//   }, error => console.log(error));

require('sticky-cluster')(
  (callback) => {
    Promise.all([
      require("./src/broker_connect").connect(),
      require('./src/models/index').sequelize.sync(process.env.NODE_ENV === "development" ? { alter: true } : {})
    ]).then(
      res => {
        let channel = res[0];
        console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MongoDB, MySQL and RabbitMQ');

        // start workers
        require("./src/broker_worker").startWorkers(channel);

        // This code will be executed only in slave workers
        let express = require('express');
        var server = require('http').createServer(express());

        //Handle messaging
        require('./src/message_handler').listen(require('socket.io')(server), channel);
        
        callback(server);

      }, error => console.log(error));
  },
  {
    port: process.env.PORT || 8000
  }
);


