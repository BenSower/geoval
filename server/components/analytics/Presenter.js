var plotly = require('plotly')('BenSower', 'w7as40pc4l');
var Table = require('cli-table');

function Presenter() {}

Presenter.prototype.createPlotlyGraph = function (analyRes, type) {
  createPlotlyGraph(
    [
      analyRes.spoofProbabilities[type],
      analyRes.trajectoryProbabilities[type]
    ], type);
}

function createPlotlyGraph(rawInput, type) {

  function mapToArray(map) {
    var x = Object.keys(map).sort();
    var y = [];
    for (var i = 0; i < x.length; i++) {
      var key = x[i];
      y.push(map[key]);
    }
    return {
      x: x,
      y: y
    };
  }

  var data = [];
  for (var i = 0; i < rawInput.length; i++) {
    var input = rawInput[i];
    for (var o in input) {
      var lvl = input[o];
      var aggregated = {};
      for (var j = 0; j < lvl.length; j++) {
        var val = lvl[j].toFixed(2);
        aggregated[val] = aggregated[val] + 1 || 1;
      }
      var map = mapToArray(aggregated);
      //x is filled with values from 0 to input.length
      var trace = {
        x: map.x,
        y: map.y,
        mode: 'lines',
        name: 'lvl' + o,
        line: {
          dash: 'solid',
          width: 4
        }
      };
      data.push(trace);
    }
  }

  var layout = {
    fileopt: 'overwrite',
    filename: type
  };

  plotly.plot(data, layout, function (err, msg) {
    if (err) return console.log(err);
    console.log(msg);
  });
}

Presenter.prototype.presentResults = function (results, rawSpoofs, rawTrajectories, spoofLvL) {

  var columns = ['SpoofLvl' + spoofLvL,
    'Correct spoofs',
    'Wrong spoofs',
    'Correct trajs',
    'Wrong trajs',
    'Spoof rate',
    'Traj rate'
  ];
  var table = new Table({
    head: columns
  });

  for (var algorithm in results) {
    if (!results.hasOwnProperty(algorithm)) {
      continue;
    }

    var result = results[algorithm];
    var spoofCount = result.spoofs.length;
    var realTrajCount = result.realTrajectories.length;
    var falseSpoofCount = result.falseSpoofs.length;
    var falseTrajCount = result.falseTrajectories.length;
    var spoofDetectionRate = (spoofCount / rawSpoofs.length) * 100;
    var trajDetectionRate = (realTrajCount / rawTrajectories.length) * 100;

    var row = {};
    row[algorithm] = [spoofCount, falseTrajCount, realTrajCount, falseSpoofCount, spoofDetectionRate.toFixed(2) +
      '%',
      trajDetectionRate.toFixed(2) + '%'
    ];
    table.push(row);
  }
  console.log(table.toString());
}
module.exports = new Presenter();