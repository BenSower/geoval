'use strict';

angular.module('geovalApp')
    .controller('FooterCtrl', function($scope, $location, Auth) {
    	//TODO: replace version with actual version from package.json
        $scope.geovalVersion = 'v ' + '1.0.0';
    });
