var geolib = require('geolib');
var tools = require('../AnalyticalTools');

function SpeedMarkov() {}

SpeedMarkov.prototype.extractFeatures =
  function (trajectory) {
    var markovChain = {};
    var coordinates = trajectory.geometry.coordinates;
    var lastSpeed = -1;
    for (var i = 0; i < coordinates.length - 1; i++) {

      var coordinateA = coordinates[i],
        lonA = coordinateA[0],
        latA = coordinateA[1],
        timeA = trajectory.properties.coordTimes[i];

      var coordinateB = coordinates[i + 1],
        lonB = coordinateB[0],
        latB = coordinateB[1]
      timeB = trajectory.properties.coordTimes[i + 1];

      var speed = geolib.getSpeed({
        lng: lonA,
        lat: latA,
        time: timeA
      }, {
        lng: lonB,
        lat: latB,
        time: timeB
      });
      var roundedSpeed = Math.round(speed);

      if (lastSpeed !== -1) {
        markovChain[lastSpeed] = markovChain[lastSpeed + ''] || {};
        markovChain[lastSpeed][roundedSpeed] = markovChain[lastSpeed][roundedSpeed] + 1 || 1;
      }
      lastSpeed = roundedSpeed;
    }
    console.log(markovChain);
    return markovChain;
  }

SpeedMarkov.prototype.training =
  function (model, trajectories) {
    return model;
  }

SpeedMarkov.prototype.detection =
  function (model, trajectory) {

    return {
      isSpoof: true,
      p: 0.33
    };
  }

module.exports = new SpeedMarkov();