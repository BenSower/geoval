var Table = require('cli-table');

function Presenter() {}

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
  return table;
}
module.exports = new Presenter();