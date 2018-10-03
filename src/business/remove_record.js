var db = require('../models/index'),
  error = require('../business/error');

exports.byBoard = (content) => {
  return new Promise((resolve, reject) => {
    db.Sensor.findAll({ where: { board_id: content.board_id } }).then(
      sensors => Promise.all(sensors.map(x => _removeRecordsWhere({ sensor_id: x.id }))).then(
        () => resolve({ forward: [] }),
        err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
          () => resolve({ forward: [{ room: "admin", key: "error" }] }),
          err => reject(err.message))),
      err => reject(err.message));
  });
}

exports.byPatient = (content) => {
  return new Promise((resolve, reject) => {
    Promise.all(sensors.map(x => _removeRecordsWhere({ patient_id: content.patient_id }))).then(
      () => resolve({ forward: [] }),
      err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
        () => resolve({ forward: [{ room: "admin", key: "error" }] }),
        err => reject(err)));
  });
}

exports.bySensors = (content) => {
  return new Promise((resolve, reject) => {
    Promise.all(content.sensor_ids.map(id => db.Sensor.findById(id))).then(
      sensors => Promise.all(sensors.map(x => _removeRecordsWhere({ sensor_id: x.id }))).then(
        () => resolve({ forward: [] }),
        err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
          () => resolve({ forward: [{ room: "admin", key: "error" }] }),
          err => reject(err))),
      err => reject(err));
  });
}

exports.byBoardPatient = (content) => {
  return new Promise((resolve, reject) => {
    db.Sensor.findAll({ where: { board_id: content.board_id } }).then(
      sensors => Promise.all(sensors.map(x => _removeRecordsWhere({ sensor_id: x.id, patient_id: content.patient_id }))).then(
        () => resolve({ forward: [] }),
        err => error.insert("board", content.board_id, "cannot_remove_record", err.message).then(
          () => resolve({ forward: [{ room: "admin", key: "error" }] }),
          err => reject(err))),
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