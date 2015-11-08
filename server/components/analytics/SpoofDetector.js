'use strict';
var path = require('path'),
  fs = require('fs'),
  tools = require('./AnalyticalTools'),
  //algorithms
  spatialDistance = require('./algorithms/spatialDistance'),
  timeGap = require('./algorithms/timeGap');

SpoofDetector.prototype.results = {};
SpoofDetector.prototype.model = {};
SpoofDetector.prototype.trainingAlgorithms = {};
SpoofDetector.prototype.detectionAlgorithms = {};

function SpoofDetector() {
  var self = this;
  var normalizedAlgorithmPath = path.join(__dirname, 'algorithms');

  fs.readdirSync(normalizedAlgorithmPath).forEach(function (file) {
    var algorithm = require('./algorithms/' + file);
    var algorithmName = path.basename(file, '.js');
    self.trainingAlgorithms[algorithmName] = algorithm.training;
    self.detectionAlgorithms[algorithmName] = algorithm.detection;
  });

}
/*
    Reset/Initialize all results
*/
SpoofDetector.prototype.resetDetector = function () {
  for (var algorithmKey in this.detectionAlgorithms) {
    this.model[algorithmKey] = {};
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
  return {
    results: this.results,
    model: this.model,
    spoofProbabilities: this.analyseTrajectories(spoofs),
    trajectoryProbabilities: this.analyseTrajectories(trajectories)
  };
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
  var probabilityLvl = {};
  for (var algorithm in this.detectionAlgorithms) {
    probabilityLvl[algorithm] = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: []
    }
  }

  for (var algorithmKey in this.detectionAlgorithms) {
    for (var h = 0; h < trajectories.length; h++) {
      var trajectory = trajectories[h];
      var detectionResult = this.detectionAlgorithms[algorithmKey](this.model, trajectory);
      probabilityLvl[algorithmKey][trajectory.properties.spoofLvL].push(detectionResult.p);
      if (detectionResult.isSpoof) {
        var tmp = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].falseSpoofs.push(trajectory) :
          this.results[algorithmKey].spoofs.push(trajectory);
      } else {
        var tmp2 = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].realTrajectories.push(
          trajectory) : this.results[algorithmKey].falseTrajectories.push(trajectory);
      }
    }
  }
  return probabilityLvl;
}

module.exports = new SpoofDetector();