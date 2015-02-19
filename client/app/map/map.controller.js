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
            functions:{
                onClick:function(){
                    console.log('test');
                }
            }
        });
    });
