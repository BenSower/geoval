'use strict';
angular.module('geovalApp')
    .controller('AnalysisCtrl', function($scope, $http) {
        /*
			Create full table
    	*/
        $http.get('/api/trajectories').success(function(trajectories) {
            $scope.rawTrajectories = trajectories;
            $scope.scatterData = getScatterData(trajectories);
            $scope.donutData = getDonutData($scope.scatterData);
        });
        $scope.showTable = false;

        /*
			scatter plot
    	*/
        var getScatterData = function(rawTrajectories) {
            var aggregatedDistribution = {};
            for (var i = 0; i < rawTrajectories.length; i++) {
                var trajectory = rawTrajectories[i];
                for (var property in trajectory.properties.distribution) {
                    if (aggregatedDistribution[property] === undefined) {
                        aggregatedDistribution[property] = trajectory.properties.distribution[property];
                    } else {
                        aggregatedDistribution[property] += trajectory.properties.distribution[property];
                    }
                }
            }

            var data = [];
            for (var attribute in aggregatedDistribution) {
                data.push({
                    key: 'Group ' + attribute,
                    values: [{
                        x: attribute,
                        y: aggregatedDistribution[attribute],
                        size: aggregatedDistribution[attribute]
                    }]
                });
            }
            return data;
        };

        /*
        	donut graph
        */
        var getDonutData = function(scatterData) {
            var data = [];
            var others = {
                key: 'Others',
                y: 0
            };
            for (var attribute in scatterData) {
                var scatterDataSlice = scatterData[attribute];
                var value = scatterDataSlice.values[0].y;
                data.push({
                        key: scatterDataSlice.key,
                        y: value
                    });
            }
            data.push(others);

            return data;
        };
        $scope.xFunction = function() {
            return function(d) {
                console.log(d.key);
                return d.key;
            };
        };
        $scope.yFunction = function() {
            return function(d) {
                return d.y;
            };
        };

        $scope.descriptionFunction = function() {
            return function(d) {
                return d.key;
            };
        };
    });