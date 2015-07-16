/*globals app */
app.controller("wizardStep5ReviewController", function (
    $scope
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Import parent functions
    var isBlocking = $scope.$parent.isBlocking
        , addBlocker = $scope.$parent.addBlocker
        , removeBlocker = $scope.$parent.removeBlocker
        , addAlert = $scope.$parent.addAlert
    ;

    // Localized view text
    var L = l10nFactory.getStrings("wizardStep5ReviewController");

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;

    // Function Delegates
    $scope.isBlocking = isBlocking;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        $scope.jobConfig = null;
    });

    // This page is stateless, so just refresh its view
    addBlocker();
    try {
        $scope.jobConfig =
            wizardService.buildJobConfig($scope.jobConfigTemplate);

        $scope.jobConfigJsonFormat = JSON.stringify($scope.jobConfig, null, 2);

        $scope.moduleMap = wizardFactory.extractModuleMap($scope.jobConfig);
        $scope.$parent.setJobConfig($scope.jobConfig);
        $scope.enableCreate = true;

        // configure review data elements not found in jobConfig
        configureDisplayElements()

    } catch (err) {
        $scope.enableCreate = false;
        addAlert(err);
        console.log(err);
    } finally {
        removeBlocker();
    }

    function configureDisplayElements() {

        try {
            $scope.mappingType = wizardService.getMapSelectedMappingType().name;
            $scope.mappingDest = wizardService.getMapSelectedMappableObject().name;
            $scope.loadType = titleCase(wizardService.getMappingLoadType());
            $scope.mappingBehavior = titleCase(wizardService.getMappingBehaviour());

            // display the radio selection to the UI review page
            if ($scope.loadType.toUpperCase() === "UPSERT") {
                $scope.loadType = "Append";
            }

            // display the radio selection to the UI review page
            if ($scope.mappingDest.toUpperCase() === "LIST") {
                if (wizardService.getMapSelectedMappableObject().listProps != null) {
                    $scope.mappingDest = wizardService.getMapSelectedMappableObject().listProps.displayName;
                } else {
                    $scope.mappingDest = $scope.jobConfig.listElementConfig.name;
                }
            }
        }   catch (err) {
            console.log(err);
        }
    }

    function titleCase(value) {
        return value.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() });
    }

    // Hook the enabled state of the Create button to this view's form validity
    $scope.$watch(
        "wizardJobFormStep5.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    //endregion
});
