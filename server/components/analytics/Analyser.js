'use strict';
var SpoofDetector = require('./SpoofDetector'),
  async = require('async'),
  Presenter = require('./Presenter'),
  mongoose = require('mongoose'),
  _ = require('lodash');

var Trajectory = mongoose.model('Trajectory');

function Analyser() {}

Analyser.prototype.analyse = function (cb) {

  var trainingTrajectoryAmount = 201;
  async.parallel({
      trajectories: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 0
        }, {}, {
          limit: trainingTrajectoryAmount
        }, function (err, trajectories) {
          if (trajectories.length === 0) {
            console.log('no training/spoofLvL1 trajectories available');
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
      },
      lvl3spoofs: function (callback) {
        Trajectory.find({
          'properties.spoofLvL': 3
        }, function (err, lvl3spoofs) {
          callback(err, lvl3spoofs);
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
              a.properties.spoofLvL = 4;
              return a;
            });
          }
          console.log('\nAnalyzing LvL' + i + ' trajectories:');
          var analyRes = SpoofDetector.detectSpoofs(results.trajectories, spoofs);
          var table = Presenter.presentResults(analyRes.results, spoofs, results.trajectories, i);
          answer.push(table);
        }
      }
      cb(null, answer);
    });
}

module.exports = new Analyser();