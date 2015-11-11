var geolib = require('geolib');
var tools = require('../AnalyticalTools');

function SpatialDistance() {}

/**
    Calculates the amount of times a certain spatial difference between
    two points appears in a trajectory. E.g. {5[meters] : 2 [times], 6[meters]: 5 [times]}
*/
SpatialDistance.prototype.extractFeatures =
  function (trajectory) {
    var spatialDistances = {
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

      if (distance > spatialDistances.biggestDistance) {
        spatialDistances.biggestDistance = distance;
      }
      spatialDistances[distance] = spatialDistances[distance] + 1 || 1;
    }

    if (spatialDistances === undefined) {
      log_info('Error creating getOutlierProperties!');
      return null;
    }
    return spatialDistances;
  }

SpatialDistance.prototype.training =
  function (model, trajectories) {
    model.spatialDistance = model.spatialDistance || {};
    var absoluteDistribution = model.spatialDistance.absoluteDistribution || {};
    for (var i = 0; i < trajectories.length; i++) {
      var trajectory = trajectories[i];
      for (var key in trajectory.featureVector.spatialDistance) {
        if (key !== 'biggestDistance')
          absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
      }
    }
    model.spatialDistance.absoluteDistribution = absoluteDistribution;
    model.spatialDistance.normalizedDistribution = tools.getNormalizedDistribution(absoluteDistribution, trajectories);
    return model;
  }

SpatialDistance.prototype.detection =
  function (model, trajectory) {
    var trajectoryDistribution = tools.getNormalizedDistribution(trajectory.featureVector.spatialDistance, [trajectory]);
    var modelDistribution = model.spatialDistance.normalizedDistribution;
    var comparisonResult = tools.compareIntMaps(trajectoryDistribution, modelDistribution);

    return {
      isSpoof: comparisonResult.p < 1 || (comparisonResult.missPercentage >= 60),
      p: comparisonResult.p
    };
  }

module.exports = new SpatialDistance();