'use strict';
var SpoofDetector = require('./SpoofDetector'),
  async = require('async'),
  Presenter = require('./Presenter'),
  mongoose = require('mongoose'),
  _ = require('lodash');

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
          //var analyRes = JSON.parse(JSON.stringify(SpoofDetector.detectSpoofs(results.trajectories, spoofs)));
          var analyRes = _.clone(SpoofDetector.detectSpoofs(results.trajectories, spoofs));
          answer.push(analyRes);
          Presenter.presentResults(analyRes.results, spoofs, results.trajectories, i);
          //Presenter.createPlotlyGraph(analyRes, 'speedMarkovProb');
        }
      }

      mergeResults(answer);
      cb(null, answer);
    });
}

function mergeResults(results) {
  var trajectories = {
    0: {},
    1: {},
    2: {},
    3: {}
  };
  for (var spoofLvL = 0; spoofLvL < results.length; spoofLvL++) {
    var spoofLvLResults = results[spoofLvL].results;
    for (var algorithm in spoofLvLResults) {
      var categoryResults = spoofLvLResults[algorithm];
      for (var categoryResultType in categoryResults) {
        var categoryResult = categoryResults[categoryResultType];
        for (var j = 0; j < categoryResult.length; j++) {
          var trajectory = categoryResult[j];
          trajectories[spoofLvL][trajectory._id] = trajectories[spoofLvL][trajectory._id] || {
            isSpoof: [],
            isReal: []
          };
          if (categoryResultType === 'realTrajectories' || categoryResultType === 'falseTrajectories') {
            trajectories[spoofLvL][trajectory._id].isReal.push(algorithm);
          } else if (categoryResultType === 'spoofs' || categoryResultType === 'falseSpoofs') {
            trajectories[spoofLvL][trajectory._id].isSpoof.push(algorithm);
          } else {
            console.log(categoryResultType);
          }
        }
      }
    }
  }

  var correct = {
    0: 0,
    1: 0,
    2: 0,
    3: 0
  };
  var incorrect = {
    0: 0,
    1: 0,
    2: 0,
    3: 0
  };
  for (var spoofLvL in trajectories) {
    for (var id in trajectories[spoofLvL]) {
      var res = trajectories[spoofLvL][id];
      //is categorized as spoof
      if (res.isSpoof.length <= 4) {
        (spoofLvL !== 0 || spoofLvL !== 4) ? correct[spoofLvL]++: incorrect[spoofLvL]++;
        //not categorized as spoof
      } else {
        (spoofLvL === 0 || spoofLvL === 4) ? correct[spoofLvL]++: incorrect[spoofLvL]++;
      }
    }
    var total = correct[spoofLvL] + incorrect[spoofLvL];
    correct[spoofLvL] = (correct[spoofLvL] / total).toFixed(2) * 100;
    incorrect[spoofLvL] = (incorrect[spoofLvL] / total).toFixed(2) * 100;
  }
  console.log('correct ', correct, 'incorrect', incorrect);

}

module.exports = new Analyser();