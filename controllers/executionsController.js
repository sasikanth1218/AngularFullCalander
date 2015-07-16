app.controller('executionsController', function ($scope, Restangular, executionsResource, $filter, $window, usSpinnerService) {

    var alerts = [];
    var orderBy = $filter('orderBy');
    var localItemsPerPage = 15;

    var executions = Restangular.all('jobs/executions');

    //init for Initialization
    init();

    function init() {

        $scope.currentPage = 1;
        $scope.itemsPerPage = 15;
        $scope.pageTo = $scope.itemsPerPage;

        // Enable visual display of sort column and order
        $scope.orderColumn = 'id';
        $scope.orderDirection = 'asc';

        $scope.alerts = alerts;

        executions.customGET('count').then(function (result) {

            $scope.totalItems = result.jobExecutionCount;
            $scope.setPage(1)
        });


        executions.getList({limit: localItemsPerPage}).then(function($object) {

            $scope.executions = $object;
            for(var i = 0; i < $scope.executions.length; i++){
                var startDate = new Date();
                startDate.setUTCDate($scope.executions[i].startDate);
                $scope.executions[i].startDate = startDate.toLocaleDateString();
                var endDate = new Date();
                endDate.setUTCDate($scope.executions[i].endDate);
                $scope.executions[i].endDate = endDate.toLocaleDateString();
            };

        },
        function(response) {
            //  stopSpin('spinner-1');
            $scope.alerts.push({type: 'danger', msg: '[' + response.status + '] ' + response.data});
            console.log(response);
        });
    }

    function setPageToValue() {

        var pageValueTo = $scope.itemsPerPage * $scope.currentPage;

        if(pageValueTo <  $scope.totalItems) {
            return pageValueTo;
        } else {
            return $scope.totalItems;
        }
    }

    $scope.orderBy = function(field) {

        var offSet = (($scope.currentPage - 1) * localItemsPerPage);

        // check to see if the same column has been selected and change the order direction
        if($scope.orderColumn === field) {
            if($scope.orderDirection === 'asc') {
                $scope.orderDirection = 'desc'
            } else {
                $scope.orderDirection = 'asc'
            }
        }

        $scope.orderColumn = field;
        $scope.executions = executions.getList({limit: $scope.itemsPerPage, offSet: offSet, orderBy: field, sort: $scope.orderDirection}).$object;
    }

    $scope.setPage = function (page) {

        var offSet = ((page - 1) * localItemsPerPage);

        //$scope.executions = executions.getList({limit: $scope.itemsPerPage, offSet: offSet}).$object;
        $scope.executions = executions.getList({limit: $scope.itemsPerPage, offSet: offSet, orderBy: $scope.orderColumn, sort: $scope.orderDirection}).$object;
        $scope.currentPage = page;
        $scope.pageTo = setPageToValue();
        $window.scrollTo(0,0);
    }

    $scope.addAlert = function() {
        $scope.alerts.push({msg: "Another alert!"});
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

    $scope.spin = function() {
        console.log('spin');
        startSpin('spinner-1');
    };

    $scope.executionRecordStyle = function(status) {
        if(status === 'FAILED') {
            return {color:'red'};
        } else {
            return {color:'black'};
        }
    };

    $scope.order = function(predicate) {
        // When the user changes the sort column, don't also reverse the sort order
        var reverse = false;
        if (predicate === $scope.orderColumn) {
            reverse = ('asc' === $scope.orderDirection);
        }

        $scope.executions = orderBy($scope.executions, predicate, reverse);

        // Enable visual sort indicators to reflect the new sort column / direction
        $scope.orderColumn = predicate;
        $scope.orderDirection = (reverse ? 'desc' : 'asc');
    };
});
