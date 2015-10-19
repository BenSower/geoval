'use strict';
angular.module('geovalApp')
    .controller('AnalysisCtrl', function($scope, $http) {

        var apiUrl = '/api/trajectories';

        $scope.showTable = false;

        $http.get(apiUrl).success(redraw);

        function redraw(trajectories) {
            $scope.rawTrajectories = trajectories;
        }

        $scope.delete = function(trajectory) {
            $.ajax({
                url: '/api/trajectories/' + trajectory._id,
                type: 'DELETE',
                success: function() {
                    $http.get(apiUrl).success(redraw);
                }
            });
        };

        $scope.analyse = function() {
            $http.get('/api/trajectories/analyse').success(function(result) {
                $scope.data = getLineData(result);
            });
        };

        function getLineData(result) {
            console.log(result);
            var data = [];
            for (var i = 0; i < result.length; i++) {
                var normDist = result[i].model.buckets.normalizedDistribution;
                var dataObj = {
                    key: 'Test'+i,
                    values: []
                };
                for (var key in normDist) {
                    if (normDist.hasOwnProperty(key)) {

                        dataObj.values.push([parseInt(key), normDist[key]]);
                    }
                }
                data.push(dataObj);
            }
            console.log(data);
            return data;
        }
    });
