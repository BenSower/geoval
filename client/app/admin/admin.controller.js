'use strict';

angular.module('geovalApp')
    .controller('AdminCtrl', function($scope, $http, $timeout, Auth, User) {

            // set file-input options
            $('#input-1a').fileinput({
                'uploadUrl': '/api/trajectories/gpx',
                'uploadAsync': true,
                'allowedFileExtensions': ['gpx'],
                'browseClass': 'btn btn-md btn-default',
                'maxFileCount': 10,
            });

            // Use the User $resource to fetch all users
            $scope.users = User.query();
            $scope.mediaq = 'Import MediaQ Trajectories';
            $scope.clearDbLabel = 'Delete all Trajectories from Db';
            $scope.creatingFakes = 'Create spoof trajectories';
            $scope.lvl1spoofAmount = 1;
            $scope.lvl2spoofAmount = 1;

            $scope.importMediaQ = function() {
                $scope.isImportingMediaq = true;

                $.getJSON('/api/trajectories/importMediaQ', function(data) {
                    $scope.mediaq = 'Imported ' + data.importedVideos + ' trajectories';
                    //forces a redraw
                    $timeout(function() {
                        $scope.isImportingMediaq = false;
                    }, 0);
                });
            };


            $scope.clearDb = function() {
                $scope.isDroppingTrajectories = true;

                $.ajax({
                    url: '/api/trajectories/',
                    type: 'DELETE',
                    success: function() {
                        $scope.clearDbLabel = 'Deleted all trajectories';
                        //forces a redraw
                        $timeout(function() {
                            $scope.isDroppingTrajectories = false;
                        }, 0);
                    }
                });
            };

            $scope.createFakes = function(lvl){
                $scope.isCreatingFakes = true;

                var setLabels = function() {
                    $scope.creatingFakes = 'Created Fakes';
                    //forces a redraw
                    $timeout(function() {
                        $scope.isCreatingFakes = false;
                    }, 0);
                };

                $.post('/api/trajectories/createSpoofs', { amount : $scope['lvl' + lvl + 'spoofAmount'], lvl: lvl}, setLabels);
            }
    });
