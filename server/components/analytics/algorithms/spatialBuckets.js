var geolib = require('geolib');
var tools = require('../AnalyticalTools');

function SpatialBuckets() {}

/**
    Calculates the amount of times a certain spatial difference between
    two points appears in a trajectory. E.g. {5[meters] : 2 [times], 6[meters]: 5 [times]}
*/
SpatialBuckets.prototype.extractFeatures =
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

      //distance = Math.round(distance);
      sum += distance;

      if (distance > distribution.biggestDistance) {
        distribution.biggestDistance = distance;
      }

      if (distance < distribution.smallestDistance) {
        distribution.smallestDistance = distance;
      }

      distribution[distance] = distribution[distance] + 1 || 1;
    }

    //set median
    distribution.mean = sum / (trajectory.geometry.coordinates.length - 1);

    if (distribution === undefined) {
      log_info('Error creating getOutlierProperties!');
      return null;
    }
    return distribution;
  }

SpatialBuckets.prototype.training =
  function (model, trajectories) {
    var sum = 0;
    var minBucketSum = 0;
    var maxBucketSum = 0;

    for (var i = 0; i < trajectories.length; i++) {
      var trajectory = trajectories[i];
      var distribution = trajectory.featureVector.spatialBuckets;
      sum += distribution.mean;
      maxBucketSum += distribution.biggestDistance;
      minBucketSum += distribution.smallestDistance;
    }
    model.spatialBuckets.totalMean = sum / trajectories.length;
    model.spatialBuckets.avrgMinBucket = Math.min(0, minBucketSum / trajectories.length);
    model.spatialBuckets.avrgMaxBucket = maxBucketSum / trajectories.length;
    return model;
  }

SpatialBuckets.prototype.detection =
  function (model, trajectory) {
    var mean = trajectory.featureVector.spatialBuckets.mean;
    var meanToMin = model.spatialBuckets.totalMean - model.spatialBuckets.avrgMinBucket;
    var meanToMax = model.spatialBuckets.avrgMaxBucket - model.spatialBuckets.totalMean;
    var maxDistToMedian = Math.max(meanToMin, meanToMax);

    var isInInterval = (mean >= model.spatialBuckets.avrgMinBucket && mean <= model.spatialBuckets.avrgMaxBucket);
    var p = 0;
    //probability in percent, that the trajectory is real
    if (isInInterval) {
      p = (maxDistToMedian - mean) / maxDistToMedian * 100;
    }

    return {
      isSpoof: p < 50,
      p: p
    };
  }

module.exports = new SpatialBuckets();