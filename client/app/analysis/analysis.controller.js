'use strict';
angular.module('geovalApp')
    .controller('AnalysisCtrl', function ($scope, $http) {
        $http.get('/api/trajectories').success(function(trajectories) {
            $scope.rawTrajectories = trajectories;
            console.log(trajectories[0]);
        });
      $scope.showTable = false;

    });
