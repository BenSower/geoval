'use strict';
var Table = require('cli-table');

SpoofDetector.prototype.model = {
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
}

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

SpoofDetector.prototype.detectSpoofs = function (trajectories, spoofs) {

  SpoofDetector.prototype.rawTrajectories = trajectories;
  SpoofDetector.prototype.rawSpoofs = spoofs;

  this.resetResults();
  this.trainModel(trajectories);
  this.analyseTrajectories(spoofs);
  this.analyseTrajectories(trajectories);
  this.presentResults(this.results, spoofs[0].properties.spoofLvL);
  return {
    results: this.results,
    model: this.model
  };
}

/*
    Reset/Initialize all results
*/
SpoofDetector.prototype.resetResults = function () {

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

  for (var algorithmKey in this.detectionAlgorithms) {
    for (var h = 0; h < trajectories.length; h++) {
      var trajectory = trajectories[h];
      if (this.detectionAlgorithms[algorithmKey](this.model, trajectory).isSpoof) {
        var tmp = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].falseSpoofs.push(trajectory) :
          this.results[algorithmKey].spoofs.push(trajectory);
      } else {
        var tmp2 = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].realTrajectories.push(
          trajectory) : this.results[algorithmKey].falseTrajectories.push(trajectory);
      }
    }
  }
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
    misses: misses
  };
}

function setTimeDistribution(model, trajectories) {
  var absoluteDistribution = model.timeDifference.absoluteDistribution;
  for (var i = 0; i < trajectories.length; i++) {
    var trajectory = trajectories[i];
    for (var key in trajectory.featureVector.timeDifference) {
      if (trajectory.featureVector.timeDifference.hasOwnProperty(key))
        absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
    }
  }
  model.timeDifference.absoluteDistribution = absoluteDistribution;
  model.timeDifference.normalizedDistribution = getNormalizedDistribution(absoluteDistribution, trajectories);
  return model;
}

function getNormalizedDistribution(absoluteDistribution, trajectories) {
  var normalizedDistribution = absoluteDistribution;
  if (trajectories.length > 1) {
    //normalizing/averaging every bucket value
    for (var bucket in normalizedDistribution) {
      if (normalizedDistribution.hasOwnProperty(bucket))
        normalizedDistribution[bucket] = normalizedDistribution[bucket] / trajectories.length;
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

  for (var i = 0; i < trajectories.length; i++) {
    var trajectory = trajectories[i];
    for (var key in trajectory.featureVector.spatialDistance) {
      if (key !== 'biggestDistance')
        model.buckets.absoluteDistribution[key] = model.buckets.absoluteDistribution[key] + 1 || 1;
    }
  }
  model.buckets.normalizedDistribution = getNormalizedDistribution(model.buckets.absoluteDistribution, trajectories);
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

/*
    Counts and averages the amount of samples in a trajectory
*/
function timeDetection(model, trajectory) {
  var trajectoryDistribution = trajectory.featureVector.timeDifference.absoluteDistribution;
  var modelDistribution = model.timeDifference.normalizedDistribution;
  var comparisonResult = compareIntMaps(trajectoryDistribution, modelDistribution);
  return {
    isSpoof: comparisonResult.p < 1.5,
    p: comparisonResult.p
  };
}

function bucketDetection(model, trajectory) {
  var trajectoryDistribution = trajectory.featureVector.spatialDistance;
  var modelDistribution = model.buckets.normalizedDistribution;
  var comparisonResult = compareIntMaps(trajectoryDistribution, modelDistribution);
  return {
    isSpoof: comparisonResult.p < 7,
    p: comparisonResult.p
  };
}

module.exports = new SpoofDetector();