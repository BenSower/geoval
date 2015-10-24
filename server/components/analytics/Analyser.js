'use strict';
var SpoofDetector = require('./SpoofDetector'),
  async = require('async'),
  Presenter = require('./Presenter'),
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
          var analyRes = SpoofDetector.detectSpoofs(results.trajectories, result);
          answer.push(analyRes);
          Presenter.presentResults(analyRes.results, result, results.trajectories, i);
          /*
          Presenter.createPlotlyGraph(
            [
              analyRes.spoofProbabilities.timeGap,
              analyRes.trajectoryProbabilities.timeGap
            ],
            'timeDetection');
          Presenter.createPlotlyGraph(
            [
              analyRes.spoofProbabilities.spatialDistance,
              analyRes.trajectoryProbabilities.spatialDistance
            ],
            'spatialDistance');
            */
        }
      }
      cb(null, answer);
    });
}

module.exports = new Analyser();