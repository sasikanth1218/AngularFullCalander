/*globals app */
app.controller("wizardController", function (
    $scope
    , $location
    , l10nFactory
    , usSpinnerService
    , wizardFactory
    , wizardService
    , jobsResource
) {
    "use strict";

    // Identifier of the busy spinner
    var SPINNER_KEY = "spinner-1";

    // Localized view text
    var L = l10nFactory.getStrings("wizardController");

    //region Functions

    /**
     * Starts the identified spinner object to show a busy state
     *
     * @param spinnerKey {string} Identifier of the spinner to show; defaults to
     * the SPINNER_KEY constant value.
     */
    function startSpinner(spinnerKey) {
        usSpinnerService.spin(spinnerKey || SPINNER_KEY);
    }

    /**
     * Removes the identified spinner object from view
     *
     * @param spinnerKey {string} Identifier of the spinner to hide; defaults to
     * the SPINNER_KEY constant value.
     */
    function stopSpinner(spinnerKey) {
        usSpinnerService.stop(spinnerKey || SPINNER_KEY);
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
     * Increases the UI-blocking level and updates visual queues to match.
     */
    function addBlocker() {
        if (1 > $scope.blockingOperations.count) {
            startSpinner(SPINNER_KEY);
        }

        $scope.blockingOperations.count++;
    }

    /**
     * Decreases the UI-blocking level and updates visual queues to match.
     */
    function removeBlocker() {
        $scope.blockingOperations.count--;

        if (1 > $scope.blockingOperations.count) {
            stopSpinner(SPINNER_KEY);
        }
    }

    /**
     * Gently scrolls the user's view to the top of the wizard
     */
    function scrollViewToTop() {
        $("html,body").animate(
            { scrollTop: $("#wizard-top").offset().top }
            , 500
            , "swing"
        );
    }

    /**
     * Helper function that sets the wizard view to a specific step, by ID.
     * This function is not necessarily triggered by the user.
     *
     * @param stepID {number} The wizard step (by ID) to activate
     */
    function setActive(stepID) {
        var activeClass = "active-step"
            , prevClass = "previous-step"
            , nextClass = ""
            , stepClass = []
            , stepParts = $scope.wizardSteps
            , stepCount = stepParts.length
            , stepNumber
            , stepIndex
            , stepPart
        ;

        wizardService.setPartialById(stepID);
        stepPart = wizardService.getPartial();
        stepNumber = stepPart.step;

        for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
            stepClass[stepIndex] =
                (stepIndex === stepNumber)
                    ? activeClass
                    : ((stepIndex < stepNumber) ? prevClass : nextClass)
            ;
        }

        $scope.stepClass = stepClass;
        $scope.partial = stepPart;
    }

    /**
     * Fired whenever the user clicks a specific wizard step.
     *
     * @param stepID {number} The wizard step (by ID) to activate
     */
    function activateStep(stepID) {
        var maxStep = wizardService.getMaxStep()
            , activeStepNumber
            , selectedStepNumber
        ;

        // Disallow step hopping while a blocking operation is active to prevent
        // cataclysmic state failure.
        if (isBlocking()) {
            return;
        }

        // In addition, disallow hopping forward while the present form is
        // invalid.
        activeStepNumber = $scope.partial.step;
        selectedStepNumber = wizardFactory.getPartialByID(stepID).step;
        if (!$scope.validForm && (selectedStepNumber > activeStepNumber)) {
            addAlert(L.errorFormRequired, "error");
            return;
        }

        // Also disallow stepping too far forward
        if (selectedStepNumber > maxStep) {
            addAlert(
                l10nFactory.interpolateString(L.errorSteppingTooFar, maxStep + 1)
                , "info"
            );
            return;
        }

        $scope.alerts = [];
        setActive(stepID);
        scrollViewToTop();
    }

    /**
     * Fired whenever the user clicks the wizard's [Next] button.
     */
    function activateNextStep() {
        activateStep(wizardService.getPartial().next);
    }

    /**
     * Resets the scope variables and sets the wizard view to the first page.
     */
    function resetWizard() {
        wizardService.init();
        $scope.alerts = [];
        $scope.jobConfigTemplate = wizardFactory.getJobConfigTemplate();
        setActive(1);
    }

    /**
     * Fired when the user deliberately clicks the wizard's [Cancel] button or
     * abandons the wizard.
     */
    function cancelWizard() {
        wizardService.cancelWizard();
        $location.path("jobs");
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
        scrollViewToTop();  // Ensure each new alert is seen
    }

    function removeAlert() {
        if($scope.alerts != null) {
            if($scope.alerts.length > 0) {
                $scope.alerts.pop();
            }
        }
    }

    /**
     * Adds a new alert based on an HTTP Promise result
     *
     * @param httpResult {object} The HTTP result
     * @param alertType {string} (OPTIONAL) The alert type; can be any of the
     *  types allowed by Bootstrap (info, success, danger, etc.); defaults to
     *  "danger"
     */
    function addHTTPAlert(httpResult, alertType) {
        addAlert(
            "[" + httpResult.status + "] " + httpResult.data
            , alertType || "danger"
        );
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
     * Function delegate that enables sub-forms (the various wizard steps) to
     * hook the main [Next/Create] button's enabled state.
     *
     * @param isValid {bool} true = enable the button; false, otherwise
     */
    function onFormValidChangeEvent(isValid) {
        var maxStep = wizardService.getMaxStep()
            , activeStepNumber = $scope.partial.step
        ;

        $scope.validForm = isValid;

        // Permit access to the next step only when the present step is valid
        if (isValid) {
            if (activeStepNumber >= maxStep) {
                wizardService.setMaxStep(activeStepNumber + 1);
            }
        }
    }

    /**
     * Sets the job configuration object that will be submitted to the API when
     * createJob() is called.
     *
     * @param jobConfig {object} The job configuration object.
     */
    function setJobConfig(jobConfig) {
        $scope.readyJobConfig = jobConfig;
    }

    /**
     * Submits the job configuration object to the API.
     */
    function createJob() {
        var jobConfig = $scope.readyJobConfig;

        addBlocker();
        addAlert(
            l10nFactory.interpolateString(L.submittedJob, jobConfig.name)
            , "info"
        );

        jobsResource.postJob(jobConfig).then(
            function($object) {
                removeAlert();
                addAlert(
                    l10nFactory.interpolateString(
                        L.createdJob
                        , $object.name
                        , $object.id
                    )
                    , "success"
                );
                $scope.validForm = false;
            }, function(response) {
                //addHTTPAlert(response);
                window.console.log(response);
                removeAlert();
                addAlert(
                    "Job creation failed.  Please contact customer support for more details."
                    , "danger"
                );
            }).finally(function() {
                removeBlocker();
            })
        ;
    }

    //endregion

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;

    // Wizard-wide feedback collection
    $scope.alerts = [];
    $scope.validForm = false;

    // Track whether an asynchronous operation should be treated as blocking
    $scope.blockingOperations = { count: 0 };

    // Initialize static collections
    $scope.wizardSteps = wizardFactory.getPartials();
    $scope.jobTypes = wizardFactory.getJobTypes();
    $scope.jobExpiries = wizardFactory.getJobExpiries();

    // Function delegates
    $scope.activateNextStep = activateNextStep;
    $scope.activateStep = activateStep;
    $scope.addAlert = addAlert;
    $scope.addBlocker = addBlocker;
    $scope.addHTTPAlert = addHTTPAlert;
    $scope.cancelWizard = cancelWizard;
    $scope.closeAlert = closeAlert;
    $scope.createJob = createJob;
    $scope.isBlocking = isBlocking;
    $scope.onFormValidChangeEvent = onFormValidChangeEvent;
    $scope.removeBlocker = removeBlocker;
    $scope.setJobConfig = setJobConfig;
    $scope.startSpinner = startSpinner;
    $scope.stopSpinner = stopSpinner;

    // Reset the view
    resetWizard();

    //endregion
});
