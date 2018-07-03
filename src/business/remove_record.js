var db = require('../models/index'),
  error = require('../business/error'),
  warning = require('../business/warning');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    db.Sensor.findAll({ where: { board_id: content.board_id } }).then(
      sensors => Promise.all(sensors.map(x => _getAllRecordsWhere({ sensor_id: x.id }))).then(
        docs => db.RecordOld.insertMany([].concat.apply([], docs.filter(x => x)), (err, doc) => {
          if (err) {
            err => error.insert("board", content.board_id, "cannot_find_board", err.message).then(
              () => resolve(),
              err => reject(err));
          }
          else {
            Promise.all(sensors.map(x => _removeRecordsWhere({ sensor_id: x.id }))).then(
              () => resolve(),
              err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
                () => resolve(),
                err => reject(err)));
          }
        }),
        err => reject(err)),
      err => reject(err));
  });
}

// PRIVATE
_removeRecordsWhere = (obj) => {
  return new Promise((resolve, reject) => {
    let promise_temp = new Promise((resolve, reject) => {
      db.RecordTemp.remove(obj).exec(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    let promise_check = new Promise((resolve, reject) => {
      db.RecordCheck.remove(obj).exec(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    Promise.all([promise_temp, promise_check]).then(
      () => resolve(),
      err => reject(err));
  });
}

_getRecordsWhere = (obj) => {
  return new Promise((resolve, reject) => {
    let promise_temp = new Promise((resolve, reject) => {
      db.RecordTemp.find().where(obj).exec((err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    let promise_check = new Promise((resolve, reject) => {
      db.RecordCheck.find().where(obj).exec((err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    Promise.all([promise_temp, promise_check]).then(
      docs => resolve(docs[0].concat(docs[1])),
      err => reject(err));
  });
}