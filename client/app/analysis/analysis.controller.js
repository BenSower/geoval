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
        $scope.data = getLineData(result);
      });
    };

    function getTrajectoriesForLevel(lvl) {
      var trajectories = [];
      for (var i = 0; i < $scope.rawTrajectories.length; i++) {
        var trajectory = $scope.rawTrajectories[i];
        if (trajectory.properties.spoofLvL === lvl) {
          trajectories.push(trajectory);
        }
      }
      return trajectories;
    }

    function getLineDataValues(lvl) {
      var absoluteDistribution = {};
      var trajectories = getTrajectoriesForLevel(lvl);
      trajectories.map(function (trajectory) {
        for (var key in trajectory.featureVector.spatialDistance) {
          if (key !== 'biggestDistance')
            absoluteDistribution[key] = absoluteDistribution[key] + 1 || 1;
        }
      });
      var normalizedDistribution = getNormalizedDistribution(absoluteDistribution, trajectories);
      var values = mapToArray(normalizedDistribution);
      return values;
    }

    function getNormalizedDistribution(absoluteDistribution, trajectories) {
      var normalizedDistribution = JSON.parse(JSON.stringify(absoluteDistribution));
      if (trajectories.length > 1) {
        //normalizing/averaging every bucket value
        for (var bucket in normalizedDistribution) {
          if (normalizedDistribution.hasOwnProperty(bucket))
            normalizedDistribution[bucket] = normalizedDistribution[bucket] / trajectories.length;
        }
      }
      return normalizedDistribution;
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
      data.push({
        key: 'ModelAbsolute',
        values: mapToArray(result[0].model.buckets.normalizedDistribution)
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