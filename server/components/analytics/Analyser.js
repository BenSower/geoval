'use strict';
var SpoofDetector = require('./SpoofDetector'),
  async = require('async'),
  mongoose = require('mongoose');

var Trajectory = mongoose.model('Trajectory');

function Analyser() {}

Analyser.prototype.analyse = function (cb) {

  async.parallel({
      trajectories: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 0
        }, function (err, trajectories) {
          if (trajectories.length === 0) {
            console.log('no training/spoofLvl1 trajectories available');
          }
          callback(err, trajectories);
        });
      },
      lvl1spoofs: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 1
        }, function (err, lvl1spoofs) {
          callback(err, lvl1spoofs);
        });
      },
      lvl2spoofs: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 2
        }, function (err, lvl2spoofs) {
          callback(err, lvl2spoofs);
        });
      }
    },
    function (err, results) {
      var answer = [];
      for (var i = 1; i < Object.keys(results).length + 1; i++) {
        var result = results['lvl' + i + 'spoofs'];
        if (result !== undefined && result.length > 0) {
          console.log('\nAnalyzing LvL' + i + ' trajectories:');
          answer.push(SpoofDetector.detectSpoofs(results.trajectories, result));
        }
      }
      cb(null, answer);
    });
}

module.exports = new Analyser();
