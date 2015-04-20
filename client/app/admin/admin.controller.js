'use strict';

angular.module('geovalApp')
    /*    .config(function(laddaProvider) {
            laddaProvider.setOption({
                style: 'zoom-out'
            });
        })
              input(type='file',class="btn btn-md btn-default", name='upload', multiple='multiple')
      | 
      input(type='submit',class="btn btn-md btn-default", value='Upload')
    */
    .controller('AdminCtrl', function($scope, $http, $timeout, Auth, User) {
        $("#input-1a").fileinput({
            'allowedFileExtensions': ['gpx'],
            'browseClass' : "btn btn-md btn-default",
        });
        // Use the User $resource to fetch all users
        $scope.users = User.query();
        $scope.mediaq = 'Import MediaQ Trajectories';

        $scope.importMediaQ = function() {
            //$scope.loading = "true"; // start loading
            $scope.loading = true;

            $.getJSON('/api/trajectories/importMediaQ', function(data) {
                $scope.mediaq = 'Imported ' + data.importedVideos + ' trajectories';
                //forces a redraw
                $timeout(function() {
                    $scope.loading = false;
                }, 0);
            });
        };


        var id;
        $scope.recordTrajectory = function() {
            var options;

            $scope.locations = '';

            function success(pos) {
                var crd = pos.coords;
                var crdString = crd.latitude + ' ' + crd.longitude;

                $scope.locations = $scope.locations + '\n' + crdString;
            }


            function error(err) {
                console.warn('ERROR(' + err.code + '): ' + err.message);
            }

            options = {
                enableHighAccuracy: true,
                timeout: 100000,
                maximumAge: 0
            };

            id = navigator.geolocation.watchPosition(success, error, options);
        };

        $scope.stopRecord = function() {
            navigator.geolocation.clearWatch(id);
        };
    });
