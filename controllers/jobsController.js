app.controller('jobsController', function ($scope, $http, $location, Restangular, jobsResource, $window, $filter) {

    var jobs = Restangular.all('jobs');

    var localItemsPerPage = 15;
    var orderByStatus = 'id';
    var orderBy = $filter('orderBy');

    //init for Initialization
    init();

    function init() {

        $scope.currentPage = 1;
        $scope.itemsPerPage = 15;
        $scope.pageTo = $scope.itemsPerPage;

        // Enable visual display of sort column and order
        $scope.orderColumn = orderByStatus;
        $scope.orderDirection = 'asc';

        $scope.jobs = jobs.getList({limit: $scope.itemsPerPage}).$object;

        jobs.customGET('count').then(function (result) {

            $scope.totalItems = result.jobCount;
            $scope.setPage(1)

        });

        $scope.alerts =  [];
        $scope.isHidden = true;
    };

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
        $scope.jobs = jobs.getList({limit: $scope.itemsPerPage, offSet: offSet, orderBy: field, sort: $scope.orderDirection}).$object;
    }

    $scope.setPage = function (page) {

        var offSet = ((page - 1) * localItemsPerPage);

        //$scope.jobs = jobs.getList({limit: $scope.itemsPerPage, offSet: offSet}).$object;
        $scope.jobs = jobs.getList({limit: $scope.itemsPerPage, offSet: offSet, orderBy: $scope.orderColumn, sort: $scope.orderDirection}).$object;
        $scope.currentPage = page;
        $scope.pageTo = setPageToValue();
        $window.scrollTo(0,0);
    }

    $scope.order = function(predicate) {
        // When the user changes the sort column, don't also reverse the sort order
        var reverse = false;
        if (predicate === $scope.orderColumn) {
            reverse = ('asc' === $scope.orderDirection);
        }

        $scope.jobs = orderBy($scope.jobs, predicate, reverse);

        // Enable visual sort indicators to reflect the new sort column / direction
        $scope.orderColumn = predicate;
        $scope.orderDirection = (reverse ? 'desc' : 'asc');
    };

    $scope.addAlert = function(msg) {
        // $scope.alerts =  [];
        $scope.alerts.push({msg: msg});
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    // Deprecated
    $scope.editJob = function(id) {
        $scope.job = Restangular.one('jobs', id).get().$object;
    }
});


