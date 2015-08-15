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
            var aggregated_distribution = {};
            var random = d3.random.normal();
            for (var i = 0; i < rawTrajectories.length; i++) {
                var trajectory = rawTrajectories[i];
                for (var property in trajectory.properties.distribution) {
                    if (aggregated_distribution[property] === undefined) {
                        aggregated_distribution[property] = trajectory.properties.distribution[property];
                    } else {
                        aggregated_distribution[property] += trajectory.properties.distribution[property];
                    }
                }
            }

            var data = [];
            for (var property in aggregated_distribution) {
                data.push({
                    key: 'Group ' + property,
                    values: [{
                        x: property,
                        y: aggregated_distribution[property],
                        size: aggregated_distribution[property]
                    }]
                });
            }
            return data;
        }

        $scope.tooltipXContentFunction = function() {
            return function(key, x, y) {
                return '<strong>YO!' + x + '</strong>'
            }
        }

        /*
        	donut graph
        */
        var getDonutData = function(scatterData) {
            var data = [];
            var others = {
                key: 'Others',
                y: 0
            };
            for (var property in scatterData) {
                var scatterDataSlice = scatterData[property];
                var value = scatterDataSlice.values[0].y;
                data.push({
                        key: scatterDataSlice.key,
                        y: value
                    });
                /*
                if (value > 100) {
                    
                } else {
                    others.y += value;
                }
                */
            }
            data.push(others);

            return data;
        }
        $scope.xFunction = function() {
            return function(d) {
                console.log(d.key);
                return d.key;
            };
        }
        $scope.yFunction = function() {
            return function(d) {
                return d.y;
            };
        }

        $scope.descriptionFunction = function() {
            return function(d) {
                return d.key;
            }
        }
    });


/* 
data[0].values.push({
                        x: (trajectory.geometry.coordinates.length < 400) ? trajectory.geometry.coordinates.length : 0,
                        y: (trajectory.properties.outlierThreshold < 800) ? trajectory.properties.outlierThreshold : 0,
                        size: Math.random()
                    });
*/
