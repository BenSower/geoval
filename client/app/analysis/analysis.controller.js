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
      });
    };

  });