/*globals app */
app.controller("pollingScheduleController", function (
    $scope
    , scheduleService
    , schedulesResource
) {
    "use strict";
    var scheduleAlerts = [];

    /**
     * Initializes this controller.
     */
    function init() {
        $scope.scheduleTemplate = (
            jQuery.isEmptyObject(scheduleService.getSchedule())
            ? scheduleService.getScheduleTemplate()
            : scheduleService.getSchedule()
        );
        $scope.pollingFrequencies = scheduleService.getPollingFrequencies();
        $scope.hours = scheduleService.getHours();
        $scope.scheduleAlerts = scheduleAlerts;
    }
    init();

    /**
     * Automatically populates all required fields of a generic schedule
     * template when being used for a polling schedule.
     *
     * @param scheduleTPL {object} The schedule template to set up
     */
    function setupPollingTemplate(scheduleTPL) {
        var dateNow = new Date()
            , futureDate = new Date(new Date().setUTCFullYear(dateNow.getUTCFullYear() + 50))
            , jobTPL = $scope.jobConfigTemplate
        ;

        scheduleTPL.name = jobTPL.jobName + " Schedule";
        scheduleTPL.description = "Schedule for " + jobTPL.jobName;
        scheduleTPL.startDate = dateNow;
        scheduleTPL.startTime = "00:00";
        scheduleTPL.endDate = futureDate;
        scheduleTPL.endTime = "00:00";
        scheduleTPL.enabled = true;
    }

    /**
     * Validates the present polling schedule with UI feedback.
     */
    $scope.checkSchedule = function() {
        var scheduleTPL = $scope.scheduleTemplate
            , jobTPL = $scope.jobConfigTemplate
            , cronSchedule = scheduleService.getCronString(scheduleTPL)
        ;

        // A job name is required so it can be used to generate a schedule name
        if (!jobTPL.jobName) {
            $scope.scheduleAlerts = [
                {   type: "danger"
                    , msg: "[400] A job name must be set"
                }
            ];
            return;
        }

        setupPollingTemplate(scheduleTPL);
        scheduleService.clearSchedule();
        schedulesResource.validateCron(cronSchedule).then(function ($object) {
            scheduleService.addSchedule(scheduleTPL);
            scheduleService.setValid(true);
            $scope.scheduleAlerts = [
                {   type: "success"
                    , msg: "[200] Polling frequency is valid"
                }
            ];
        }, function(response) {
            scheduleService.clearSchedule();
            scheduleService.setValid(false);
            $scope.scheduleAlerts = [
                {   type: "danger"
                    , msg: "[" + response.status + "] " + response.data
                }
            ];
        });
    };

    /**
     * Dismisses a specific UI alert message.
     *
     * @param index {number} Index of the message to dismiss.
     */
    $scope.closeScheduleAlert = function(index) {
        $scope.scheduleAlerts.splice(index, 1);
    };

    /**
     * Re-initializes this controller if the view becomes active when this
     * controller isn't.
     */
    $scope.$on("scheduleService:active", function(event, active) {
        if (!active) {
            init();
        }
    });

    /**
     * Resets the schedule controller whenever the user resets the Wizard.
     */
    $scope.$on("wizardService:cancelWizard", function(event) {
        scheduleService.resetSchedule();
    });
});
