'use strict';

angular.module('geovalApp')
    .controller('MapCtrl', function($scope, $http) {

        $http.get('/api/trajectories').success(function(data) {
            //console.log(data.splice(0, 1));
            //console.log(data);

            $scope.trajectories = {
                source: {
                    type: 'GeoJSON',
                    geojson: {
                        object: {
                            'type': 'FeatureCollection',
                            'features': data,
                        },
                        projection: 'EPSG:3857'
                    },
                },
                style: {
                    stroke: {
                        color: 'red',
                        width: 3
                    }
                },

            };
        });

        angular.extend($scope, {
            trajectories: {},
            center: {
                    'lat': 48.13650696913464,
                    'lon': 11.606172461258842,
                    'zoom': 12,
                    'projection': 'EPSG:4326',
                    autodiscover : false
                },
            defaults: {
                layers: {
                    main: {
                        source: {
                            type: 'OSM',
                            url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                        }
                    }
                },
                interactions: {
                    mouseWheelZoom: true
                },
                controls: {
                    zoom: false,
                    rotate: false,
                    attribution: false
                }
            },
            functions: {
                onClick: function() {
                    console.log('test');
                }
            }
        });
    });
