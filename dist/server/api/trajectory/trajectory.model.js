'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TrajectorySchema = new Schema({
    id: String,
    type: {type: String, default: 'Feature'},
    properties: {
        time:Date,
        coordTimes: [Date],
        outlierThreshold:{ type: Number, min: 1, max: 10000},
        distribution: {},
        //0 => real, 1 => random, 2 => structured, 3 => very realistic
        spoofLvL: {type: Number, default: 0}
    },
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
 