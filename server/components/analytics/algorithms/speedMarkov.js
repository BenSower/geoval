var geolib = require('geolib');
var tools = require('../AnalyticalTools');
var Presenter = require('../Presenter');

function SpeedMarkov() {}

SpeedMarkov.prototype.extractFeatures =
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
SpeedMarkov.prototype.training =
  function (model, trajectories) {
    model.speedMarkov = {};
    var chain = model.speedMarkov.chain || {};
    var globalMarkov = {};
    for (var i = 0; i < trajectories.length; i++) {
      var tmpChain = trajectories[i].featureVector.speedMarkov.markovChain;
      for (var row in tmpChain) {
        for (var column in tmpChain[row]) {
          globalMarkov[row] = globalMarkov[row] || {};
          globalMarkov[row][column] = globalMarkov[row][column] + tmpChain[row][column] || 0 + tmpChain[row][column];
        }
      }
    }

    model.speedMarkov.globalMarkov = globalMarkov;
    var probabilities = calculateProbabilities(globalMarkov);
    model.speedMarkov.probabilities = probabilities;
    return model;
  }

SpeedMarkov.prototype.detection =
  function (model, trajectory) {
    var probability = 1;
    var speedSequence = trajectory.featureVector.speedMarkov.speedSequence;
    for (var i = 0; i < speedSequence.length - 1; i++) {
      var speed1 = speedSequence[i];
      var speed2 = speedSequence[i + 1];
      var transitionProbability = 0;
      if (model.speedMarkov.probabilities[speed1] !== undefined) {
        transitionProbability = model.speedMarkov.probabilities[speed1][speed2] || 0;
      }
      probability = probability * transitionProbability;
    }

    return {
      isSpoof: probability <= 0, //Math.pow(0.1, 100),
      p: probability
    };
  }

module.exports = new SpeedMarkov();