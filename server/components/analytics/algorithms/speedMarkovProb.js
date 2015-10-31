var geolib = require('geolib');
var tools = require('../AnalyticalTools');
var Presenter = require('../Presenter');

function SpeedMarkovProb() {}

SpeedMarkovProb.prototype.extractFeatures =
  function (trajectory) {
    var markovChain = {};
    var coordinates = trajectory.geometry.coordinates;
    var lastSpeed = -1;
    var speedSequence = [];
    for (var i = 0; i < coordinates.length - 1; i++) {

      var coordinateA = coordinates[i];
      var coordOne = {
        lng: coordinateA[0],
        lat: coordinateA[1],
        time: new Date(trajectory.properties.coordTimes[i]).getTime()
      }

      var coordinateB = coordinates[i + 1];
      var coordTwo = {
        lng: coordinateB[0],
        lat: coordinateB[1],
        time: new Date(trajectory.properties.coordTimes[i + 1]).getTime()
      }

      var speed = geolib.getSpeed(coordOne, coordTwo) || 0;
      var roundedSpeed = Math.round(speed);
      speedSequence.push(roundedSpeed);

      if (lastSpeed !== -1) {
        markovChain[lastSpeed] = markovChain[lastSpeed + ''] || {};
        markovChain[lastSpeed][roundedSpeed] = markovChain[lastSpeed][roundedSpeed] + 1 || 1;
      }
      lastSpeed = roundedSpeed;
    }

    return {
      markovChain: markovChain,
      speedSequence: speedSequence
    };
  }

function calculateProbabilities(markovChain) {
  //calculate probabilities of transitions
  for (var row in markovChain) {
    var transitionCount = 0;
    for (var column in markovChain[row]) {
      transitionCount += markovChain[row][column];
    }
    for (var column in markovChain[row]) {
      markovChain[row][column] = markovChain[row][column] / transitionCount;
    }
  }
  return markovChain;
}

/*
  Adds values to the model object.
  Only called once.
*/
SpeedMarkovProb.prototype.training =
  function (model, trajectories) {
    model.speedMarkovProb = {};
    var chain = model.speedMarkovProb.chain || {};
    var globalMarkov = {};
    for (var i = 0; i < trajectories.length; i++) {
      var tmpChain = trajectories[i].featureVector.speedMarkovProb.markovChain;
      for (var row in tmpChain) {
        for (var column in tmpChain[row]) {
          globalMarkov[row] = globalMarkov[row] || {};
          globalMarkov[row][column] = globalMarkov[row][column] + tmpChain[row][column] || 0 + tmpChain[row][column];
        }
      }
    }
    model.speedMarkovProb.globalMarkov = calculateProbabilities(globalMarkov);
    return model;
  }

SpeedMarkovProb.prototype.detection =
  function (model, trajectory) {
    var markovChain = trajectory.featureVector.speedMarkovProb.markovChain;
    var modelDistribution = model.speedMarkovProb.globalMarkov;
    var comparisonResult = tools.compareProbabilityMaps(markovChain, modelDistribution);
    return {
      isSpoof: (comparisonResult.p < 1),
      p: comparisonResult.p
    };
  }

module.exports = new SpeedMarkovProb();