// TODO: Conditional formatting for modules table on execution failure

app.controller('executionController', function ($scope, $location, Restangular, $routeParams, executionsResource, jobsResource, usSpinnerService) {

    var alerts = [];
    var job = jobsResource.getJob($routeParams.id);

    //init for Initialization
    init();

    function init() {
        console.log($routeParams.execId);
        $scope.alerts = alerts;
        $scope.job = job.$object;
        $scope.execId = $routeParams.execId;
        $scope.jobExecution = executionsResource.getJobExecution($routeParams.id, $routeParams.execId).$object;
        console.log($scope.executions);
        $scope.showLogDetail = false;
    }

    $scope.addAlert = function() {
        $scope.alerts.push({msg: "Another alert!"});
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.prettyPrint = function(obj) {
        $scope.jobExecution = JSON.stringify(obj, undefined, 2); // indentation level = 2
    };

    $scope.showLog = function(id) {
        startSpin('spinner-1');
        executionsResource.getExecutionLogResource(id).get().then(function($object) {
            $scope.showLogDetail = true;
            $scope.executionLog = $object;
            stopSpin('spinner-1');
        }, function(response) {
            $scope.alerts.push({type: 'danger', msg: 'Oh snap! [' + response.status + ']' + response.data});
            stopSpin('spinner-1');
        });

    };

    function startSpin(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    };

    function stopSpin(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    };

    $scope.executionRecordStyle = function(status) {
        if(status === 'FAILED') {
            return {color:'red'};
        } else {
            return {color:'black'};
        }
    };

});


