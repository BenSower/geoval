'use strict';

angular.module('geovalApp')
    .controller('MapCtrl', function($scope, $http) {

        var markers = [];
        var normalStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FF0000',
                width: 2
            })
        });

        var highlightStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#123456',
                width: 2
            })
        });

        function getRandomStyle() {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: getRandomColor(),
                    width: 3
                })
            });
        }

        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        angular.extend($scope, {
            markers: [],
            center: {
                lat: 48.13650696913464,
                lon: 11.606172461258842,
                zoom: 12,
                autodiscover: false,
                bounds: []
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
                style: normalStyle
            }],
            defaults: {
                events: {
                    layers: ['mousemove'],
                    map: ['singleclick']
                },
                interactions: {
                    mouseWheelZoom: true
                }
            },
            customTrajectory: [],
            projection: 'EPSG:4326'

        });



        var highlight;

        //redraw after threshold slider was used
        $scope.onStopSlide = function() {
            drawTrajectories($scope.rawTrajectories);
        };

        $scope.sliderOptions = {
            min: 10,
            max: 8000,
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
            loadedTrajectories: 0,
            renderedTrajectories: 0,
            trajectoryLengthConstraint: 50, //threshold to drop trajectories with fewer than x coordinates
            thresholdValue: 10, //threshold to drop trajectories in km,
        };

        //load and filter jsons
        $http.get('/api/trajectories').success(function(trajectories) {
            $scope.rawTrajectories = trajectories;
            $scope.renderedTrajectories = drawTrajectories(trajectories);
            $scope.sliderOptions.loadedTrajectories = trajectories.length;
        });


        $scope.$on('openlayers.layers.trajectories.mousemove', function(event, feature) {
            $scope.$apply(function() {
                if (feature !== highlight) {
                    if (highlight) {
                        highlight.setStyle(normalStyle);
                    }
                    //hack to ensure that only trajectories are shown.
                    if (feature && feature.getId() !== undefined) {
                        feature.setStyle(highlightStyle);
                        highlight = feature;
                    }
                }
            });
        });

        $scope.$on('openlayers.map.singleclick', function(event, data) {
            $scope.$apply(function() {
                if ($scope.projection === data.projection) {
                    $scope.customTrajectory = data.coord;
                } else {
                    var p = ol.proj.transform([data.coord[0], data.coord[1]], data.projection, $scope.projection);
                    $scope.customTrajectory.push({
                        lat: p[1],
                        lon: p[0]
                    });
                }
            });
        });


        $scope.toggleMarkers = function() {
            $scope.markers = ($scope.markers.length > 0) ? [] : markers;
        };

        $scope.clearTrajectory = function() {
            $scope.customTrajectory = [];
        };


        function drawTrajectories(trajectories) {
            var filteredTrajectories = filterTrajectories(trajectories);
            //$scope.layers[1].source.geojson.object.features = filteredTrajectories;
            $scope.sliderOptions.renderedTrajectories = filteredTrajectories.length;
            updateMarkers(filteredTrajectories);
            return filteredTrajectories;
        }

        function updateMarkers(trajectories) {
            //reset markers
            markers = [];
            $scope.markers = [];
            for (var i = 0; i < trajectories.length; i++) {
                var traj = trajectories[i];
                var os = (endsWith(traj.id, '.mov')) ? 'iOs' : 'Android';

                if (traj.geometry.coordinates[0]) {
                    var labelMessage = '<h5>' + traj.id + '</h5>' + 'Coordinates: ' + traj.geometry.coordinates.length + '<br/> Outlier Threshold: ' + traj.properties.outlierThreshold + 'm' + '<br/> Device: ' + os;
                    var marker = {
                        name: traj.id,
                        lat: traj.geometry.coordinates[0][1],
                        lon: traj.geometry.coordinates[0][0],
                        label: {
                            message: labelMessage,
                            show: false,
                            showOnMouseOver: true
                        },
                        onClick: toggleTrajectory(traj)
                    };
                    markers.push(marker);
                } else {
                    console.log('this trajectory has no correct coordinates:', traj);
                }
            }
            $scope.toggleMarkers();
        }

        function toggleTrajectory(trajectory) {
            return function(event, properties) {
                var renderedTrajectories = $scope.layers[1].source.geojson.object.features;
                var index = renderedTrajectories.indexOf(trajectory);
                if (index === -1) {
                    $scope.layers[1].source.geojson.object.features.push(trajectory);
                } else {
                    $scope.layers[1].source.geojson.object.features.splice(index, 1);
                }
            }
        }

        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }

        //drops all trajectories with a outlier
        function simpleOutlierRemoval(trajectory) {
            var threshold = $scope.sliderOptions.thresholdValue;
            if (trajectory.properties.outlierThreshold > threshold ||  trajectory.geometry.coordinates.length < $scope.sliderOptions.trajectoryLengthConstraint) {
                return null;
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
