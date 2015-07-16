/*globals app */
app.controller("jobExecutionsController", function (
    $scope
    , $location
    , Restangular
    , $routeParams
    , executionsResource
    , jobsResource
    , $filter
) {
    "use strict";
    var orderBy = $filter("orderBy");

    // Conditional formatting for modules table on execution failure
    function executionRecordStyle(status) {
        return {color: (("FAILED" === status) ? "red" : "black")};
    }

    function order(predicate) {
        // When the user changes the sort column, don't also reverse the sort
        // order.
        var reverse = false;
        if (predicate === $scope.orderColumn) {
            reverse = ("asc" === $scope.orderDirection);
        }

        $scope.executions = orderBy($scope.executions, predicate, reverse);

        // Enable visual sort indicators to reflect the new sort column /
        // direction.
        $scope.orderColumn = predicate;
        $scope.orderDirection = (reverse ? "desc" : "asc");
    }

    // Initialize the view
    (function init() {
        // Load the job and its executions
        $scope.job = jobsResource.getJob($routeParams.id).$object;
        $scope.executions =
            executionsResource.getJobExecutions($routeParams.id).$object;

        // Enable visual display of sort column and order
        $scope.orderColumn = "id";
        $scope.orderDirection = "asc";

        // Function delegates
        $scope.executionRecordStyle = executionRecordStyle;
        $scope.order = order;
    })();
});
