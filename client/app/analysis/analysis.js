'use strict';

angular.module('geovalApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('analysis', {
        url: '/analysis',
        templateUrl: 'app/analysis/analysis.html',
        controller: 'AnalysisCtrl'
      });
  });