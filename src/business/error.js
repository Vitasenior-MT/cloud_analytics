var db = require('../models/index');

exports.insert = (vitabox_id, board_id, sensor_id, title, message) => {
  return new Promise((resolve, reject) => {
    db.Error.create({
      "datetime": new Date(),
      "title": title,
      "message": message,
      "vitabox_id": vitabox_id,
      "board_id": board_id,
      "sensor_id": sensor_id
    }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}