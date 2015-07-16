/*globals app */
app.controller("jobController", function (
    $scope
    , $location
    , Restangular
    , $routeParams
    , executionsResource
    , jobsResource
    , usSpinnerService
    , $filter
    , scheduleService
    , schedulesResource
) {
    "use strict";
    var orderBy = $filter("orderBy");

    function startSpin(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    }

    function stopSpin(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    }

    // Conditional formatting for modules table on execution failure
    function executionRecordStyle(status) {
        return {color: "FAILED" === status ? "red" : "black"};
    }

    function showSchedule() {
        return (
            ($scope.job.type === "RECURRING")
            || ($scope.job.type === "CUSTOM")
            || ($scope.job.type === "IS")
        );
    }

    function validateJobName(data) {
        // validations
        if (data.length < 5) {
            return "Name must be at least 5 characters!";
        }

        if (data.length > 100) {
            return "Name cannot be greater than 100 characters!";
        }
    }

    function validateJobDescription(data) {
        // validations
        if (data.length > 255) {
            return "Description cannot be greater than 255 characters!";
        }
    }

    function updateJob() {
        startSpin("spinner-1");
        jobsResource.getJobResource($routeParams.id).customPUT($scope.job).then(
            function() {
                stopSpin("spinner-1");
            }, function(response) {
                stopSpin("spinner-1");
                $scope.alerts = [{type: "danger", msg: "[" + response.status + "] " + response.data}];
            }
        );
    }

    function validateScheduleName(data) {
        // validations
        if (data === null) {
            return "Required!";
        }

        if (data.length > 255) {
            return "Max length is 255";
        }
    }

    function validateScheduleDescription(data) {
        // validations
        if (data.length > 255) {
            return "Max length is 255";
        }
    }

    function validateCron(data) {
        return schedulesResource.validateCron(data);
    }

    function updateSchedule(schedule) {
        startSpin("spinner-1");
        jobsResource.getJobScheduleResource($routeParams.id, schedule.id)
            .customPUT(schedule).then(
                function() {
                    stopSpin("spinner-1");
                }, function(response) {
                    stopSpin("spinner-1");
                    $scope.alerts = [{type: "danger", msg: "[" + response.status + "] " + response.data}];
                }
            );
    }

    //function order(predicate) {
    //    // When the user changes the sort column, don't also reverse the sort
    //    // order.
    //    var reverse = false;
    //    if (predicate === $scope.orderColumn) {
    //        reverse = ("asc" === $scope.orderDirection);
    //    }
    //
    //    $scope.executions = orderBy($scope.executions, predicate, reverse);
    //
    //    // Enable visual sort indicators to reflect the new sort column /
    //    // direction.
    //    $scope.orderColumn = predicate;
    //    $scope.orderDirection = (reverse ? "desc" : "asc");
    //}

    $scope.orderBy = function(field) {

        $scope.pagination
        var offSet = (($scope.pagination.currentPage - 1) * $scope.pagination.itemsPerPage);

        // check to see if the same column has been selected and change the order direction
        if($scope.orderColumn === field) {
            if($scope.orderDirection === 'asc') {
                $scope.orderDirection = 'desc'
            } else {
                $scope.orderDirection = 'asc'
            }
        }

        $scope.orderColumn = field;
        $scope.executions = executionsResource.getPagedJobExecutions($routeParams.id, $scope.pagination.itemsPerPage, offSet, field, $scope.orderDirection).$object;
    }

    function setPage(pageNumber) {
        var pageConfig = $scope.pagination
            , limitTo = pageConfig.itemsPerPage
            , recOffset = (pageNumber - 1) * limitTo
            , getPromise = executionsResource.getPagedJobExecutions($routeParams.id, limitTo, recOffset,
                $scope.orderColumn, $scope.orderDirection)
        ;

        // Update the pagination properties when a result is known
        getPromise.then(
            function(resultSet) {
                pageConfig.showingFirstIndex = recOffset + 1;
                pageConfig.showingLastIndex = recOffset + resultSet.length;
            }
        );

        // Bind the view data to the result
        $scope.executions = getPromise.$object;
    }

    // Initialize the view's scope
    (function init() {
        var jobID = $routeParams.id
            , job = Restangular.one("jobs", jobID)
        ;

        $scope.job = job.get().$object;
        $scope.modules = job.getList("modules").$object;
        $scope.schedules = jobsResource.getJobSchedules(jobID).$object;
        $scope.msgWell = ({type: "warning", msg: "Click Execute Job and results will appear below"});
        $scope.alerts =  [];
        $scope.executions = [];

        // Enable visual display of sort column and order
        $scope.orderColumn = "batch_Id";
        $scope.orderDirection = "asc";

        // get the total count
        Restangular.one('jobs', jobID).all('executions').one('count').get().then(function (result) {

            $scope.pagination.totalItems = result.jobExecutionCount;
        });

        // Pagination configuration
        $scope.pagination = {
            itemsPerPage: 5
            , maxSize: 5
            , totalItems: 0
            , currentPage: 1
            , showingFirstIndex: 0
            , showingLastIndex: 0
        };
        setPage(1);

        // Function delegates
        $scope.executionRecordStyle = executionRecordStyle;
        $scope.showSchedule = showSchedule;
        $scope.validateJobName = validateJobName;
        $scope.validateJobDescription = validateJobDescription;
        $scope.updateJob = updateJob;
        $scope.validateScheduleName = validateScheduleName;
        $scope.validateScheduleDescription = validateScheduleDescription;
        $scope.validateCron = validateCron;
        $scope.updateSchedule = updateSchedule;
        //$scope.order = order;
        $scope.setPage = setPage;
    })();
});
