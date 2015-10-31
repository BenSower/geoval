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
      var diff = (valA > valB) ? valB / valA : valA / valB;
      //perceńtage of how close the values are to each other in this bucket
      diffs.push(diff * 100);
    } else {
      diffs.push(0);
      misses++;
    }
  }

  var sum = diffs.reduce(function (a, b) {
    return a + b;
  }, 0);

  var possibleKeys = Object.keys(vectorA).length;
  var p = (sum / possibleKeys);

  return {
    p: p,
    misses: misses,
    missPercentage: ((misses / diffs.length) * 100).toFixed(2)
  };
}

AnalyticalTools.prototype.compareProbabilityMaps = function (vectorA, vectorB) {

  var misses = 0;
  var diffs = []

  for (var rowNumber in vectorA) {
    var vectorARow = vectorA[rowNumber];
    for (var columnNumber in vectorARow) {
      var diff;
      if (vectorB[rowNumber] !== undefined && vectorB[rowNumber][columnNumber] !== undefined) {
        var valA = vectorA[rowNumber][columnNumber];
        var valB = vectorB[rowNumber][columnNumber];
        var diff = (valA > valB) ? valB / valA : valA / valB;
        //perceńtage of how close the values are to each other in this bucket
        diffs.push(diff * 100);
      } else {
        diffs.push(0);
        misses++;
      }
    }

  }

  var sum = diffs.reduce(function (a, b) {
    return a + b;
  }, 0);

  var possibleKeys = Object.keys(vectorA).length;
  var p = (sum / possibleKeys);

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
  if (trajectories.length > 1) {
    //normalizing/averaging every bucket value
    for (var bucket in normalizedDistribution) {
      if (normalizedDistribution.hasOwnProperty(bucket)) {
        normalizedDistribution[bucket] = (normalizedDistribution[bucket] / nodePoints);
      }
    }
  }
  return normalizedDistribution;
}

module.exports = new AnalyticalTools();