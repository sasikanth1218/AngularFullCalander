app.controller('scheduleController', function ($scope, scheduleService, schedulesResource) {

    var scheduleAlerts = [];
    //init for Initialization

    init();

    function init() {

        $scope.scheduleAlerts = scheduleAlerts;

        $scope.scheduleTemplate = jQuery.isEmptyObject(scheduleService.getSchedule()) ? scheduleService.getScheduleTemplate() : scheduleService.getSchedule();

        $scope.collapseStartDateTimePicker = true;
        $scope.collapseEndDateTimePicker = true;
        $scope.collapseScheduleRunEveryTooltip = true;
        $scope.collapseScheduleEnabledTooltip = true;

        $scope.minutes = scheduleService.getMinutes();
        $scope.hours = scheduleService.getHours();
        $scope.daysOfTheWeek = scheduleService.getDaysOfTheWeek();
        $scope.daysOfTheMonth = scheduleService.getDaysOfTheMonth();
        $scope.months = scheduleService.getMonths();
        $scope.timeZones = scheduleService.getTimeZones();

        if ($scope.scheduleTemplate.cronString !== null && $scope.scheduleTemplate.months.length === 0) {
            $scope.enableCronInput = true;
            $scope.disableMinuteSelect = true;
            $scope.disableHourSelect = true;
            $scope.disableDowSelect = true;
            $scope.disableDomSelect = true;
            $scope.disableMonthsSelect = true;
            $scope.enableDomSelect = false;
            $scope.scheduleTemplate.minute = $scope.minutes[0];
            $scope.scheduleTemplate.hour = $scope.hours[0];
            $scope.scheduleTemplate.daysOfWeek = [];
            $scope.scheduleTemplate.daysOfMonth = [];
            $scope.scheduleTemplate.months = [];

        } else {

            if (!jQuery.isEmptyObject($scope.scheduleTemplate.minute)) {
                for (var i = 0; i < $scope.minutes.length; i++) {
                    if ($scope.minutes[i].key === $scope.scheduleTemplate.minute.key) {
                        $scope.scheduleTemplate.minute = $scope.minutes[i];
                    }
                }
            } else {
                $scope.scheduleTemplate.minute = $scope.minutes[0];
            }

            if (!jQuery.isEmptyObject($scope.scheduleTemplate.hour)) {
                for (var i = 0; i < $scope.hours.length; i++) {
                    if ($scope.hours[i].key === $scope.scheduleTemplate.hour.key) {
                        $scope.scheduleTemplate.hour = $scope.hours[i];
                    }
                }
            } else {
                $scope.scheduleTemplate.hour = $scope.hours[0];
            }

            //if ($scope.scheduleTemplate.daysOfWeek.length === 0 && $scope.scheduleTemplate.daysOfMonth.length === 0) {
            //    $scope.scheduleTemplate.daysOfWeek.push($scope.daysOfTheWeek[0]);
            //    $scope.disableDowSelect = false;
            //    $scope.disableDomSelect = true;
            //} else if ($scope.scheduleTemplate.daysOfWeek.length !== 0 && $scope.scheduleTemplate.daysOfMonth.length === 0) {
            //    // use existing dow
            //    $scope.disableDowSelect = false;
            //    $scope.disableDomSelect = true;
            //} else if ($scope.scheduleTemplate.daysOfWeek.length === 0 && $scope.scheduleTemplate.daysOfMonth.length !== 0) {
            //    // use existing dom
            //    $scope.disableDowSelect = true;
            //    $scope.disableDomSelect = false;
            //    $scope.enableDomSelect = true;
            //} else if ($scope.scheduleTemplate.daysOfWeek.length !== 0 && $scope.scheduleTemplate.daysOfMonth.length !== 0) {
            //    $scope.alerts.push({
            //        type: 'danger',
            //        msg: "[400] " + "Error defining schedule, please cancel the wizard and restart"
            //    });
            //}

            //if ($scope.scheduleTemplate.months.length === 0) {
            //    $scope.scheduleTemplate.months.push($scope.months[0]);
            //}
            //$scope.disableMinuteSelect = false;
            //$scope.disableHourSelect = false;
            //$scope.disableMonthsSelect = false;
            //$scope.enableCronInput = false;
        }

        initSharedDatePickerOptions();
        initStartDate();
        initEndDate();
        initSharedTimePickerOptions();
        initStartTime();
        initEndTime();
    };

    $scope.closeScheduleAlert = function (index) {
        $scope.scheduleAlerts.splice(index, 1);
    };



    function initSharedDatePickerOptions() {

    };

    function initStartDate() {

        $scope.openStartDatePopup = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.startDatePopupOpened = true;
        };

        $scope.minDate = new Date();

    };

    function initEndDate() {

        $scope.openEndDatePopup = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.endDatePopupOpened = true;
        };

    };

    function initSharedTimePickerOptions() {
        $scope.hstep = 1;
        $scope.mstep = 15;
        $scope.ismeridian = false;
    };

    function initStartTime() {
        var startTime = new Date(2000, 01, 01, 00, 00, 00, 00);
        if (!jQuery.isEmptyObject($scope.scheduleTemplate.startTime)) {
            var startHoursAndMinutes = $scope.scheduleTemplate.startTime.split(':');
            startTime.setHours(startHoursAndMinutes[0]);
            startTime.setMinutes(startHoursAndMinutes[1]);
            $scope.startTime = startTime;
        } else {
            $scope.scheduleTemplate.startTime = '00:00';
            $scope.startTime = startTime;
        }

    }

    function initEndTime() {
        var endTime = new Date(2000, 01, 01, 00, 00, 00, 00);
        if (!jQuery.isEmptyObject($scope.scheduleTemplate.endTime)) {
            var endHoursAndMinutes = $scope.scheduleTemplate.endTime.split(':');
            endTime.setHours(endHoursAndMinutes[0]);
            endTime.setMinutes(endHoursAndMinutes[1]);
            $scope.endTime = endTime;
        } else {
            $scope.scheduleTemplate.endTime = '00:00';
            $scope.endTime = endTime;
        }

    }

    $scope.setScheduleStartTime = function (startTime) {
        $scope.scheduleTemplate.startTime = startTime.getHours() + ':' + startTime.getMinutes();
    };

    $scope.setScheduleEndTime = function (endTime) {
        $scope.scheduleTemplate.endTime = endTime.getHours() + ':' + endTime.getMinutes();
    };


    $scope.weekday = {day1:false,day2:false,day3:false,day4:false,day5:false,day6:false,day7:false};

    $scope.evaluateSelectedInputs = function () {

        if ($scope.enableCronInput) {
            $scope.disableMinuteSelect = true;
            $scope.disableHourSelect = true;
            $scope.disableDowSelect = true;
            $scope.disableDomSelect = true;
            $scope.disableMonthsSelect = true;
            $scope.enableDomSelect = false;

            $scope.scheduleTemplate.minute = $scope.minutes[0];
            $scope.scheduleTemplate.hour = $scope.hours[0];
            //$scope.scheduleTemplate.daysOfWeek = [];
            $scope.scheduleTemplate.daysOfMonth = [];
            $scope.scheduleTemplate.months = [];
            $scope.scheduleTemplate.daily = {};
            $scope.scheduleTemplate.weekly = { daysOfWeek: [] };
            $scope.scheduleTemplate.monthly = {};

            $scope.scheduleTemplate.cronString = null;

            $scope.weekday = { day1: false, day2: false, day3: false, day4: false, day5: false, day6: false, day7: false };

        } else {
            $scope.disableMinuteSelect = false;
            $scope.disableHourSelect = false;
            $scope.disableDowSelect = false;
            $scope.disableDomSelect = true;
            $scope.disableMonthsSelect = false;
            $scope.scheduleTemplate.cronString = null;
        }

        if ($scope.enableDomSelect) {
            $scope.disableDowSelect = true;
            $scope.disableDomSelect = false;
            $scope.scheduleTemplate.daysOfWeek = [];
        } else if ($scope.enableCronInput) {
            $scope.disableDowSelect = true;
            $scope.disableDomSelect = true;
        } else {
            $scope.scheduleTemplate.daysOfMonth = [];
        }

    };
    $scope.setSchedule = function() {
        $scope.cronString = scheduleService.buildCronString($scope.scheduleTemplate);
        console.log($scope.cronString);
        var scheduleTPL = $scope.scheduleTemplate
            , cronSchedule = scheduleService.getCronString(scheduleTPL) ;
        schedulesResource.validateCron(cronSchedule).then(function ($object) {
            scheduleService.addSchedule(scheduleTPL);
            scheduleService.setValid(true);
            $scope.scheduleAlerts = [{type: 'success', msg: "[200] Schedule is valid"}];
        }, function(response) {
            $scope.scheduleAlerts = [{type: 'danger', msg: '[' + response.status + '] ' + response.data}];
            window.console.error(response);
        });
    };

    $scope.$on('scheduleService:active', function (event, active) {
        if (!active) {
            init();
        }
    });

    $scope.$on('wizardService:cancelWizard', function (event) {
        scheduleService.resetSchedule();
    });

    $scope.customerOptions = [
        {name: 'Daily', value: 'daily'},
        {name: 'Weekly', value: 'weekly'},
        {name: 'Monthly', value: 'monthly'}
    ];
    $scope.repeatOptions = [
        {name: 'Day'},
        {name: 'First'},
        {name: 'Second'},
        {name: 'Third'},
        {name: 'Fourth'},
        {name: 'Last'}
    ];
    $scope.repeatMonthlyOptions = [
        {name: 'Day', value:"Day"},
        { name: 'Weekday', value: "Weekday" },
        { name: 'Sunday', value: "SUN" },
        { name: 'Monday', value: "MON" },
        { name: 'Tuesday', value: "TUE" },
        { name: 'Wednesday', value: "WED" },
        { name: 'Thursday', value: "THU" },
        { name: 'Friday', value: "FRI" },
        { name: 'Saturday', value: "SAT" }
    ];

       $scope.setDaysOfWeeks = function (day, key, value) {
        if (value) {
            $scope.scheduleTemplate.weekly.daysOfWeek.push({ "key": key, "label": day, "value": key })
        }
        else {
            for (var i = 0; i < $scope.scheduleTemplate.weekly.daysOfWeek.length; i++) {
                if ($scope.scheduleTemplate.weekly.daysOfWeek[i].key == key) {
                    $scope.scheduleTemplate.weekly.daysOfWeek.splice(i, 1);
                    break;
                }

            }
        }
    }
});
