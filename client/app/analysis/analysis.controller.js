'use strict';

angular.module('geovalApp')
    .controller('AnalysisCtrl', function($scope, $http) {

        if ($scope.rawTrajectories === undefined) {
            $http.get('/api/trajectories').success(function(trajectories) {
                $scope.rawTrajectories = trajectories;
                console.log(trajectories[0]);
            });
        } 
    });
