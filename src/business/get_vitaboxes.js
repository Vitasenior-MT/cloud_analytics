exports.list = () => {
  return new Promise((resolve, reject) => {
    let db = require('../models/index');
    db.Vitabox.findAll().then(
      list => resolve(list.map(x => x.id)),
      error => reject({ code: 500, msg: error.message }));
  });
}