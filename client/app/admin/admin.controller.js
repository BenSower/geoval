'use strict';

angular.module('geovalApp')
    .config(function(laddaProvider) {
        laddaProvider.setOption({
            style: 'zoom-out'
        });
    })
    .controller('AdminCtrl', function($scope, $http, $timeout, Auth, User) {
        // Use the User $resource to fetch all users
        $scope.users = User.query();
        $scope.mediaq = 'Import MediaQ Trajectories';

        $scope.importMediaQ = function() {
            //$scope.loading = "true"; // start loading
            $scope.loading = true

            $.getJSON('/api/trajectories/importMediaQ', function(data) {
                $scope.mediaq = 'Imported ' + data.importedVideos + ' trajectories';
                //forces a redraw
                $timeout(function() {
                    $scope.loading = false;
                }, 0);
            });

        };

    });
