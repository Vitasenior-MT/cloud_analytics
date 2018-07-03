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
    analyzed: { type: Boolean },
    patient_id: {
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

module.exports = mongoose.model('RecordOld', schema);