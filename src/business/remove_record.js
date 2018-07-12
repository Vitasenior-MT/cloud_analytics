var db = require('../models/index'),
  error = require('../business/error');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    db.Sensor.findAll({ where: { board_id: content.board_id } }).then(
      sensors => Promise.all(sensors.map(x => _getAllRecordsWhere({ sensor_id: x.id }))).then(
        records => db.RecordOld.insertMany(records), (err, doc) => {
          if (err) {
            error.insert("board", content.board_id, "cannot_find_board", err.message).then(
              () => resolve(),
              err => reject(err));
          }
          else Promise.all(sensors.map(x => _removeRecordsWhere({ sensor_id: x.id }))).then(
            () => resolve(),
            err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
              () => resolve(),
              err => reject(err)));
        }, err => reject(err)),
      err => reject(err));
  });
}

// PRIVATE
_removeRecordsWhere = (obj) => {
  return new Promise((resolve, reject) => {
    db.Record.remove(obj).exec(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

_getRecordsWhere = (obj) => {
  return new Promise((resolve, reject) => {
    db.Record.find().where(obj).exec((err, doc) => {
      if (err) reject(err);
      else resolve(doc);
    });
  });
}