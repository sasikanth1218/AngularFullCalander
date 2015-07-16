/**
 * Created by shantijohnson on 1/15/2015.
 */

app.controller("customJobController", function (

    $scope
    , Restangular
    , $route
    , $location
    , $sce
    , jobsResource
    , feedsResource
    , $upload
    , usSpinnerService
    , scheduleService
    , l10nFactory
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("customJobController");

    // Maximum allowed byte size of an upload file
    var MAXIMUM_UPLOAD_FILE_SIZE = 100000000;

    var jobTypes = [
        {   name: "Job",
             description: "A custom job type that specifies the entry point is a Pentaho Kettle job",
             type: "JOB"
        }
        , { name: "Transform",
            description: "A custom job type that specifies the entry point is a Pentaho Kettle transformation",
            type: "TRANSFORM"
        }
    ];

    var scheduleTemplate = {path: "app/partials/templates/schedule.html"};

    function startSpin(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    }

    function stopSpin(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    }

    function closeAlert(index) {
        $scope.alerts.splice(index, 1);
    }

    function cancel() {
        //$modalInstance.dismiss("cancel");
        $location.path("jobs");
        scheduleService.clearSchedule();
        scheduleService.setActive(false);
        scheduleService.setValid(false);
        $route.reload();
    }

    function onFileSelect($files) {
        var i, file;

        function postSuccess($object) {
            $scope.enableProgess = true;

            // Upload File
            $scope.upload = $upload.upload({
                url: Restangular.one("feeds", $object.id).one("upload").getRestangularUrl()
                , headers: {
                    Authorization: Restangular.defaultHeaders.Authorization
                    , "X-Requested-By": null
                }
                , file: file
            }).progress(function(evt) {
                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
            }).success(function() {
                $scope.fileFeed = feedsResource.getFeed($object.id).$object;
                $scope.jobConfig.modules[0].feeds[0].attributes[0].value = $object.id;
            });
        }

        function postFailure() {
            $scope.alerts.push({
                type: "danger"
                , msg: L.jobPostFailureAlert
            });
        }

        for (i = 0; i < $files.length; i++) {
            file = $files[i];

            // Restrict the maximum upload file size
            if (file.size > MAXIMUM_UPLOAD_FILE_SIZE) {
                $scope.alerts.push({
                    type: "danger"
                    , msg: l10nFactory.interpolateString(
                        L.fileSizeLimitExceeded
                        , MAXIMUM_UPLOAD_FILE_SIZE
                    )
                });
                return;
            }

            $scope.selectedFile = file;

            // The file must be a ZIP archive
            if ( ("application/zip" !== file.type.toLocaleLowerCase())
                && ("application/x-zip-compressed" !== file.type.toLocaleLowerCase())
                && (!file.name.search(new RegExp("\\..zip$", "i")))
            ) {
                $scope.selectedFile = null;
                $scope.alerts.push({
                    type: "danger"
                    , msg: L.requiresZip
                });
            } else {
                feedsResource.postFeed($scope.feedConfig)
                    .then(postSuccess, postFailure)
                ;
            }
        }
    }

    function createJob() {
        $scope.jobConfig.databaseTableConfig = null;

        if (scheduleService.isActive()) {
            try {
                $scope.jobConfig.scheduleConfig = scheduleService.buildScheduleConfig();
            }
            catch(err) {
                $scope.alerts.push({type: "danger", msg: "[400] " + err.message});
            }
        } else {
            $scope.jobConfig.scheduleConfig = null;
        }

        $scope.alerts.push({
            type: "info"
            , msg: l10nFactory.interpolateString(
                L.jobSubmitted
                , $scope.jobConfig.name
            )
        });
        startSpin("spinner-custom");
        jobsResource.postJob($scope.jobConfig).then(function($object) {
            $scope.alerts = [];
            stopSpin("spinner-custom");
            $scope.alerts.push({
                type: "success"
                , msg: l10nFactory.interpolateString(
                    L.jobCreated
                    , $object.name
                    , $object.id
                )
            });
            $scope.hideClose = false;
        }, function(httpResponse) {
            $scope.alerts = [];
            stopSpin("spinner-custom");
            $scope.alerts.push({
                type: "danger"
                , msg: l10nFactory.interpolateString(
                    L.jobCreationFailed
                    , httpResponse.data
                )
            });
        });
    }

    function setScheduleActive() {
        $scope.showSchedule.isActive = !$scope.showSchedule.isActive;
        scheduleService.setActive(true);
        scheduleService.mode(scheduleService.getModes().RECURRING);
    }

    // Initialize the view's scope
    (function init() {
        // Extend the localization object to the view
        // Localized view text
        $scope.L = L;
        $scope.to_trusted = function(sampleTeaser) {
            return $scope.sampleTeaser = $sce.trustAsHtml(
                l10nFactory.interpolateString(
                    L.sampleTeaser
                    , "assets/README.cdi-custom-samples-v1.md"
                    , "assets/cdi-custom-samples-v1.zip"
                ));
        }
        $scope.to_trusted1 = function(zipNotice) {
            return $scope.zipNotice = $sce.trustAsHtml(L.zipNotice);}

        $scope.to_trusted2 = function(advancedFrameworkTeaser) {
            return $scope.advancedFrameworkTeaser = $sce.trustAsHtml(
                l10nFactory.interpolateString(
                    L.advancedFrameworkTeaser
                    , "assets/cdi-bootstrapped-0.1.4.zip"
                ));
        }


        $scope.alerts =  [];
        $scope.isHidden = true;
        $scope.isCollapsed = false;
        $scope.jobConfig = jobsResource.getJobsResource().customGET("config", {type: "CUSTOM"}).$object;
        $scope.feedConfig = feedsResource.getFeedsResource().customGET("config", {type: "CUSTOM_JOB_CONTAINER"}).$object;
        $scope.jobTypes = jobTypes;
        $scope.hideClose = true;

        $scope.showSchedule = {
            isActive: false
        };
        $scope.isScheduleValid = false;
        $scope.collapseScheduleDiv = true;

        $scope.scheduleTemplate = scheduleTemplate;

        scheduleService.clearSchedule();
        scheduleService.setActive(false);
        scheduleService.setValid(false);

        // Function delegates
        $scope.cancel = cancel;
        $scope.closeAlert = closeAlert;
        $scope.onFileSelect = onFileSelect;
        $scope.createJob = createJob;
        $scope.setScheduleActive = setScheduleActive;
        $scope.interpolate = l10nFactory.interpolateString;

        // Event subscriptions
        $scope.$on("scheduleService:valid", function(event, data) {
            $scope.isScheduleValid = data;
        });
    })();
});

