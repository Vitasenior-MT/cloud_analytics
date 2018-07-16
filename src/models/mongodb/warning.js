var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  datetime: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  vitabox_id: {
    type: String,
    required: true
  },
  patient_id: {
    type: String,
    required: false,
  },
  sensor_id: {
    type: String,
    required: true
  },
  seen_vitabox: {
    type: Date,
    default: null
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

module.exports = mongoose.model('Warning', schema);