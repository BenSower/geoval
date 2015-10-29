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
      'biggestDistance': 0
    };

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

      distance = Math.round(distance);

      if (distance > distribution.biggestDistance) {
        distribution.biggestDistance = distance;
      }

      //var bucketedDistance = Math.round(distance / 10) * 10
      if (distribution[distance] === undefined) {
        distribution[distance] = 1;
      } else {
        distribution[distance]++;
      }
    }

    if (distribution === undefined) {
      log_info('Error creating getOutlierProperties!');
      return null;
    }
    return distribution;
  }

SpatialBuckets.prototype.training =
  function (model, trajectories) {
    var bucketCount = 0;
    var minBucketSum = 0;
    var maxBucketSum = 0;

    var minRed = function (a, b) {
      if (b === 'biggestDistance')
        return a;
      else
        return Math.min(a, b);
    };

    for (var i = 0; i < trajectories.length; i++) {
      var trajectory = trajectories[i];
      var distribution = trajectory.featureVector.spatialBuckets;
      bucketCount += Object.keys(distribution).length;
      maxBucketSum += distribution.biggestDistance;
      //console.log(distribution.biggestDistance);
      var buckets = Object.keys(distribution);
      var smallesBucket = buckets.reduce(minRed);

      minBucketSum += smallesBucket;
    }
    model.spatialBuckets.avrgBucketCount = bucketCount / trajectories.length;
    model.spatialBuckets.avrgMinBucket = Math.min(0, minBucketSum / trajectories.length);
    model.spatialBuckets.avrgMaxBucket = maxBucketSum / trajectories.length;
    //console.log(model);
    return model;
  }

SpatialBuckets.prototype.detection =
  function (model, trajectory) {
    var bucketCount = Object.keys(trajectory.featureVector.spatialBuckets).length;

    var isInAvrgRange = (bucketCount > model.spatialBuckets.avrgMinBucket && bucketCount < model.spatialBuckets.avrgMaxBucket);
    var maxDistToMedian = Math.max(model.spatialBuckets.avrgBucketCount - model.spatialBuckets.avrgMinBucket, model.spatialBuckets
      .avrgMaxBucket - model.spatialBuckets.avrgBucketCount);
    //probability in percent, that the trajectory is real
    var p = 0;

    if (isInAvrgRange) {
      //p = (maxDistToMedian - bucketCount) / maxDistToMedian * 100;
      p = Math.pow((maxDistToMedian - bucketCount) / maxDistToMedian, 2) * 100;
      //p = p.toFixed(2);
    }

    return {
      isSpoof: p < 1,
      p: p
    };
  }

module.exports = new SpatialBuckets();