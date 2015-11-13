var tools = require('../SpoofTools'),
  rekuire = require('rekuire'),
  streetsOfMunich = rekuire('streetsMunich.json').features;

function Level2() {}

Level2.prototype.generateSpoof = function (amount) {

  var coordinates = [];
  var anchorStreet = tools.getRandStreet(streetsOfMunich);
  //number of intervals between street points
  var possibleIntervals = anchorStreet.geometry.coordinates.length - 1;
  //  var pointsPerInterval = (amount > possibleIntervals) ? amount / possibleIntervals : possibleIntervals / amount;
  var pointsPerInterval = amount / possibleIntervals;
  pointsPerInterval = Math.ceil(pointsPerInterval);

  var fraction = 1 / pointsPerInterval;

  for (var i = 0; i < possibleIntervals; i++) {
    var pointA = anchorStreet.geometry.coordinates[i];
    var pointB = anchorStreet.geometry.coordinates[i + 1];
    for (var j = 1; j < pointsPerInterval + 1; j++) {
      if (coordinates.length < amount) {
        var currentFraction = (fraction * j);
        var coordinate;
        coordinate = tools.intermediatePoint(pointA, pointB, currentFraction);
        coordinates.push(coordinate);
      } else {
        break;
      }
    }
  }
  return coordinates;
}

module.exports = new Level2();