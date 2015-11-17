var tools = require('../SpoofTools');
var rekuire = require('rekuire'),
  Trajectory = rekuire('trajectory.model');

var rawTrajectories = [];

function Level3() {
  var self = this;
  initializeRawTrajectories();
}

function initializeRawTrajectories() {
  Trajectory.find({
      'properties.spoofLvL': 0
    },
    function (err, trajectories) {
      if (err) {
        throw err;
      }
      rawTrajectories = trajectories;
      console.log('SpoofFactory initialized with ' + rawTrajectories.length + ' trajectories.');
      if (rawTrajectories.length === 0) {
        console.log('ERROR, no real trajectories registered? Import real trajectories and restart!');
      }
      return trajectories;
    });
}

Level3.prototype.generateSpoof = function (amount) {
  //select random trajectory from rawTrajectories
  var trajectory = rawTrajectories[Math.floor(Math.random() * rawTrajectories.length)];
  var retries = 0;
  //retry selecteing random trajectory, if initial one is not long enough
  while ((trajectory.geometry.coordinates.length < amount && retries < 100) || trajectory.geometry.coordinates[
      0][0] === 0) {
    trajectory = rawTrajectories[Math.floor(Math.random() * rawTrajectories.length)];
    retries++;
  }
  return getFuzzedCoordinates(trajectory, amount);
}

function getFuzzedCoordinates(trajectory, amount) {
  var coordinates = trajectory.geometry.coordinates;
  //cut to appropriate size if original trajectory is too long
  coordinates = coordinates.slice(0, amount);
  var range = Math.pow(10, 13);
  var offsetPow = Math.pow(10, 19);
  var newCoordinates = [];

  for (var i = 0; i < amount; i++) {
    //offset points based on baseCoordinate in munich
    var coordinate = coordinates[i];
    var offsetCoord = tools.getOffsetForCoordinate({
      lon: coordinate[0],
      lat: coordinate[1]
    }, range, offsetPow);
    //console.log(coordinate[1] + ',' + coordinate[0], offsetCoord.lat + ',' + offsetCoord.lon);
    newCoordinates.push([offsetCoord.lon, offsetCoord.lat]);
  }
  return newCoordinates;
}

module.exports = new Level3();