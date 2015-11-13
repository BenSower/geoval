var UUID = require('uuid-js');

function SpoofTools() {}

/*
    Returns the geojson of a street, which should have at least 10 nodes.
    Worst case runtime is infinite. Yeah. I went there.
*/
SpoofTools.prototype.getRandStreet = function (streets) {
  var street = streets[this.getRandInt(0, streets.length)];
  if (street === undefined || street.geometry === undefined || street.geometry.coordinates === undefined) {
    console.log('Street seems to be empty, trying again', street);
    return this.getRandStreet(streets);
  } else {
    return (street.geometry.coordinates.length < 10) ? this.getRandStreet(streets) : street;
  }
}

SpoofTools.prototype.getRandInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

SpoofTools.prototype.degToRad = function (d) {
  return d * Math.PI / 180;
}

SpoofTools.prototype.radToDeg = function (r) {
  return r * 180 / Math.PI;
}

/*
    Get's the point in between pointA and pointB based on the fraction f
    (f=0 => pointA, f=1 => pointB)
    http://fraserchapman.blogspot.com/2008/09/intermediate-points-on-great-circle.html
*/
SpoofTools.prototype.intermediatePoint = function (pointA, pointB, f) {

    var lat1 = this.degToRad(pointA[1]),
      lon1 = this.degToRad(pointA[0]);
    var lat2 = this.degToRad(pointB[1]),
      lon2 = this.degToRad(pointB[0]);

    var distance = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) + Math.cos(lat1) * Math.cos(
        lat2) *
      Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
    var A = Math.sin((1 - f) * distance) / Math.sin(distance);
    var B = Math.sin(f * distance) / Math.sin(distance);
    var x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    var y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    var lon = Math.atan2(y, x);

    var intermediatePoint = [this.radToDeg(lon), this.radToDeg(lat)];
    return intermediatePoint;
  }
  /*
      http://www.movable-type.co.uk/scripts/latlong.html
  */
SpoofTools.prototype.getOffsetForCoordinate = function (baseCoordinate, range, offsetPow) {
  var lonOffset = this.getRandInt(-range, range) / offsetPow;
  var latOffset = this.getRandInt(-range, range) / offsetPow;
  return {
    lon: baseCoordinate.lon + lonOffset,
    lat: baseCoordinate.lat + latOffset
  };

}

SpoofTools.prototype.createRandomTimes = function (amount) {
  var times = [];
  var d = new Date();
  var time = d.getTime();

  for (var i = 0; i < amount; i++) {
    //random time between timestamps 1-60 seconds
    //time += randomIntFromInterval(950, 1050);
    time += 1000;
    times.push(time);
  }
  return times;
}

SpoofTools.prototype.randomIntFromInterval = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

SpoofTools.prototype.getName = function (level) {
  var uuid4 = UUID.create();
  return uuid4.toString() + '.lvl' + level;
}

module.exports = new SpoofTools();