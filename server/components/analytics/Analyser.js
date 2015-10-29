'use strict';
var SpoofDetector = require('./SpoofDetector'),
  async = require('async'),
  Presenter = require('./Presenter'),
  mongoose = require('mongoose');

var Trajectory = mongoose.model('Trajectory');

function Analyser() {}

Analyser.prototype.analyse = function (cb) {

  var trainingTrajectoryAmount = 170;
  async.parallel({
      trajectories: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 0
        }, {}, {
          limit: trainingTrajectoryAmount
        }, function (err, trajectories) {
          if (trajectories.length === 0) {
            console.log('no training/spoofLvl1 trajectories available');
          }
          callback(err, trajectories);
        });
      },
      //second part of lvl0 spoofs
      lvl0spoofs: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 0
        }, {}, {
          skip: trainingTrajectoryAmount
        }, function (err, lvl3spoofs) {
          callback(err, lvl3spoofs);
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
      for (var i = 0; i < Object.keys(results).length; i++) {
        var spoofs = results['lvl' + i + 'spoofs'];
        if (spoofs !== undefined && spoofs.length > 0) {

          //HACK to ensure that lvl0 trajectories are counted as spoofs
          if (i === 0) {
            spoofs = spoofs.map(function (a) {
              a.properties.spoofLvL = 3;
              return a;
            });
          }
          console.log('\nAnalyzing LvL' + i + ' trajectories:');
          var analyRes = SpoofDetector.detectSpoofs(results.trajectories, spoofs);
          answer.push(analyRes);
          Presenter.presentResults(analyRes.results, spoofs, results.trajectories, i);
          //Presenter.createPlotlyGraph(analyRes, 'spatialBuckets');
        }
      }
      mergeResults(answer);
      cb(null, answer);
    });
}

function mergeResults(results) {
  var trajectories = {};
  for (var spoofLvl = 0; spoofLvl < results.length; spoofLvl++) {
    var spoofLvLResults = results[spoofLvl].results;
    for (var algorithm in spoofLvLResults) {
      var categoryResults = spoofLvLResults[algorithm];
      for (var categoryResultType in categoryResults) {
        var categoryResult = categoryResults[categoryResultType];
        for (var j = 0; j < categoryResult.length; j++) {
          var trajectory = categoryResult[j];
          trajectories[trajectory._id] = trajectories[trajectory._id] || {};
          trajectories[trajectory._id][spoofLvl] = {

          }
        }
      }
    }

  }
}

module.exports = new Analyser();