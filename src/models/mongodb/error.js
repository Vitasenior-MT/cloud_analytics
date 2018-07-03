var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  datetime: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: false
  },
  vitabox_id: {
    type: String,
    required: true,
    default: false
  },
  board_id: {
    type: String,
    required: true,
    default: false
  },
  sensor_id: {
    type: String,
    required: true,
    default: false
  },
  seen_date: {
    type: Date,
    default: null
  },
  seen_user: {
    type: String,
    default: null
  },
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


module.exports = mongoose.model('Error', schema);