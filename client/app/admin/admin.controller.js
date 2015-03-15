'use strict';

angular.module('geovalApp')
    .controller('AdminCtrl', function($scope, $http, Auth, User) {

        // Use the User $resource to fetch all users
        $scope.users = User.query();
        $scope.mediaq = 'Import MediaQ Trajectories';

        $scope.delete = function(user) {
            User.remove({
                id: user._id
            });
            angular.forEach($scope.users, function(u, i) {
                if (u === user) {
                    $scope.users.splice(i, 1);
                }
            });
        };

        $scope.importMediaQ = function() {
            $scope.loading = true; // start loading
            $.get('/api/trajectories/importMediaQ', function(data) {
                $scope.loading = false;
                $scope.mediaq = 'Imported ' + data.importedVideos + ' trajectories';
            });
        };

    });
