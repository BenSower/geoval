'use strict';

var UUID = require('uuid-js'),
  _ = require('lodash'),
  geolib = require('geolib'),
  async = require('async');

var rekuire = require('rekuire'),
  TrajUtils = rekuire('TrajUtils'),
  streetsOfMunich = rekuire('streetsMunich.json').features,
  Trajectory = rekuire('trajectory.model');

function SpoofFactory() {
  var self = this;
  Trajectory.find({
      'properties.spoofLvL': 0
    },
    function (err, trajectories) {
      if (err) {
        return handleError(err, res);
      }
      self.rawTrajectories = trajectories;
      console.log('SpoofFactory initialized with ' + self.rawTrajectories.length + ' trajectories.');
      if (self.rawTrajectories.length === 0) {
        console.log('ERROR, no real trajectories registered? Import trajectories and restart!');
      }
      return trajectories;
    }
  );
}

//Base is center of munich
var baseCoordinates = {
  'lat': 48.13891266483958,
  'lon': 11.573041815506889
};

var minLength = 10;
var maxLength = 100;
var coordinateGenerators = {
  lvl1: createLvl1Coordinates,
  lvl2: createLvl2Coordinates,
  lvl3: createLvl3Coordinates
};

//HACK: To allow level 3 creation without constant querying
SpoofFactory.prototype.rawTrajectories = [];

var retries = 0;
SpoofFactory.prototype.createSpoofSet = function (lvl, amount) {

  console.log('creating ' + amount + ' lvl' + lvl + ' spoofed trajectories ');
  var spoofs = [];

  var pushFunction = function (element) {
    if (element !== null) {
      spoofs.push(element);
    } else {
      console.log('Error creating spoof, will try again later');
    }
  }

  for (var i = 0; i < amount; i++) {
    this.createSpoof(lvl, coordinateGenerators['lvl' + lvl], pushFunction);
  }

  if (spoofs.length < amount && this.retries < 30) {
    var difference = amount - spoofs.length;
    console.log('Not all spoofs satisfied the constraints, trying again for ' + difference + ' spoofs');
    this.retries++;
    spoofs.concat(this.createSpoofSet(lvl, difference));
  }
  return spoofs;
}

SpoofFactory.prototype.createSpoof = function (lvl, coordinateGenerator, cb) {
  var trajLength = getRandInt(minLength, maxLength),
    times = createRandomTimes(trajLength),
    coordinates = coordinateGenerator(trajLength, this);

  var spoof = {
    id: getName(lvl),
    properties: {
      coordTimes: times,
      spoofLvL: lvl
    },
    geometry: {
      coordinates: coordinates
    }
  };
  TrajUtils.preprocess(spoof, function (err, preprocessedSpoof) {
    if (err) throw err;
    if (preprocessedSpoof !== null && preprocessedSpoof !== undefined) {
      return cb(preprocessedSpoof);
    } else {
      console.log('error creating spoof');
      return cb(null);
    }
  });

}

/*
    http://www.movable-type.co.uk/scripts/latlong.html
*/
function createLvl1Coordinates(amount) {

  var range = 4 * Math.pow(10, 15);
  var offsetPow = Math.pow(10, 19);
  //start point gets bigger offset to diversify the start a little
  var baseCoordinate = getOffsetForCoordinate(baseCoordinates, range, Math.pow(10, 16.5));
  var coordinates = [];

  for (var i = 0; i < amount; i++) {
    //offset points based on baseCoordinate in munich
    var offsetCoord = getOffsetForCoordinate(baseCoordinate, range, offsetPow);
    baseCoordinate.lon = offsetCoord.lon;
    baseCoordinate.lat = offsetCoord.lat;
    coordinates.push([offsetCoord.lon, offsetCoord.lat]);
  }
  return coordinates;
}

function createLvl2Coordinates(amount, cb) {

  var coordinates = [];
  var anchorStreet = getRandStreet(streetsOfMunich);
  //number of intervals between street points
  var possibleIntervals = anchorStreet.geometry.coordinates.length - 1;

  var pointsPerInterval = -1;
  if (amount > possibleIntervals) {
    pointsPerInterval = Math.ceil(amount / possibleIntervals);
  } else {
    pointsPerInterval = Math.ceil(possibleIntervals / amount);
  }

  var fraction = 1 / pointsPerInterval;

  for (var i = 0; i < possibleIntervals; i++) {
    var pointA = anchorStreet.geometry.coordinates[i];
    var pointB = anchorStreet.geometry.coordinates[i + 1];
    for (var j = 1; j < pointsPerInterval + 1; j++) {
      if (coordinates.length < amount) {
        var currentFraction = (fraction * j);
        var coordinate;
        coordinate = intermediatePoint(pointA, pointB, currentFraction);
        coordinates.push(coordinate);
      } else {
        break;
      }
    }
  }
  return coordinates;
}

function createLvl3Coordinates(amount, self) {

  function getFuzzedCoordinates(trajectory, amount) {
    console.log(trajectory.id);
    var coordinates = trajectory.geometry.coordinates;
    //cut to appropriate size if original trajectory is too long
    coordinates = coordinates.slice(0, amount);

    var range = 4 * Math.pow(10, 13);
    var offsetPow = Math.pow(10, 19);

    var newCoordinates = [];

    for (var i = 0; i < amount; i++) {
      //offset points based on baseCoordinate in munich
      var coordinate = coordinates[i];
      var offsetCoord = getOffsetForCoordinate({
        lon: coordinate[0],
        lat: coordinate[1]
      }, range, offsetPow);
      console.log(coordinate[1] + ',' + coordinate[0], offsetCoord.lat + ',' + offsetCoord.lon);
      newCoordinates.push([offsetCoord.lon, offsetCoord.lat]);
    }
    return newCoordinates;
  }

  //select random trajectory
  var trajectory = self.rawTrajectories[Math.floor(Math.random() * self.rawTrajectories.length)];
  var retries = 0;
  while ((trajectory.geometry.coordinates.length < amount && retries < 100) || trajectory.geometry.coordinates[0][0] ===
    0) {
    console.log(trajectory.geometry.coordinates[0][0]);
    trajectory = self.rawTrajectories[Math.floor(Math.random() * self.rawTrajectories.length)];
    retries++;
  }
  return getFuzzedCoordinates(trajectory, amount);
}

/*
    Returns the geojson of a street, which should have at least 10 nodes.
    Worst case runtime is infinite. Yeah. I went there.
*/
function getRandStreet(streets) {
  var street = streets[getRandInt(0, streets.length)];
  if (street === undefined || street.geometry === undefined || street.geometry.coordinates === undefined) {
    console.log('Street seems to be empty, trying again', street);
    return getRandStreet(streets);
  } else {
    return (street.geometry.coordinates.length < 10) ? getRandStreet(streets) : street;
  }
}

function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function radToDeg(r) {
  return r * 180 / Math.PI;
}

/*
    Get's the point in between pointA and pointB based on the fraction f
    (f=0 => pointA, f=1 => pointB)
    http://fraserchapman.blogspot.com/2008/09/intermediate-points-on-great-circle.html
*/
function intermediatePoint(pointA, pointB, f) {

  var lat1 = degToRad(pointA[1]),
    lon1 = degToRad(pointA[0]);
  var lat2 = degToRad(pointB[1]),
    lon2 = degToRad(pointB[0]);

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

  var intermediatePoint = [radToDeg(lon), radToDeg(lat)];
  return intermediatePoint;
}

function getOffsetForCoordinate(baseCoordinate, range, offsetPow) {
  var lonOffset = getRandInt(-range, range) / offsetPow;
  var latOffset = getRandInt(-range, range) / offsetPow;
  return {
    lon: baseCoordinate.lon + lonOffset,
    lat: baseCoordinate.lat + latOffset
  };

}

function createRandomTimes(amount) {
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

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getName(level) {
  var uuid4 = UUID.create();
  return uuid4.toString() + '.lvl' + level;
}

module.exports = SpoofFactory;