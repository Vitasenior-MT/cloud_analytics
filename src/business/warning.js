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

exports.check = (warning_id, user_id) => {
  return new Promise((resolve, reject) => {
    db.Warning.where({ _id: warning_id }).update({
      "seen_date": new Date(),
      "seen_user": user_id
    }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}