'use strict';

angular.module('geovalApp')
    .controller('MapCtrl', function($scope, $http, olData) {

        //redraw after threshold slider was used
        $scope.onStopSlide = function() {
            drawTrajectories($scope.rawTrajectories);
        }


        $scope.sliderOptions = {
            min: 10,
            max: 1000,
            step: 10,
            orientation: 'horizontal', // vertical
            handle: 'round', //'square', 'triangle' or 'custom'
            tooltip: 'hide', //'hide','always'
            tooltipsplit: false,
            enabled: true,
            naturalarrowkeys: false,
            range: false,
            ngDisabled: false,
            reversed: false,
            thresholdValue: 30, //threshold to drop trajectories in km,
            loadedTrajectories: 0,
            renderedTrajectories: 0
        };

        //load and filter jsons
        $http.get('/api/trajectories').success(function(trajectories) {
            $scope.rawTrajectories = trajectories;
            var renderedTrajectories = drawTrajectories(trajectories);
            $scope.sliderOptions.loadedTrajectories = trajectories.length;
        });


        angular.extend($scope, {
            center: {
                'lat': 48.13650696913464,
                'lon': 11.606172461258842,
                'zoom': 12,
                autodiscover: false
            },
            layers: [{
                name: 'main',
                source: {
                    type: 'OSM'
                }
            }, {
                name: 'trajectories',
                source: {
                    type: 'GeoJSON',
                    geojson: {
                        object: {
                            'type': 'FeatureCollection',
                            'features': [],
                        },
                        projection: 'EPSG:3857'
                    }
                },
                style: {
                    stroke: {
                        color: '#FF0000',
                        width: 3
                    }
                }
            }],
            defaults: {
                events: {
                    layers: ['mousemove', 'click']
                },
                interactions: {
                    mouseWheelZoom: true
                }
            }
        });

        $scope.$on('openlayers.layers.trajectories.mousemove', function(event, feature) {
            $scope.$apply(function(scope) {
                //console.log(feature);
                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#FF0000',
                        width: 3
                    })
                });
                feature.setStyle(style);
                //if (feature && $scope.countries[feature.getId()]) {
                //    $scope.mouseMoveCountry = feature ? $scope.countries[feature.getId()].name : '';
                //}
            });
        });


        function drawTrajectories(trajectories) {
            var filteredTrajectories = filterTrajectories(trajectories)
            $scope.layers[1].source.geojson.object.features = filteredTrajectories;
            $scope.sliderOptions.renderedTrajectories = filteredTrajectories.length;
        }


        function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }

        function getDistanceFromLonLatInKm(lon1, lat1, lon2, lat2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2 - lat1); // deg2rad below
            var dLon = deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            return d;
        }

        //drops all trajectories with a outlier
        function simpleOutlierRemoval(trajectory) {

            var threshold = $scope.sliderOptions.thresholdValue / 1000; //translate m to km
            //calculate distances between every coordinate and the next one
            for (var i = 0; i < trajectory.geometry.coordinates.length - 1; i++) {
                var firstCoordinate = trajectory.geometry.coordinates[i];
                var secondCoordinate = trajectory.geometry.coordinates[i + 1];
                var distance = getDistanceFromLonLatInKm(firstCoordinate[0], firstCoordinate[1], secondCoordinate[0], secondCoordinate[1]);
                //drop trajectory if a single distance between two points is bigger than the threshold
                if (distance >= threshold) {
                    return null;
                }
            }

            return trajectory;
        }

        function filterTrajectories(trajectories) {
            var filteredTrajectories = [];
            for (var i = 0; i < trajectories.length; i++) {
                var filteredTrajectory = simpleOutlierRemoval(trajectories[i]);
                if (filteredTrajectory !== null) {
                    filteredTrajectories.push(filteredTrajectory);
                }
            }
            return filteredTrajectories;
        }
    });
