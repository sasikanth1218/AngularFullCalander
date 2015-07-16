app.controller('scheduleController', function ($scope, scheduleService, schedulesResource) {

    var scheduleAlerts = [];
    //init for Initialization
    $scope.timeZones = [
        { value: "-12", name: "[UTC - 12] Baker Island Time" },
        { value: "-11", name: "[UTC - 11] Niue Time, Samoa Standard Time" },
        { value: "-10", name: "[UTC - 10] Hawaii-Aleutian Standard Time, Cook Island Time" },
        { value: "-9.5", name: "[UTC - 9:30] Marquesas Islands Time" },
        { value: "-9", name: "[UTC - 9] Alaska Standard Time, Gambier Island Time" },
        { value: "-8", name: "[UTC - 8] Pacific Standard Time" },
        { value: "-7", name: "[UTC - 7] Mountain Standard Time" },
        { value: "-6", name: "[UTC - 6] Central Standard Time" },
        { value: "-5", name: "[UTC - 5] Eastern Standard Time" },
        { value: "-4.5", name: "[UTC - 4:30] Venezuelan Standard Time" },
        { value: "-4", name: "[UTC - 4] Atlantic Standard Time" },
        { value: "-3.5", name: "[UTC - 3:30] Newfoundland Standard Time" },
        { value: "-3", name: "[UTC - 3] Amazon Standard Time, Central Greenland Time" },
        { value: "-2", name: "[UTC - 2] Fernando de Noronha Time, South Georgia & the South Sandwich Islands Time" },
        { value: "-1", name: "[UTC - 1] Azores Standard Time, Cape Verde Time, Eastern Greenland Time" },
        { value: "0", name: "[UTC] Western European Time, Greenwich Mean Time" },
        { value: "1", name: "[UTC + 1] Central European Time, West African Time" },
        { value: "2", name: "[UTC + 2] Eastern European Time, Central African Time" },
        { value: "3", name: "[UTC + 3] Moscow Standard Time, Eastern African Time" },
        { value: "3.5", name: "[UTC + 3:30] Iran Standard Time" },
        { value: "4", name: "[UTC + 4] Gulf Standard Time, Samara Standard Time" },
        { value: "4.5", name: "[UTC + 4:30] Afghanistan Time" },
        { value: "5", name: "[UTC + 5] Pakistan Standard Time, Yekaterinburg Standard Time" },
        { value: "5.5", name: "[UTC + 5:30] Indian Standard Time, Sri Lanka Time" },
        { value: "5.75", name: "[UTC + 5:45] Nepal Time" },
        { value: "6", name: "[UTC + 6] Bangladesh Time, Bhutan Time, Novosibirsk Standard Time" },
        { value: "6.5", name: "[UTC + 6:30] Cocos Islands Time, Myanmar Time" },
        { value: "7", name: "[UTC + 7] Indochina Time, Krasnoyarsk Standard Time" },
        { value: "8", name: "[UTC + 8] Chinese Standard Time, Australian Western Standard Time, Irkutsk Standard Time" },
        { value: "8.75", name: "[UTC + 8:45] Southeastern Western Australia Standard Time" },
        { value: "9", name: "[UTC + 9] Japan Standard Time, Korea Standard Time, Chita Standard Time" },
        { value: "9.5", name: "[UTC + 9:30] Australian Central Standard Time" },
        { value: "10", name: "[UTC + 10] Australian Eastern Standard Time, Vladivostok Standard Time" },
        { value: "10.5", name: "[UTC + 10:30] Lord Howe Standard Time" },
        { value: "11", name: "[UTC + 11] Solomon Island Time, Magadan Standard Time" },
        { value: "11.5", name: "[UTC + 11:30] Norfolk Island Time" },
        { value: "12", name: "[UTC + 12] New Zealand Time, Fiji Time, Kamchatka Standard Time" },
        { value: "12.75", name: "[UTC + 12:45] Chatham Islands Time" },
        { value: "13", name: "[UTC + 13] Tonga Time, Phoenix Islands Time" },
        { value: "14", name: "[UTC + 14] Line Island Time" },
    ];
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

            if ($scope.scheduleTemplate.daysOfWeek.length === 0 && $scope.scheduleTemplate.daysOfMonth.length === 0) {
                $scope.scheduleTemplate.daysOfWeek.push($scope.daysOfTheWeek[0]);
                $scope.disableDowSelect = false;
                $scope.disableDomSelect = true;
            } else if ($scope.scheduleTemplate.daysOfWeek.length !== 0 && $scope.scheduleTemplate.daysOfMonth.length === 0) {
                // use existing dow
                $scope.disableDowSelect = false;
                $scope.disableDomSelect = true;
            } else if ($scope.scheduleTemplate.daysOfWeek.length === 0 && $scope.scheduleTemplate.daysOfMonth.length !== 0) {
                // use existing dom
                $scope.disableDowSelect = true;
                $scope.disableDomSelect = false;
                $scope.enableDomSelect = true;
            } else if ($scope.scheduleTemplate.daysOfWeek.length !== 0 && $scope.scheduleTemplate.daysOfMonth.length !== 0) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: "[400] " + "Error defining schedule, please cancel the wizard and restart"
                });
            }

            if ($scope.scheduleTemplate.months.length === 0) {
                $scope.scheduleTemplate.months.push($scope.months[0]);
            }
            $scope.disableMinuteSelect = false;
            $scope.disableHourSelect = false;
            $scope.disableMonthsSelect = false;
            $scope.enableCronInput = false;
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
            $scope.scheduleTemplate.daysOfWeek = [];
            $scope.scheduleTemplate.daysOfMonth = [];
            $scope.scheduleTemplate.months = [];

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

    $scope.setSchedule = function () {
        var scheduleTPL = $scope.scheduleTemplate
            , cronSchedule = scheduleService.getCronString(scheduleTPL)
            ;
        schedulesResource.validateCron(cronSchedule).then(function ($object) {
            scheduleService.addSchedule(scheduleTPL);
            scheduleService.setValid(true);
            $scope.scheduleAlerts = [{type: 'success', msg: "[200] Schedule is valid"}];
        }, function (response) {
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
        {name: 'Day'},
        {name: 'Weekday'},
        {name: 'Sunday'},
        {name: 'Monday'},
        {name: 'Tuesday'},
        {name: 'Wednesday'},
        {name: 'Thursday'},
        {name: 'Friday'},
        {name: 'Saturday'}
    ];
    $scope.repeatOptionsChanged = function ( repeatDay) {
        $scope.scheduleTemplate.daysOfMonth = [{
            "KEY": "Day" ,
            "VALUE": repeatDay
        }]

    }

    $scope.repeatMonth = [
        {name:"January"},
        {name:"February"},
        {name:"March"},
        {name:"April"},
        {name:"May"},
        {name:"June"},
        {name:"July"},
        {name:"August"},
        {name:"September"},
        {name:"October"},
        {name:"November"},
        {name:"December"}];

    $scope.radioModel = 'Sun';
    $scope.addMonday = function (val) {
        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "2",
            "LABEL": "Monday",
            "VALUE": "2"
        }]
    }

    $scope.addTuesday = function (val) {

        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "3",
            "LABEL": "Tuesday",
            "VALUE": "3"
        }]
    }
    $scope.addWednesday = function (val) {

        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "4",
            "LABEL": "Wednesday",
            "VALUE": "4"
        }]
    }
    $scope.addThursday = function (val) {

        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "5",
            "LABEL": "Thursday",
            "VALUE": "5"
        }]
    }
    $scope.addFriday = function (val) {

        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "6",
            "LABEL": "Friday",
            "VALUE": "6"
        }]
    }
    $scope.addSaturday = function (val) {

        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "7",
            "LABEL": "Saturday",
            "VALUE": "7"
        }]
    }
    $scope.addSunday = function (val) {
        $scope.scheduleTemplate.daysOfWeek = [{
            "KEY": "1",
            "LABEL": "SUNDAY",
            "VALUE": "1"
        }]
    }

    $scope.setScheduleStartHour = function (starthour) {
        $scope.scheduleTemplate.hour = [{
            "KEY": starthour.getHours(),
            "LABEL": starthour.getHours(),
            "VALUE": starthour.getHours()
        }];
        $scope.scheduleTemplate.minute=[{
            "KEY": starthour.getMinutes(),
            "LABEL":starthour.getMinutes(),
            "VALUE":starthour.getMinutes()
        }];

    };

    $scope.changedRepeatOption = function (val) {
        switch (val) {
            case "Day":
                $scope.scheduleTemplate.months = [{ "KEY": "Day", "LABEL": "JANUARY" } ];
                break;
            case "First":
                $scope.scheduleTemplate.months = [{ "KEY": "First", "LABEL": "JANUARY" } ];
                break;
            case "Second":
                $scope.scheduleTemplate.months = [{ "KEY": "Second", "LABEL": "JANUARY" } ];
                break;
            case "Third":
                $scope.scheduleTemplate.months = [{ "KEY": "Third", "LABEL": "JANUARY" } ];
                break;
            case "Fourth":
                $scope.scheduleTemplate.months = [{ "KEY": "Fourth", "LABEL": "JANUARY" } ];
                break;
            case "Last":
                $scope.scheduleTemplate.months = [{ "KEY": "Last", "LABEL": "JANUARY" } ];
                break;
            default:
                break;
        }}

    $scope.monthChanged = function (val) {
        switch (val) {
            case 1:
                $scope.scheduleTemplate.months = [{ "KEY": 1, "LABEL": "January", "VALUE": 1 } ];
                break;
            case 2:
                $scope.scheduleTemplate.months = [{ "KEY": 2, "LABEL": "February", "VALUE": 2} ];
                break;
            case 3:
                $scope.scheduleTemplate.months = [{ "KEY": 3, "LABEL": "March", "VALUE":3 } ];
                break;
            case 4:
                $scope.scheduleTemplate.months = [{ "KEY": 4, "LABEL": "April", "VALUE": 4 } ];
                break;
            case 5:
                $scope.scheduleTemplate.months = [{ "KEY": 5, "LABEL": "May", "VALUE": 5 } ];
                break;
            case 6:
                $scope.scheduleTemplate.months = [{ "KEY": 6, "LABEL": "June", "VALUE": 6 } ];
                break;
            case 7:
                $scope.scheduleTemplate.months = [{ "KEY": 7, "LABEL": "July", "VALUE": 7 } ];
                break;
            case 8:
                $scope.scheduleTemplate.months = [{ "KEY":8, "LABEL": "August", "VALUE": 8 } ];
                break;
            case 9:
                $scope.scheduleTemplate.months = [{ "KEY": 9, "LABEL": "September", "VALUE": 9 } ];
                break;
            case 10:
                $scope.scheduleTemplate.months = [{ "KEY": 10, "LABEL": "October", "VALUE": 10 } ];
                break;
            case 11:
                $scope.scheduleTemplate.months = [{ "KEY": 11, "LABEL": "November", "VALUE": 11 } ];
                break;
            case 12:
                $scope.scheduleTemplate.months = [{ "KEY": 12, "LABEL": "December", "VALUE": 12 } ];
                break;
            default:
                break;

        }
    }

    $scope.setDaysOfWeeks = function (day, key, value) {
        if (value) {
            $scope.scheduleTemplate.daysOfWeek.push({ "key": key, "label": day, "value": key })
        }
        else {
            for (var i = 0; i < $scope.scheduleTemplate.daysOfWeek.length; i++) {
                if ($scope.scheduleTemplate.daysOfWeek[i].key == key) {
                    $scope.scheduleTemplate.daysOfWeek.splice(i, 1);
                    break;
                }

            }
        }
    }

});
