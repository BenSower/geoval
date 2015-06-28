'use strict';
angular.module('geovalApp')
    .controller('AnalysisCtrl', function($scope, $http) {
        /*
			Create full table
    	*/
        $http.get('/api/trajectories').success(function(trajectories) {
            $scope.rawTrajectories = trajectories;
            $scope.scatterData = getData(trajectories);

        });
        $scope.showTable = false;

        /*
			Create graph
    	*/

        var getData = function(rawTrajectories) {
            var data = [{
                key: 'Group 1',
                values: []
            }];
            var random = d3.random.normal();
            for (var i = 0; i < rawTrajectories.length; i++) {
            	var trajectory = rawTrajectories[i];
                data[0].values.push({
                    x: (trajectory.geometry.coordinates.length < 400) ? trajectory.geometry.coordinates.length : 0,
                    y: (trajectory.properties.outlierThreshold < 800) ? trajectory.properties.outlierThreshold : 0,
                    size: Math.random()
                });
            }
            return data;
        }

        $scope.tooltipXContentFunction = function() {
            return function(key, x, y) {
                return '<strong>YO!' + x + '</strong>'
            }
        }
    });
