var tools = require('../AnalyticalTools');

function TimeGap() {}

TimeGap.prototype.extractFeatures = function (trajectory) {

  var timeGap = {
    absoluteDistribution: {},
    normalizedDistribution: {}
  };

  for (var j = 0; j < trajectory.geometry.coordinates.length - 1; j++) {
    var coordinateA = new Date(trajectory.properties.coordTimes[j]);
    var coordinateB = new Date(trajectory.properties.coordTimes[j + 1]);
    var diff = coordinateB.getTime() - coordinateA.getTime();
    //initialize or increment
    if (diff <= 5000)
      timeGap.absoluteDistribution[diff] = timeGap.absoluteDistribution[diff] + 1 || 1;
  }

  return timeGap;
}

TimeGap.prototype.training =
  function (model, trajectories) {
    model = setTimeDistribution(model, trajectories);
    return model;
  }

TimeGap.prototype.detection =
  function (model, trajectory) {
    var trajectoryDistribution = trajectory.featureVector.timeGap.absoluteDistribution;
    var modelDistribution = model.timeGap.normalizedDistribution;
    var comparisonResult = tools.compareIntMaps(trajectoryDistribution, modelDistribution);
    return {
      isSpoof: (comparisonResult.p < 0.01) || (comparisonResult.missPercentage > 0),
      p: comparisonResult.p
    };
  }

function setTimeDistribution(model, trajectories) {
  var absoluteDistribution = model.timeGap.absoluteDistribution;
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

module.exports = new TimeGap();