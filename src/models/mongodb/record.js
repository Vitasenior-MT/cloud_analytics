var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    value: {
        type: Number,
        required: true
    },
    datetime: {
        type: Date,
        required: true
    },
    sensor_id: {
        type: String,
        required: false
    },
    patient_id: {
        type: String,
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

module.exports = mongoose.model('Record', schema);