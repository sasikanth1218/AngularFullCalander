/*globals app */

/**
 * Creates a new controller for the Jobs > Chain route
 */
app.controller("jobChainController", function(
    $scope
    , $timeout
    , usSpinnerService
    , jobsResource
    , scheduleService
    , l10nFactory
) {
    "use strict";

    // Base path for partial HTML templates
    var TPL_BASE = "app/partials/templates";

    // Identifier of the busy spinner
    var SPINNER_KEY = "busySpinner";

    // Localized view text
    var L = l10nFactory.getStrings("jobChainController");

    //region Functions

    /**
     * Reloads the set of chainable jobs.
     */
    function reloadChainableJobs() {
        $scope.defaultChainJobSelection = L.jobDataLoading;

        jobsResource.getChainableJobs().then(
            function(resultSet) {
                resultSet.sort(function (l, r) {
                    return l.name.localeCompare(r.name);
                });
                $scope.chainableJobs = resultSet;

                if (resultSet.length) {
                    rebuildSelectableJobs();
                    $scope.defaultChainJobSelection = L.selectJob;
                } else {
                    $scope.defaultChainJobSelection = L.createChainableJob;
                }
            },
            function(httpResult) {
                $scope.defaultChainJobSelection = L.noJobsAvailable;
                addHTTPAlert(httpResult);
            }
        );
    }

    /**
     * Calculates the relative complement of the set of chainable jobs and those
     * which the user has already selected for the present chain.
     *
     * @param chainableJobs {Array} The set of jobs that can be chained
     * @param selectedJobIDs {Array} The set of selected job IDs
     * @returns {Array} The relative complement
     */
    function getUnchainedJobs(chainableJobs, selectedJobIDs) {
        var availableIDs = chainableJobs.map(function(o) { return o.id; })
            , complementIDs = availableIDs.filter(
                function (e) { return -1 === selectedJobIDs.indexOf(e); }
            )
        ;

        return chainableJobs.filter(
            function (o) { return -1 < complementIDs.indexOf(o.id); }
        );
    }

    /**
     * Rebuilds the collection of control-specific available chainable job data
     */
    function rebuildSelectableJobs() {
        var jobSelections = $scope.chainProperties.jobIDChain
            , selectionCount = jobSelections.length
            , chainableJobs = $scope.chainableJobs
            , chainableCount = chainableJobs.length
            , availableJobs = getUnchainedJobs(
                $scope.chainableJobs
                , jobSelections
            )
            , selectionMap = {}
            , selectableJobs = []
            , selIndex
            , selectedID
            , selectedJob
        ;

        // Build a referential map of the chainable jobs
        for (selIndex = 0; selIndex < chainableCount; selIndex++) {
            selectionMap[chainableJobs[selIndex].id] = chainableJobs[selIndex];
        }

        // Build the unique view of available jobs per input control
        for (selIndex = 0; selIndex < selectionCount; selIndex++) {
            selectedID = jobSelections[selIndex];
            selectedJob = selectionMap[selectedID];
            selectableJobs[selIndex] = angular.copy(availableJobs);

            // The actual selected job will be omitted, so add it back to the
            // top of the array to keep the view state consistent
            if ((null !== selectedJob) && (undefined !== selectedJob)) {
                selectableJobs[selIndex].unshift(selectedJob);
            }
        }

        $scope.selectableJobs = selectableJobs;
    }

    /**
     * Indicates whether any job in the chain is presently null
     *
     * @returns {boolean}
     */
    function hasNullJob() {
        return -1 < $scope.chainProperties.jobIDChain.indexOf(null);
    }

    /**
     * Adds a new (null) job to the chain at a specific index
     *
     * @param chainIndex {number} The index under which to create a null job
     */
    function addJob(chainIndex) {
        $scope.chainProperties.jobIDChain.splice(chainIndex + 1, 0, null);
        rebuildSelectableJobs();
    }

    /**
     * Removes a job chain entry at a specific index
     *
     * @param chainIndex {number} The index to remove
     */
    function removeJob(chainIndex) {
        $scope.chainProperties.jobIDChain.splice(chainIndex, 1);
        rebuildSelectableJobs();
    }

    /**
     * Swaps a job chain entry with another
     *
     * @param chainIndex {number} The job chain entry index to swap out
     * @param moveBy {number} The number of index positions away to swap with
     */
    function moveJob(chainIndex, moveBy) {
        var targetIndex = chainIndex + moveBy
            , jobIDChain = $scope.chainProperties.jobIDChain
            , swapJob = jobIDChain[chainIndex]
            , selectableJobs = $scope.selectableJobs
            , swapSet = selectableJobs[chainIndex]
        ;
        jobIDChain[chainIndex] = jobIDChain[targetIndex];
        jobIDChain[targetIndex] = swapJob;
        selectableJobs[chainIndex] = selectableJobs[targetIndex];
        selectableJobs[targetIndex] = swapSet;
    }

    /**
     * Builds a complete CHAIN configuration for the user's input.
     *
     * @returns {object}
     * @throws L.requireChainedJobs when called without any chained jobs
     */
    function buildChainConfig() {
        var hasChain = false
            , chainProperties = $scope.chainProperties
            , jobIDs = chainProperties.jobIDChain
            , jobID
            , jobCount = jobIDs.length
            , jobIndex
            , chainConfig = {
                type: "CHAIN"
                , name: chainProperties.name
                , description: chainProperties.description
                , modules: [{
                    type: "JOBCHAIN"
                    , attributes: []
                }]
            }
            , chainAttributes = chainConfig.modules[0].attributes
            , ordinalPos = 0
        ;

        // Add the job chain, if there is one
        for (jobIndex = 0; jobIndex < jobCount; jobIndex++) {
            jobID = jobIDs[jobIndex];
            if ((null !== jobID) && (undefined !== jobID)) {
                hasChain = true;
                chainAttributes.push({
                    key: "JOBID"
                    , value: jobID
                    , ordinalPos: ordinalPos++
                });
            }
        }

        // Check that a chain now exists
        if (!hasChain) {
            throw L.requireChainedJobs;
        }

        // Add the schedule configuration, if active
        if ($scope.showSchedule.isActive) {
            if (!scheduleService.isActive()) {
                // The user has activated the schedule in the view, so inform
                // the schedule service that the next request is valid.
                scheduleService.setActive(true);
            }
            chainConfig.scheduleConfig = scheduleService.buildScheduleConfig();
        }

        return chainConfig;
    }

    /**
     * Resets all form input controls to a default state
     */
    function resetFormInputs() {
        // Properties of this job chain
        $scope.chainProperties = {
            // The short job name
            name: null,

            // The long job description
            description: null,

            // Order-significant Array of Job IDs
            jobIDChain: [null]    // Always start with one null
        };

        // The per-entry set of selectable, chainable jobs
        $scope.selectableJobs = [];

        // The schedule builder
        scheduleService.clearSchedule();
        scheduleService.resetSchedule();
        scheduleService.mode(scheduleService.getModes().RECURRING);
        $scope.showSchedule = { isActive: false };
        $scope.isScheduleValid = false;

        // Get a fresh list of chainable jobs
        reloadChainableJobs();

        // Put the focus on the first form element
        $timeout(function () {
            angular.element("#txtName").focus();
        }, 200);
    }

    /**
     * Fired whenever the user clicks the Save button
     */
    function onSave() {
        $scope.blockingOperations.count++;
        startSpinner(SPINNER_KEY);
        jobsResource.postJob(buildChainConfig()).then(
            function() {
                resetFormInputs();
                addAlert(L.jobChainAccepted, "success");
            }
            , function(httpResult) {
                addHTTPAlert(httpResult);
            }
        ).then(
            function() {
                stopSpinner(SPINNER_KEY);
                $scope.blockingOperations.count--;
            }
        );
    }

    /**
     * Indicates whether an asynchronous operation must be treated as blocking
     *
     * @returns {boolean}
     */
    function isBlocking() {
        return 0 < $scope.blockingOperations.count;
    }

    /**
     * Adds a new alert message to the view
     *
     * @param alertText {string} The new alert message
     * @param alertType {string} (OPTIONAL) The alert type; can be any of the
     *  types allowed by Bootstrap (info, success, danger, etc.)
     */
    function addAlert(alertText, alertType) {
        var alertConfig = { msg: alertText };
        if (alertType) {
            alertConfig.type = alertType;
        }
        $scope.alerts.push(alertConfig);
        window.scrollTo(0, 0);
    }

    /**
     * Adds a new alert based on an HTTP Promise result
     *
     * @param httpResult {object} The HTTP result
     */
    function addHTTPAlert(httpResult) {
        addAlert("[" + httpResult.status + "] " + httpResult.data, "danger");
    }

    /**
     * Removes an alert from the view by index
     *
     * @param alertIndex {number} The alert index to remove
     */
    function closeAlert(alertIndex) {
        $scope.alerts.splice(alertIndex, 1);
    }

    /**
     * Starts the identified spinner object to show a busy state
     *
     * @param spinnerKey {string} Identifier of the spinner to show
     */
    function startSpinner(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    }

    /**
     * Removes the identified spinner object from view
     *
     * @param spinnerKey {string} Identifier of the spinner to hide
     */
    function stopSpinner(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    }

    //endregion

    // Initialize the view's scope
    (function init() {
        // Set of partial HTML templates that comprise this view
        $scope.htmlTemplates = {
            newChainForm: TPL_BASE + "/jobAddChainForm.html"
            , recurringSchedule: TPL_BASE + "/schedule.html"
            , pollingSchedule: TPL_BASE + "/pollingSchedule.html"
        };

        // Extend the localization object to the view
        $scope.L = L;

        // Array of alert messages
        $scope.alerts = [];

        // Track whether an asynchronous operation should be treated as blocking
        $scope.blockingOperations = { count: 0 };

        // The set of chainable jobs
        $scope.chainableJobs = [];

        // The default job selector text
        $scope.defaultChainJobSelection = L.jobDataLoading;

        // Function delegates
        $scope.addJob = addJob;
        $scope.removeJob = removeJob;
        $scope.moveJob = moveJob;
        $scope.hasNullJob = hasNullJob;
        $scope.rebuildSelectableJobs = rebuildSelectableJobs;
        $scope.onSave = onSave;
        $scope.closeAlert = closeAlert;
        $scope.isBlocking = isBlocking;
        $scope.interpolate = l10nFactory.interpolateString;

        // Subscribe to schedule validation events
        $scope.$on("scheduleService:valid", function(eventProps, validState) {
            $scope.isScheduleValid = validState;
        });

        // Prime the input form for user interaction
        resetFormInputs();
    })();
});
