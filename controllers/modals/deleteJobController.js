var deleteJobController = function ($scope, $modal, $log) {

    $scope.open = function (job) {

        $scope.job = job;

        var modalInstance = $modal.open({
            templateUrl: 'app/partials/modals/deleteJob.html',
            controller: deleteJobControllerInstance,
            windowClass: 'modal-delete',
            resolve: {
                items: function () {
                    return $scope.items;
                },
                job: function () {
                    return $scope.job;
                }
            }
        });
    };
};

var deleteJobControllerInstance = function ($scope, $modalInstance, job, Restangular, $route, $location, usSpinnerService) {

    init();

    function init() {
        $scope.alerts =  [];
        $scope.job = job;
        $scope.deleted = false;
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
        $location.path('jobs');
        $route.reload();
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    function startSpin(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    }
    function stopSpin(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    }

    $scope.deleteJob = function(id) {
        $scope.alerts = [];
        startSpin('spinner-delete');
        Restangular.one('jobs', id).remove().then(function() {
            $scope.alerts.push({type: 'success', msg: 'Deleted Job - ' + id });
            $scope.deleted = true;
            stopSpin('spinner-delete');
        }, function(response) {
            $scope.alerts.push({type: 'danger', msg: 'Oh snap! [' + response.status + ']' + response.data});
            stopSpin('spinner-delete');
        });


    }


};