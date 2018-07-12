var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  measure: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: true
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
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

module.exports = mongoose.model('Profilemeasure', schema);