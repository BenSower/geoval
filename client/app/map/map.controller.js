'use strict';

angular.module('geovalApp')
    .controller('MapCtrl', function($scope, $http) {

        $http.get('/api/trajectories').success(function(trajectories) {

            trajectories = filterTrajectories(trajectories);

            $scope.trajectories = {
                source: {
                    type: 'GeoJSON',
                    geojson: {
                        object: {
                            'type': 'FeatureCollection',
                            'features': trajectories,
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
                autodiscover: false
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
                    //console.log('test');
                }
            }
        });
    });

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


//drops all trajectories with a outlier
function simpleOutlierRemoval(trajectory) {

    var threshold = 0.05; //threshold in km

    //calculate distances between every coordinate and the next one
    for (var i = 0; i < trajectory.geometry.coordinates.length - 1; i++) {
        var firstCoordinate = trajectory.geometry.coordinates[i];
        var secondCoordinate = trajectory.geometry.coordinates[i + 1];
        var distance = getDistanceFromLonLatInKm(firstCoordinate[0], firstCoordinate[1], secondCoordinate[0], secondCoordinate[1]);
        //drop trajectory if a single distance between two points is bigger than the threshold
        if (distance > threshold) {
            return null;
        }
    }

    return trajectory;
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

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
