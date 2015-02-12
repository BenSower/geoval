'use strict';

angular.module('geovalApp')
    .controller('MapCtrl', function($scope) {
        angular.extend($scope, {
            center: {
                lat: 0,
                lon: 0,
                autodiscover: true,  
                projection: 'EPSG:4326'
            },
            defaults: {
                interactions: {
                    mouseWheelZoom: true
                }
            }

        });
    });
 