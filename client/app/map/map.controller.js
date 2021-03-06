'use strict';

angular.module('geovalApp')
  .controller('MapCtrl', function ($scope, $http) {

    var markers = [];
    //styles for mouseover highlighting
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
      projection: 'EPSG:4326'

    });

    var highlight;

    //redraw after threshold slider was used
    $scope.onStopSlide = function () {
      drawTrajectories($scope.rawTrajectories);
    };

    $scope.sliderOptions = {
      min: 1,
      max: 200,
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
      lengthMax: 500,
      trajectoryLengthConstraint: 50, //threshold to drop trajectories with fewer than x coordinates
      thresholdValue: 10, //threshold to drop trajectories in km,
    };

    //load and filter jsons
    $http.get('/api/trajectories').success(function (trajectories) {
      $scope.rawTrajectories = trajectories;
      $scope.renderedTrajectories = drawTrajectories(trajectories);
      $scope.sliderOptions.loadedTrajectories = trajectories.length;
    });

    //highlight trajectories on mouseover
    $scope.$on('openlayers.layers.trajectories.mousemove', function (event, feature) {
      $scope.$apply(function () {
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

    $scope.toggleMarkers = function () {
      $scope.markers = ($scope.markers.length > 0) ? [] : markers;
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
          var labelMessage = '<h5>' + traj.id + '</h5>' + 'Coordinates: ' + traj.geometry.coordinates.length +
            '<br/> Outlier Threshold: ' + traj.featureVector.spatialMean.biggestDistance + 'm' + '<br/> Device: ' +
            os;
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
      //actually function(event, properties)
      return function () {
        var renderedTrajectories = $scope.layers[1].source.geojson.object.features;
        var index = renderedTrajectories.indexOf(trajectory);
        if (index === -1) {
          $scope.layers[1].source.geojson.object.features.push(trajectory);
        } else {
          $scope.layers[1].source.geojson.object.features.splice(index, 1);
        }
      };
    }

    function endsWith(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    //drops all trajectories with a outlier
    function simpleOutlierRemoval(trajectory) {
      var threshold = $scope.sliderOptions.thresholdValue;
      if (trajectory.featureVector.spatialMean.biggestDistance > threshold ||  trajectory.geometry.coordinates.length <
        $scope.sliderOptions
        .trajectoryLengthConstraint) {
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