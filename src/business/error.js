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

exports.check = (error_id, user_id) => {
  return new Promise((resolve, reject) => {
    db.Error.where({ _id: error_id }).update({
      "seen_date": new Date(),
      "seen_user": user_id
    }, (err, res) => {
      if (err) reject(err);
      resolve();
    });
  });
}