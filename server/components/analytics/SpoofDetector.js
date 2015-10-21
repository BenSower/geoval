'use strict';
var Table = require('cli-table');
var plotly = require('plotly')('BenSower', 'w7as40pc4l');

SpoofDetector.prototype.results = {};

SpoofDetector.prototype.trainingAlgorithms = {
  bucketTraining: bucketTraining,
  timeTraining: timeTraining
};

SpoofDetector.prototype.detectionAlgorithms = {
  bucketDetection: bucketDetection,
  timeDetection: timeDetection
};

function SpoofDetector() {}
/*
    Reset/Initialize all results
*/
SpoofDetector.prototype.resetDetector = function () {

  this.model = {
    sampleCount: {
      avrgSampleCount: -1,
      minSampleCount: -1,
      maxSampleCount: -1
    },
    timeDifference: {
      absoluteDistribution: {},
      normalizedDistribution: {}
    },
    buckets: {
      absoluteDistribution: {},
      normalizedDistribution: {}
    }
  };
  for (var algorithmKey in this.detectionAlgorithms) {
    if (this.detectionAlgorithms.hasOwnProperty(algorithmKey)) {
      this.results[algorithmKey] = {
        falseSpoofs: [], //trajectories which are classified as spoofs
        falseTrajectories: [], //spoofs which are classified as trajectories
        spoofs: [],
        realTrajectories: []
      };
    }
  }
}

SpoofDetector.prototype.detectSpoofs = function (trajectories, spoofs) {

  SpoofDetector.prototype.rawTrajectories = trajectories;
  SpoofDetector.prototype.rawSpoofs = spoofs;
  this.resetDetector();
  this.trainModel(trajectories);
  var spoofProbablilites = this.analyseTrajectories(spoofs);
  var trajectoryProbablilites = this.analyseTrajectories(trajectories);
  this.presentResults(this.results, spoofs[0].properties.spoofLvL);
  //createPlotlyGraph([spoofProbablilites, trajectoryProbablilites]);
  return {
    results: this.results,
    model: this.model
  };
}

function createPlotlyGraph(rawInput) {
  function mapToArray(map) {
    var x = Object.keys(map).sort();
    var y = [];
    for (var i = 0; i < x.length; i++) {
      var key = x[i];
      y.push(map[key]);
    }
    return {
      x: x,
      y: y
    };
  }

  var data = [];
  var aggregated = {};
  for (var i = 0; i < rawInput.length; i++) {
    var input = rawInput[i];
    for (var j = 0; j < input.length; j++) {
      var val = input[j].toFixed(2);
      aggregated[val] = aggregated[val] + 1 || 1;
    }
    var map = mapToArray(aggregated);
    //x is filled with values from 0 to input.length
    var trace = {
      x: map.x,
      y: map.y,
      mode: 'lines',
      name: 'wat' + i,
      line: {
        dash: 'solid',
        width: 4
      }
    };
    data.push(trace);
  }

  var layout = {
    fileopt: 'overwrite',
    filename: 'test'
  };

  plotly.plot(data, layout, function (err, msg) {
    if (err) return console.log(err);
    console.log(msg);
  });
}
/*
    Trains the model by analysing real trajectories
*/
SpoofDetector.prototype.trainModel = function (trajectories) {
  for (var algorithmKey in this.trainingAlgorithms) {
    if (this.trainingAlgorithms.hasOwnProperty(algorithmKey)) {
      this.model = this.trainingAlgorithms[algorithmKey](this.model, trajectories);
    }
  }
}

/**
 * Applies detectionAlgorithms to the trajectories
 */
SpoofDetector.prototype.analyseTrajectories = function (trajectories) {
  var probabilities = [];
  for (var algorithmKey in this.detectionAlgorithms) {
    for (var h = 0; h < trajectories.length; h++) {
      var trajectory = trajectories[h];
      var detectionResult = this.detectionAlgorithms[algorithmKey](this.model, trajectory);
      probabilities.push(detectionResult.p);
      if (detectionResult.isSpoof) {
        var tmp = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].falseSpoofs.push(trajectory) :
          this.results[algorithmKey].spoofs.push(trajectory);
      } else {
        var tmp2 = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].realTrajectories.push(
          trajectory) : this.results[algorithmKey].falseTrajectories.push(trajectory);
      }
    }
  }
  return probabilities;
}
SpoofDetector.prototype.presentResults = function (results, spoofLvL) {

  var columns = ['SpoofLvl' + spoofLvL,
    'Correct spoofs',
    'Wrong spoofs',
    'Correct trajs',
    'Wrong trajs',
    'Spoof rate',
    'Traj rate'
  ];
  var table = new Table({
    head: columns
  });

  for (var algorithm in results) {
    if (!results.hasOwnProperty(algorithm)) {
      continue;
    }

    var result = results[algorithm];

    var spoofCount = result.spoofs.length;
    var realTrajCount = result.realTrajectories.length;
    var falseSpoofCount = result.falseSpoofs.length;
    var falseTrajCount = result.falseTrajectories.length;
    var spoofDetectionRate = (spoofCount / this.rawSpoofs.length) * 100;
    var trajDetectionRate = (realTrajCount / this.rawTrajectories.length) * 100;

    var row = {};
    row[algorithm] = [spoofCount, falseTrajCount, realTrajCount, falseSpoofCount, spoofDetectionRate.toFixed(2) +
      '%',
      trajDetectionRate.toFixed(2) + '%'
    ];
    table.push(row);
  }

  console.log(table.toString());

}

function compareIntMaps(vectorA, vectorB) {

  var misses = 0;
  var diffs = []

  for (var key in vectorA) {
    if (!vectorA.hasOwnProperty(key)) {
      continue;
    }
    var diff;
    if (vectorB[key] !== undefined) {
      var valA = vectorA[key];
      var valB = vectorB[key];
      var diff = (valA > valB) ? valB / valA : valA / valB;
      //perceńtage of how close the values are to each other in this bucket
      diffs.push(diff * 100);
    } else {
      diffs.push(0);
      misses++;
    }
  }

  var sum = diffs.reduce(function (a, b) {
    return a + b;
  }, 0);

  var possibleKeys = Object.keys(vectorA).length;
  var p = (sum / possibleKeys);

  return {
    p: p,
    misses: misses,
    missPercentage: ((misses / diffs.length) * 100).toFixed(2)
  };
}

function setTimeDistribution(model, trajectories) {
  var absoluteDistribution = model.timeDifference.absoluteDistribution;
  for (var i = 0; i < trajectories.length; i++) {
    var trajectory = trajectories[i];
    for (var key in trajectory.featureVector.timeDifference.absoluteDistribution) {
      if (trajectory.featureVector.timeDifference.absoluteDistribution.hasOwnProperty(key)) {
        absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
      }
    }
  }
  model.timeDifference.absoluteDistribution = absoluteDistribution;
  model.timeDifference.normalizedDistribution = getNormalizedDistribution(absoluteDistribution, trajectories);
  return model;
}

function getNormalizedDistribution(absoluteDistribution, trajectories) {
  var normalizedDistribution = JSON.parse(JSON.stringify(absoluteDistribution));
  var nodePoints = trajectories.reduce(function (accum, trajB) {
    return accum + trajB.geometry.coordinates.length;
  }, 0);
  if (trajectories.length > 1) {
    //normalizing/averaging every bucket value
    for (var bucket in normalizedDistribution) {
      if (normalizedDistribution.hasOwnProperty(bucket))
        normalizedDistribution[bucket] = (normalizedDistribution[bucket] / nodePoints);
    }
  }
  return normalizedDistribution;
}
/**
######################################################################################################################
                                            Training Algos
######################################################################################################################
*/
function bucketTraining(model, trajectories) {
  var absoluteDistribution = model.buckets.absoluteDistribution
  for (var i = 0; i < trajectories.length; i++) {
    var trajectory = trajectories[i];
    for (var key in trajectory.featureVector.spatialDistance) {
      if (key !== 'biggestDistance')
        absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
    }
  }
  model.buckets.absoluteDistribution = absoluteDistribution;
  model.buckets.normalizedDistribution = getNormalizedDistribution(absoluteDistribution, trajectories);
  return model;
}

/*
    Counts and averages the amount of samples in a trajectory
*/
function timeTraining(model, trajectories) {
  model = setTimeDistribution(model, trajectories);
  return model;
}

/**
######################################################################################################################
                                            Detection Algos
                            An algo needs to return and object like {isSpoof : true}
######################################################################################################################
*/

function bucketDetection(model, trajectory) {
  var trajectoryDistribution = trajectory.featureVector.spatialDistance;
  var modelDistribution = model.buckets.normalizedDistribution;
  var comparisonResult = compareIntMaps(trajectoryDistribution, modelDistribution);

  return {
    isSpoof: comparisonResult.p < 0.06 || (comparisonResult.missPercentage >= 60),
    p: comparisonResult.p
  };
}

function timeDetection(model, trajectory) {
  var trajectoryDistribution = trajectory.featureVector.timeDifference.absoluteDistribution;
  var modelDistribution = model.timeDifference.normalizedDistribution;
  var comparisonResult = compareIntMaps(trajectoryDistribution, modelDistribution);
  return {
    isSpoof: (comparisonResult.p < 0.01) || (comparisonResult.missPercentage > 0),
    p: comparisonResult.p
  };
}

module.exports = new SpoofDetector();