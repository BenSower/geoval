'use strict';
angular.module('geovalApp')
  .controller('AnalysisCtrl', function ($scope, $http) {

    var apiUrl = '/api/trajectories';

    $scope.showTable = false;

    $http.get(apiUrl).success(redraw);

    function redraw(trajectories) {
      $scope.rawTrajectories = trajectories;
    }

    $scope.delete = function (trajectory) {
      $.ajax({
        url: '/api/trajectories/' + trajectory._id,
        type: 'DELETE',
        success: function () {
          $http.get(apiUrl).success(redraw);
        }
      });
    };

    $scope.analyse = function () {
      $http.get('/api/trajectories/analyse').success(function (result) {
        console.log(result);
        $scope.data = getLineData(result);
      });
    };

    function getLineDataValues(lvl) {
      var lvl1Dist = {};
      for (var i = 0; i < $scope.rawTrajectories.length; i++) {
        var trajectory = $scope.rawTrajectories[i];
        if (trajectory.properties.spoofLvL === lvl) {
          for (var key in trajectory.featureVector.spatialDistance) {
            if (key !== 'biggestDistance')
              lvl1Dist[key] = lvl1Dist[key] + 1 || 1;
          }
        }
      }

      var values = mapToArray(lvl1Dist);
      return values;
    }

    function mapToArray(map) {
      var values = [];
      for (var key in map) {
        if (map.hasOwnProperty(key))
          values.push([parseInt(key), map[key]]);
      }
      return values;
    }

    function getLineData(result) {
      var data = [];
      var values = mapToArray(result[0].model.buckets.absoluteDistribution);
      data.push({
        key: 'ModelAbsolute',
        values: values
      });

      data.push({
        key: 'Lvl1',
        values: getLineDataValues(1)
      });

      data.push({
        key: 'Lvl2',
        values: getLineDataValues(2)
      });

      return data;
    }
  });