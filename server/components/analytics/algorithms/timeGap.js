var tools = require('../AnalyticalTools');

function TimeGap() {}

TimeGap.prototype.extractFeatures =
  function (trajectory) {

    var timeGap = {
      absoluteDistribution: {},
      normalizedDistribution: {}
    };

    for (var j = 0; j < trajectory.geometry.coordinates.length - 1; j++) {
      var coordinateA = new Date(trajectory.properties.coordTimes[j]);
      var coordinateB = new Date(trajectory.properties.coordTimes[j + 1]);
      var diff = coordinateB.getTime() - coordinateA.getTime();
      //initialize or increment
      timeGap.absoluteDistribution[diff] = timeGap.absoluteDistribution[diff] + 1 || 1;
    }
    timeGap.normalizedDistribution = tools.getNormalizedDistribution(timeGap.absoluteDistribution, [trajectory]);
    return timeGap;
  }

TimeGap.prototype.training =
  function (model, trajectories) {
    model.timeGap = model.timeGap || {};
    var absoluteDistribution = model.timeGap.absoluteDistribution || {};

    for (var i = 0; i < trajectories.length; i++) {
      var trajectory = trajectories[i];
      for (var key in trajectory.featureVector.timeGap.absoluteDistribution) {
        if (trajectory.featureVector.timeGap.absoluteDistribution.hasOwnProperty(key)) {
          absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
        }
      }
    }
    model.timeGap.absoluteDistribution = absoluteDistribution;
    model.timeGap.normalizedDistribution = tools.getNormalizedDistribution(absoluteDistribution, trajectories);
    return model;
  }

TimeGap.prototype.detection =
  function (model, trajectory) {
    var trajectoryDistribution = trajectory.featureVector.timeGap.normalizedDistribution;
    var modelDistribution = model.timeGap.normalizedDistribution;
    var comparisonResult = tools.compareIntMaps(trajectoryDistribution, modelDistribution);
    return {
      isSpoof: (comparisonResult.p < 0.01),
      p: comparisonResult.p
    };
  }

module.exports = new TimeGap();