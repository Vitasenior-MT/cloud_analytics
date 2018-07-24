var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  count: {
    type: Number,
    required: true,
    default: 0
  },
  patient_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true,
  },
  last_seen: {
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

module.exports = mongoose.model('WarningDoctor', schema);