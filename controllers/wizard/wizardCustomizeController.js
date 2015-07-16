/**
 * Created by shantijohnson on 12/24/2014.
 */

/*globals app */
app.controller("wizardCustomizeController", function (
    $scope
    , $timeout
    , l10nFactory
    , wizardFactory
    , wizardService
    , jobsResource
    , scheduleService
    , cdmResource
    , connectionsResource
) {
    "use strict";

    // Import parent functions
    var isBlocking = $scope.$parent.isBlocking
        , addBlocker = $scope.$parent.addBlocker
        , removeBlocker = $scope.$parent.removeBlocker
        , addHTTPAlert = $scope.$parent.addHTTPAlert
    ;

    $scope.notficationsRequired = checkNotifications();

    function applyEmailValidation(emailControl, inValidEmailListResult) {
        emailControl.$setValidity("dirEmailListCheck", !inValidEmailListResult);
        emailControl.$error.dirEmailListCheck = inValidEmailListResult;
    }

    function confirmValidation(checked, emailList) {
        applyEmailValidation(
            $scope.wizardJobFormCustomize.successEmail
            , (checked
                ? inValidEmailList(emailList)
                : false
            )
        );
    }

    function confirmValidationFail(checked, emailList) {
        applyEmailValidation(
            $scope.wizardJobFormCustomize.failureEmail
            , (checked
                ? inValidEmailList(emailList)
                : false
            )
        );
    }

    function inValidEmailList(emailList) {
        var result = false
            , reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
            , emailListArray
        ;

        if(emailList !== null) {
            emailListArray = emailList.split(";");
            emailListArray.every(function (email) {
                if (!reg.test(email.trim())) {
                    result = true;
                    return false;
                }
                return true;
            });
        }

        return result;
    }

    function checkNotifications() {

        if($scope.jobConfigTemplate.validationModule.notifyLevelAbove == true) {
            return true;
        } else if($scope.jobConfigTemplate.validationModule.notifyLevelBelow == true) {
            return true;
        } else if($scope.jobConfigTemplate.validationModule.notifyOnAbort == true) {
            return true;
        } else {
            return false;
        }

    }

    //function checkCdmApiConnections() {
    //
    //    var result = false;
    //
    //    connectionsResource.getConnectionResourceTypeResource2("CDMAPI").get()
    //        .then(function(response) {
    //            var responseResult = response;
    //            result = true;
    //        } , function(response) {
    //            addHTTPAlert(response);
    //        }).finally(function() {
    //
    //        })
    //    ;
    //
    //    return result;
    //}

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;

        $scope.disableCampaignList = true;

        //var result = checkCdmApiConnections();

        addBlocker();
        cdmResource.getCdmCampaigns().then(
            function(response) {
                var campaignsFull = response[0].content.campaign
                    , tempCampaigns = []
                ;

                if (campaignsFull != null) {
                    $scope.disableCampaignList = false;

                    if(jQuery.isArray(campaignsFull)) {
                        angular.forEach(campaignsFull, function (value) {
                            tempCampaigns.push({
                                "id": value.id
                                , "name": value.name
                            });
                        });
                    } else {
                        tempCampaigns.push({
                            "id": campaignsFull.id
                            , "name": campaignsFull.name
                        });
                    }

                    savedState.cdmCampaigns = tempCampaigns;
                } else {
                    savedState.cdmCampaigns = null;
                }
            }, function(response) {
                checkCdmResponse(response);
                //addHTTPAlert(response);
            }).finally(function() {
                removeBlocker();
            })
        ;

        if ($scope.jobConfigTemplate.successEmail !== null) {
            savedState.successNotifications = true;
        }

        if ($scope.jobConfigTemplate.failureEmail !== null) {
            savedState.failureNotifications = true;
        }
    }

    function checkCdmResponse(response) {
        try {
            if (response.status != 200) {
                window.console.log(response);
            }
        } catch(err) {
            window.console.log(response);
            window.console.log(err);
        }
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {}

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = l10nFactory.getStrings("wizardCustomizeController");

    // Function Delegates
    $scope.confirmValidation = confirmValidation;
    $scope.confirmValidationFail = confirmValidationFail;
    $scope.isBlocking = isBlocking;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        $scope.savedState.successNotifications = false;
        $scope.savedState.failureNotifications = false;
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardJobFormCustomize.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardCustomizeController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardCustomizeController = {};
        $scope.savedState = wizardService.viewStates.wizardCustomizeController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
