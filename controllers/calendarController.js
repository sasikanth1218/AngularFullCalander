app.controller('calendarController', function ($scope, $q, $http, $location, Restangular,$window,$timeout, executionsResource) {

    var date = new Date();
    var deferred = $q.defer();
    var first_day = new Date(date.getFullYear(), date.getMonth(), 1);


    var events = [];

    var calendar;

    var alerts = [
        {}
    ];


    //init for Initialization
    init();

    function init() {
        $scope.events = events;
        $scope.alerts = alerts;

        $scope.calendar = createCalendar;
        createSchedule();
    }
    $scope.localTime = new Date();
    $scope.runTimer = function () {
        $scope.localTime = new Date();
        mytimer = $timeout($scope.runTimer, 1000);
    }
    var mytimer = $timeout($scope.runTimer, 1000);
    function createSchedule($returnedSchedules) {
        var schedules = $returnedSchedules;
        angular.forEach(schedules, function (value, index) {
            var split = value.ref.split("/");
            var current = later.parse.cron(value.cronString);
            var futureEvents = later.schedule(current).next(1000);
            var startDate = new Date(value.startDate);
            var endDate = new Date(value.endDate);
            var lastDate;
            if (value.enabled == 1) {
                angular.forEach(futureEvents, function (timeValue, timeIndex) {
                    var startTime = new Date(timeValue);
                  //  var newstr = startTime.setTime(startTime.getTime() + startTime.getTimezoneOffset() * 60000);
                    var currentStartTime = new Date(startTime);
                    var currdate = new Date(currentStartTime.getFullYear(), currentStartTime.getMonth(), currentStartTime.getDate());
                            if ( lastDate == null || currdate.getTime() > lastDate.getTime()) {
                                lastDate = currentStartTime ;
                                if (currdate <= endDate) {
                            $scope.events.push({
                                allDay: "",
                                title: value.name,
                                id: value.jobId,
                                start: currentStartTime.toLocaleString(),
                                color: "#00B2E4",
                                textColor: "white",
                                url: '#!/jobs/' + split[2]

                            })
                        }}
                })
            }

        });

    }

    function createExecutions($returnedExecutions) {
        var executions = $returnedExecutions;
        angular.forEach(executions, function (value, index) {
            var startTime = new Date(value.start);
           // var newstr = startTime.setTime(startTime.getTime() + startTime.getTimezoneOffset() * 60000);
            var currentStartTime = new Date(startTime);
            var endTime = new Date(value.end);
            //var newstr1 = endTime.setTime(startTime.getTime() + startTime.getTimezoneOffset() * 60000);
            var currentEndTime = new Date(endTime);
            if (value.status == "COMPLETED") {
                $scope.events.push({
                    allDay: "",
                    title: value.executedJob,
                    id: value.executedJobId,
                    start: currentStartTime.toLocaleString(),
                    end: currentEndTime.toLocaleString(),
                    textColor: "white",
                    color: "#3D843F",
                    url: '#!/jobs/' + value.executedJobId + '/executions/' + value.id
                })
            }
            else if (value.status == "FAILED") {
                $scope.events.push({
                    allDay: "",
                    title: value.executedJob,
                    id: value.executedJobId,
                    start: currentStartTime.toLocaleString(),
                    end: currentEndTime.toLocaleString(),
                    textColor: "white",
                    color: "#B8202A",
                    url: '#!/jobs/' + value.executedJobId + '/executions/' + value.id
                })
            }
            else if (value.status == "TIMEOUT") {
                $scope.events.push({
                    allDay: "",
                    title: value.executedJob,
                    id: value.executedJobId,
                    start: currentStartTime.toLocaleString(),
                    end: currentEndTime.toLocaleString(),
                    textColor: "white",
                    color: "#F8971D",
                    url: '#!/jobs/' + value.executedJobId + '/executions/' + value.id
                })
            }
            else if (value.status == "RUNNING") {
                $scope.events.push({
                    allDay: "",
                    title: value.executedJob + " RUNNING...",
                    id: value.executedJobId,
                    start: currentStartTime.toLocaleString(),
                    end: new Date(),
                    color: "#FFC20E",
                    textColor: "white",
                    url: '#!/jobs/' + value.executedJobId + '/executions/' + value.id
                })
            }

        })
    }

    var createCalendar =
        executionsResource.getExecutionEvents().then(function ($returnedExecutions) {
            executionsResource.getExecutionSchedules().then(function ($returnedSchedules) {

                createExecutions($returnedExecutions);
                createSchedule($returnedSchedules);
                $('#calendar').fullCalendar({
                    firstDay: 1,
                    defaultView: 'month',
                    minTime: '12:00am',
                    maxTime: '11:59pm',
                    more: 4,
                    columnFormat: {
                        month: 'ddd',
                        week: 'ddd dd/MM',
                        day: 'dddd M/d'
                    },

                    header: {
                        /* left: 'prev,next today',
                        center: 'title',
                         right: 'month,agendaWeek,agendaDay'*/
                    },
                    editable: true,
                    events: $scope.events,
                    eventMouseover: function (calEvent, jsEvent, view) {
                        savBg = $(this).css("background-color");
                        savClr = $(this).css("color");
                        $(this).css({color: '#B2CDCC', backgroundColor: "#692772"});
                        $("#test").css({color: '#B2CDCC', backgroundColor: "#692772"});
                    },
                    eventMouseout: function (calEvent, jsEvent, view) {
                        $(this).css({color: savClr, backgroundColor: savBg});
                        $("#test").css({color: savClr, backgroundColor: savBg});
                    },
                    eventRender: function (event, element) {
                        var color = event.color;
                        if (color === "#FFC20E") {
                            setInterval(function () {
                                element.fadeOut(700).delay(50).fadeIn(700);
                            }, 3000);
                        }

                    }
                });
            });
        });
});
