var geolib = require('geolib');
var tools = require('../AnalyticalTools');

function SpatialMean() {}

/**
    Calculates the amount of times a certain spatial difference between
    two points appears in a trajectory. E.g. {5[meters] : 2 [times], 6[meters]: 5 [times]}
*/
SpatialMean.prototype.extractFeatures =
  function (trajectory) {
    var distribution = {
      'biggestDistance': 0,
      'smallestDistance': 9999
    };

    var sum = 0;
    //calculate distances between every coordinate and the next one
    for (var i = 0; i < trajectory.geometry.coordinates.length - 1; i++) {
      var firstCoordinate = trajectory.geometry.coordinates[i];
      var secondCoordinate = trajectory.geometry.coordinates[i + 1];
      var distance = geolib.getDistance({
        latitude: firstCoordinate[1],
        longitude: firstCoordinate[0]
      }, {
        latitude: secondCoordinate[1],
        longitude: secondCoordinate[0]
      }, 1);

      sum += distance;

      if (distance > distribution.biggestDistance) {
        distribution.biggestDistance = distance;
      }
      if (distance < distribution.smallestDistance) {
        distribution.smallestDistance = distance;
      }
      distribution[distance] = distribution[distance] + 1 || 1;
    }

    distribution.mean = sum / (trajectory.geometry.coordinates.length - 1);

    if (distribution === undefined) {
      console.log('Error creating featureVector!');
      return null;
    }
    return distribution;
  }

SpatialMean.prototype.training =
  function (model, trajectories) {
    var sum = 0;
    var minBucketSum = 0;
    var maxBucketSum = 0;

    for (var i = 0; i < trajectories.length; i++) {
      var trajectory = trajectories[i];
      var distribution = trajectory.featureVector.spatialMean;

      sum += distribution.mean;
      maxBucketSum += distribution.biggestDistance;
      minBucketSum += distribution.smallestDistance;
    }
    model.spatialMean.avrgMean = sum / trajectories.length;
    model.spatialMean.avrgMin = minBucketSum / trajectories.length;
    model.spatialMean.avrgMax = maxBucketSum / trajectories.length;
    return model;
  }

SpatialMean.prototype.detection =
  function (model, trajectory) {
    var mean = trajectory.featureVector.spatialMean.mean;
    var meanToMin = model.spatialMean.avrgMean - model.spatialMean.avrgMin;
    var meanToMax = model.spatialMean.avrgMax - model.spatialMean.avrgMean;
    var maxDistToMean = Math.max(meanToMin, meanToMax);
    //var maxDistToMean = model.spatialMean.avrgMax - model.spatialMean.avrgMin;
    //var isInInterval = (mean >= model.spatialMean.avrgMin && mean <= model.spatialMean.avrgMax);
    var p = 0;
    var meanDiff = Math.abs(model.spatialMean.avrgMean - mean);
    p = Math.max(0, maxDistToMean - meanDiff) / maxDistToMean * 100;

    return {
      isSpoof: p < 70,
      p: p
    };
  }

module.exports = new SpatialMean();