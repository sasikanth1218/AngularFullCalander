/*globals app */
app.controller("wizardStep1JobController", function (
    $scope
    , $timeout
    , l10nFactory
    , wizardFactory
    , wizardService
    , jobsResource
    , scheduleService
) {
    "use strict";

    // Base path for dynamic HTML templates used by this view
    var TPL_BASE = "app/partials/templates";

    // HTML templates used by this view
    var HTML_TEMPLATES = {
        recurringSchedule: {path: TPL_BASE + "/schedule.html"}
        , pollingSchedule: {path: TPL_BASE + "/pollingSchedule.html"}
    };
    Object.freeze(HTML_TEMPLATES);

    /**
     * Toggles visibility of various UI elements based on the selected Job Type.
     *
     * @param uiMode {string} One of the wizardFactory.getUIModes() properties
     */
    function switchUIMode(uiMode) {
        var uiModes = wizardFactory.getUIModes()
            , moduleTypes = null
        ;

        // Determine modules to display
        switch (uiMode) {
            case uiModes.ADHOC: {
                // Set Step 2 Options (modules)
                wizardService.setModuleTypes(wizardFactory.getModuleTypes());

                // Hide the scheduling and polling controls
                $scope.showSchedule.isActive = false;
                scheduleService.setActive(false);
                break;
            }
            case uiModes.RECURRING: {
                // Set Step 2 Options (modules)
                moduleTypes = wizardFactory.getModuleTypes();
                moduleTypes.splice(0,1);
                wizardService.setModuleTypes(moduleTypes);

                // Show the SCHEDULE and RUN EVERY controls
                $scope.showSchedule.isActive = true;
                $scope.showSchedule.mode($scope.schedulingModes.RECURRING);
                scheduleService.setActive(true);
                $timeout(function () {
                    $scope.showSchedule.isActive = true;
                    $scope.showSchedule.mode($scope.schedulingModes.RECURRING);
                });
                break;
            }
            case uiModes.POLLING: {
                // Set Step 2 Options (modules)
                moduleTypes = wizardFactory.getModuleTypes();
                moduleTypes.splice(0,1);
                wizardService.setModuleTypes(moduleTypes);

                // Show the POLLING INTERVAL controls
                $scope.showSchedule.isActive = true;
                $scope.showSchedule.mode($scope.schedulingModes.POLLING);
                scheduleService.setActive(true);
                $timeout(function () {
                    $scope.showSchedule.isActive = true;
                    $scope.showSchedule.mode($scope.schedulingModes.POLLING);
                });
                break;
            }
            default: {
                // Hide the scheduling and polling controls
                $scope.showSchedule.isActive = false;
                scheduleService.setActive(false);
                wizardService.setModuleTypes({});
                break;
            }
        }
    }

    /**
     * Event fired whenever the user changes the Job Type.
     *
     * @param jobType {object} The newly selected Job Type descriptor
     */
    function onJobTypeChangeEvent(jobType) {
        var typeName = jobType.type
            , uiMode = jobType.uiMode
        ;

        wizardService.setJobConfig(
            jobsResource.getJobsResource().customGET(
                "config"
                , { type: typeName }
            ).$object
        );
        $scope.jobConfigTemplate.jobType = typeName;
        wizardService.setJobType(jobType);
        switchUIMode(uiMode);
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() { }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        // The jobType must be null to deliberately trip a validation fault when
        // the user has yet to select one.
        var savedJobType = wizardService.getJobType();
        $scope.jobType =
            jQuery.isEmptyObject(savedJobType) ? null : savedJobType;

        $scope.schedulingModes = scheduleService.getModes();
        $scope.showSchedule = {
            isActive: scheduleService.isActive()
            , mode: scheduleService.mode            // Function delegate
        };

        $scope.isScheduleValid = scheduleService.isValid();

        // TODO:  Track down whatever consumes this value and save/restore its state accordingly.
        $scope.collapseStep1ScheduleRunEveryToolTip = true;
    }

    //region View Constructor

    // Set the scheduling templates
    $scope.scheduleTemplate = HTML_TEMPLATES.recurringSchedule;
    $scope.pollingScheduleTemplate = HTML_TEMPLATES.pollingSchedule;

    // Extend the localization object to the view
    $scope.L = l10nFactory.getStrings("wizardStep1JobController");

    // Function Delegates
    $scope.onJobTypeChangeEvent = onJobTypeChangeEvent;

    // Event Listeners
    $scope.$on("wizardService:cancelWizard", function() {
        $scope.jobType = undefined;
        scheduleService.setActive(false);
        $scope.showSchedule.isActive = false;
        $scope.isScheduleValid = false;
    });

    $scope.$on("scheduleService:valid", function(event, data) {
        $scope.isScheduleValid = data;
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardJobFormStep1.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep1JobController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep1JobController = {};
        $scope.savedState = wizardService.viewStates.wizardStep1JobController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
