'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TrajectorySchema = new Schema({
    id: String,
    time: [Date],
    type: {type: String, default: 'Feature'},
    properties: {},
    geometry: {
        type: {
            type: String,
            default: 'LineString'
        }, 
        coordinates: [],
    }
});

TrajectorySchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Trajectory', TrajectorySchema);
 