var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    measures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profilemeasure'
    }]
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

module.exports = mongoose.model('Profilemodel', schema);