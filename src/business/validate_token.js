var db = require('../models/index'),
  fs = require("fs"),
  jwt = require('jsonwebtoken'),
  vitabox_list = require('./get_vitaboxes');

exports.validateToken = (token) => {
  return new Promise((resolve, reject) => {
    let public_key = fs.readFileSync(__dirname + '/../keys/cert.pem').toString();
    if (public_key === undefined) reject("error on load public key");

    let options = {
      algorithms: ["RS256"]
    };

    jwt.verify(token, public_key, options, (error, payload) => {
      if (error) reject({ code: 500, msg: error.message });
      if (payload.role === "User") db.User.findById(payload.id).then(
        user => {
          if (user) user.getVitaboxes({ where: { active: true } }).then(
            vitaboxes => {
              let rooms = vitaboxes.map(x => x.id);
              if (user.admin) rooms.push("admin");
              resolve(rooms);
            }, error => reject(error));
          else reject(new Error("user not found"));
        }, error => reject(error));
      else resolve([payload.id]);
    });
  });
}