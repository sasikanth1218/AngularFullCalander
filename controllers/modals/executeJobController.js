var executeJobController = function ($scope, $modal) {

    $scope.open = function (job) {

        $scope.job = job;

        var modalInstance = $modal.open({
            templateUrl: 'app/partials/modals/executeJob.html',
            controller: executeJobControllerInstance,
            windowClass: 'modal-run',
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

var executeJobControllerInstance = function ($scope, $modalInstance, job, Restangular, $route, $location, jobsResource, usSpinnerService) {

    init();

    function init() {
        $scope.alerts =  [];
        $scope.job = job;
        $scope.execute = false;
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
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

    $scope.executeJob = function(id) {
        $scope.alerts = [];
        startSpin('spinner-execute');
        jobsResource.executeJob(id).then(function() {
            stopSpin('spinner-execute');
            $scope.alerts.push({type: 'info', msg: 'Submitted Job : ' + id + ' for execution'});
            $scope.execute = true;
        }, function(response) {
            stopSpin('spinner-execute');
            console.log(response);
            $scope.alerts.push({type: 'danger', msg: 'Oh snap! [' + response.status + ']' + response.data});
        });
    }
};