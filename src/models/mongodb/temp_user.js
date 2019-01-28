var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  datetime: {
    type: Date,
    required: true
  }
}, {
    versionKey: false
  });

module.exports = mongoose.model('TempUser', schema);