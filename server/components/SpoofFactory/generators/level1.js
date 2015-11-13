var tools = require('../SpoofTools');

function Level1() {}

Level1.prototype.generateSpoof = function (amount) {
  //Base is center of munich
  var baseCoordinates = {
    'lat': 48.13891266483958,
    'lon': 11.573041815506889
  };

  var range = 4 * Math.pow(10, 15);
  var offsetPow = Math.pow(10, 19);
  //start point gets bigger offset to diversify the start a little
  var baseCoordinate = tools.getOffsetForCoordinate(baseCoordinates, range, Math.pow(10, 16.5));
  var coordinates = [];

  for (var i = 0; i < amount; i++) {
    //offset points based on baseCoordinate in munich
    var offsetCoord = tools.getOffsetForCoordinate(baseCoordinate, range, offsetPow);
    baseCoordinate.lon = offsetCoord.lon;
    baseCoordinate.lat = offsetCoord.lat;
    coordinates.push([offsetCoord.lon, offsetCoord.lat]);
  }
  return coordinates;
}

module.exports = new Level1();