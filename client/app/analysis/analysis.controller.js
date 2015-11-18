'use strict';
angular.module('geovalApp')
  .controller('AnalysisCtrl', function ($scope, $http) {
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
      $scope.isAnalysing = true;
      $http.get('/api/trajectories/analyse').success(function (results) {
        for (var i = 0; i < results.length; i++) {
          $scope.results[i] = [];
          var levelData = results[i];
          for (var j = 0; j < levelData.length; j++) {
            var algorithmName = Object.keys(levelData[j])[0];
            var result = levelData[j][algorithmName];
            $scope.results[i].push(result);
          }
        }
        $scope.isAnalysing = false;
      });
    };

    var apiUrl = '/api/trajectories';
    $scope.showTable = false;
    $scope.results = {};
    $scope.analyseText = 'Analyse Trajectories';
    $scope.isAnalysing = false;
    $http.get(apiUrl).success(redraw);

  });