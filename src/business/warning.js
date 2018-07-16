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