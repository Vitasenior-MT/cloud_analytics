var db = require('../models/index');

exports.insert = (vitabox_id, sensor_id, patient_id, message) => {
  return new Promise((resolve, reject) => {
    db.Warning.create({
      "datetime": new Date(),
      "message": message,
      "patient_id": patient_id,
      "sensor_id": sensor_id,
      "vitabox_id": vitabox_id
    }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}

exports.countDoctor = (patient_id) => {
  return new Promise((resolve, reject) => {
    db.WarningDoctor.update({ "patient_id": patient_id }, { $inc: { count: 1 } }, { multi: true }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}

exports.countVitabox = (vitabox_id) => {
  return new Promise((resolve, reject) => {
    db.WarningUser.update({ "vitabox_id": vitabox_id }, { $inc: { count: 1 } }, { muti: true }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}