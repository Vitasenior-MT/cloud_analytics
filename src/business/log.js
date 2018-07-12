var db = require('../models/index');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    db.Log.create({
      "datetime": new Date(),
      "message": content.msg,
      "user_id": content.user,
    }, (err, res) => {
      if (err) reject(err.message);
      resolve();
    });
  });
}