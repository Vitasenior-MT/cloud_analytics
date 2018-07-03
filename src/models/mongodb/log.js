var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  datetime: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    required: false
  }
}, {
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  });

module.exports = mongoose.model('Log', schema);