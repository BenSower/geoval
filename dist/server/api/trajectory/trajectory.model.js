'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TrajectorySchema = new Schema({
  id: String,
  type: {
    type: String,
    default: 'Feature'
  },
  properties: {
    time: Date,
    coordTimes: [Date],
    //0 => real, 1 => random, 2 => structured, 3 => very realistic
    spoofLvL: {
      type: Number,
      default: 0
    }
  },
  geometry: {
    type: {
      type: String,
      default: 'LineString'
    },
    coordinates: [],
  },
  featureVector: Schema.Types.Mixed
});

TrajectorySchema.index({
  coordinates: '2dsphere',
});

module.exports = mongoose.model('Trajectory', TrajectorySchema);