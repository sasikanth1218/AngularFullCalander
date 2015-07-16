/*globals app */
app.controller("wizardStep3DefineController", function (
    $scope
    , usSpinnerService
    , l10nFactory
    , wizardFactory
    , wizardService
    , feedsResource
) {
    "use strict";

    // Import parent functions
    var isBlocking = $scope.$parent.isBlocking
        , addBlocker = $scope.$parent.addBlocker
        , removeBlocker = $scope.$parent.removeBlocker
        , addAlert = $scope.$parent.addAlert
        , addHTTPAlert = $scope.$parent.addHTTPAlert
    ;

    // Localized view text
    var L = l10nFactory.getStrings("wizardStep3DefineController");

    function preview(id) {
        var pgpKeyID = $scope.jobConfigTemplate.pgpKeyID;

        if ((id === null) || (id === undefined)) {
            addAlert(L.errorNoDataFeed, "danger");
        } else {
            addBlocker();

            feedsResource.getFeedPreview(id, pgpKeyID)
                .then(function($object) {
                    var recordSet;

                    wizardService.setPreviewRecords($object);
                    try {
                        recordSet = wizardService.getRecordSet($object);
                        wizardService.setHeaderRecord(recordSet[0]);
                        $scope.headerRecord = wizardService.getHeaderRecord();
                        wizardService.setRecords(recordSet[1]);
                        $scope.records = wizardService.getRecords();
                    } catch (ex) {
                        addAlert(ex, "danger");
                    }
                }, function(response) {
                    addHTTPAlert(response);
                })
                .finally(function() {
                    removeBlocker();
                })
            ;
        }
    }

    function refreshPreview() {
        var recordSet;

        addBlocker();
        try {
            recordSet = wizardService.getRecordSet(wizardService.getPreviewRecords());
            recordSet[0].forEach(function(entry) {
                entry.name = entry.name.replace(/ +/g, "");
                entry.name = entry.name.slice(0,30);
            });
            wizardService.setHeaderRecord(recordSet[0]);
            $scope.headerRecord = wizardService.getHeaderRecord();
            wizardService.setRecords(recordSet[1]);
            $scope.records = wizardService.getRecords();
        } catch (ex) {
            addAlert(ex, "danger");
        } finally {
            removeBlocker();
        }
    }

    function setHeader() {
        wizardService.setHeader($scope.hasHeader);
        refreshPreview();
    }

    function resetValidationType() {
        var valMod = $scope.jobConfigTemplate.validationModule;

        valMod.validationAmount = null;
        valMod.validationRangeLower = null;
        valMod.validationRangeUpper = null;
        valMod.abort = null;
        valMod.notifyLevelAbove = null;
        valMod.notifyLevelBelow = null;
        valMod.notifyOnAbort = null;
    }

    function setDelimiter(delimiter) {
        $scope.savedState.delimiter = delimiter;
        wizardService.setDelimiter(delimiter);
        refreshPreview();
    }

    function setFreeFormDelimiter(delimiterFreeForm) {
        wizardService.setFreeFormDelimiter(delimiterFreeForm);
        wizardService.setIsFreeFormDelimiter(true);
        refreshPreview();
    }

    function resetDelimiter(manualDelimiterCheckbox) {
        if (manualDelimiterCheckbox) {
            $scope.savedState.delimiter = null;
            wizardService.resetDelimiter();
            wizardService.setIsFreeFormDelimiter(true);
        } else {
            $scope.savedState.delimiter = wizardFactory.getDelimiters()[0];
            wizardService.setIsFreeFormDelimiter(false);
        }
    }

    function setTextQualifier(textQualifier) {
        $scope.savedState.textQualifier = textQualifier;
        wizardService.setQualifier(textQualifier);
        refreshPreview();
    }

    function setRowTerminator(rowTerminator) {
        $scope.savedState.rowTerminator = rowTerminator;
        wizardService.setTerminator(rowTerminator);
    }

    function validateHeaderNameBeforeSave(data) {
        return wizardService.validateHeaderOrColumnName(data);
    }

    function setHeaderRecordAfterSave() {
        wizardService.setHeaderRecord($scope.headerRecord);
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;
        savedState.delimiters = wizardFactory.getDelimiters();
        savedState.validationTypes = wizardFactory.getValidationTypes();
        savedState.textQualifiers = wizardFactory.getTextQualifiers();
        savedState.rowTerminators = wizardFactory.getRowTerminators();
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        var savedState = $scope.savedState;
        $scope.hasHeader = wizardService.getHeader();

        // set the validation type to none
        if ($scope.jobConfigTemplate.validationModule.validationType === null) {
            $scope.defaultValidType = wizardFactory.getValidationTypes()[0];
        } else {
            $scope.defaultValidType = $scope.jobConfigTemplate.validationModule.validationType;
        }

        //$scope.jobConfigTemplate.validationModule.validationType = wizardFactory.getValidationTypes()[0];
        //$scope.selected = { jobValidationType: $scope.validationTypes[0] };

        // Field delimiter
        savedState.delimiter =
            jQuery.isEmptyObject(wizardService.getDelimiter())
                ? savedState.delimiters[0]
                : wizardService.getDelimiter()
        ;
        if (wizardService.isFreeFormDelimiter()) {
            $scope.manualDelimiterCheckbox = true;
            $scope.delimiterFreeForm =
                jQuery.isEmptyObject(wizardService.getFreeFormDelimiter())
                    ? wizardFactory.getFreeFormDelimiter()
                    : wizardService.getFreeFormDelimiter()
            ;
            wizardService.setFreeFormDelimiter($scope.delimiterFreeForm);
        } else {
            $scope.manualDelimiterCheckbox = false;
            wizardService.setDelimiter(savedState.delimiter);
        }

        // Text qualifier
        savedState.textQualifier =
            jQuery.isEmptyObject(wizardService.getQualifier())
                ? savedState.textQualifiers[0]
                : wizardService.getQualifier()
        ;
        wizardService.setQualifier(savedState.textQualifier);

        // Row terminator
        savedState.rowTerminator =
            jQuery.isEmptyObject(wizardService.getTerminator())
                ? savedState.rowTerminators[0]
                : wizardService.getTerminator()
        ;
        wizardService.setTerminator(savedState.rowTerminator);

        if (jQuery.isEmptyObject(wizardService.getPreviewRecords())) {
            preview(wizardService.getFeed().id);
        }  else {
            $scope.headerRecord = wizardService.getHeaderRecord();
            $scope.records = wizardService.getRecords();
        }
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;

    // Function Delegates
    $scope.isBlocking = isBlocking;
    $scope.resetDelimiter = resetDelimiter;
    $scope.resetValidationType = resetValidationType;
    $scope.setDelimiter = setDelimiter;
    $scope.setFreeFormDelimiter = setFreeFormDelimiter;
    $scope.setHeader = setHeader;
    $scope.setHeaderRecordAfterSave = setHeaderRecordAfterSave;
    $scope.setRowTerminator = setRowTerminator;
    $scope.setTextQualifier = setTextQualifier;
    $scope.validateHeaderNameBeforeSave = validateHeaderNameBeforeSave;

    // Event Listeners
    $scope.$on("wizardService:cancelWizard", function() {
        $scope.hasHeader = false;
        $scope.savedState.delimiter = undefined;

        //$scope.validationTypes = undefined;
        //$scope.rejectthreshold = undefined;
        //$scope.rejectValidationType = undefined;
        //$scope.fileValidationType = undefined;

        $scope.delimiterFreeForm = undefined;
        $scope.savedState.textQualifier = undefined;
        $scope.savedState.rowTerminator = undefined;
        $scope.records = undefined;
        $scope.ordered_columns = undefined;
        wizardService.setFreeFormDelimiter(undefined);
        wizardService.setDelimiter(undefined);
        wizardService.setQualifier(undefined);
        wizardService.setTerminator(undefined);
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardJobFormStep3Options.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep3DefineController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep3DefineController = {};
        $scope.savedState = wizardService.viewStates.wizardStep3DefineController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
