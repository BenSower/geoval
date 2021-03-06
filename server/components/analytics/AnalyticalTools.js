function AnalyticalTools() {}

AnalyticalTools.prototype.compareIntMaps = function (vectorA, vectorB) {

  var misses = 0;
  var diffs = []

  for (var key in vectorA) {
    if (!vectorA.hasOwnProperty(key)) {
      continue;
    }
    var diff;
    if (vectorB[key] !== undefined) {
      var valA = vectorA[key];
      var valB = vectorB[key];
      diff = 0;

      /*  if (valA === 0 || valB === 0) {
          diff = 0
        } else {*/
      diff = (valA > valB) ? valB / valA : valA / valB;
      //  }
      //percentage of how close the values are to each other in this bucket
      var div = div * 100;
      //var diff = Math.max(0, (valB - Math.abs(valB - valA)) / valB) * 100;
      diffs.push(diff);
    } else {
      diffs.push(0);
      misses++;
    }
  }

  var sum = diffs.reduce(function (a, b) {
    return a + b;
  }, 0);

  var p = (sum / diffs.length);

  return {
    p: p,
    misses: misses,
    missPercentage: ((misses / diffs.length) * 100).toFixed(2)
  };
}

AnalyticalTools.prototype.getNormalizedDistribution = function (absoluteDistribution, trajectories) {
  var normalizedDistribution = JSON.parse(JSON.stringify(absoluteDistribution));
  var nodePoints = trajectories.reduce(function (accum, trajB) {
    return accum + trajB.geometry.coordinates.length;
  }, 0);
  //normalizing/averaging every bucket value
  for (var bucket in absoluteDistribution) {
    normalizedDistribution[bucket] = (normalizedDistribution[bucket] / nodePoints);
  }
  return normalizedDistribution;
}

module.exports = new AnalyticalTools();