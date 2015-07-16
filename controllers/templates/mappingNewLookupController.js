/*globals app */
app.controller("mappingNewLookupController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingNewLookupController");

    // Data Type

    function showDataTypes(field) {
        var selected = [];
        if (field.dataTypeId) {
            selected = $filter("filter")(
                $scope.savedState.dataTypes
                , {id: field.dataTypeId}
            );
        }
        return (selected.length ? selected[0].value : "");
    }

    function validateDataTypeAfterSave(data, index) {
        if (data !== 2) {
            $scope.savedState.mappingRecords[index].format = null;
        }
    }

    // Size

    // Format

    function loadFormats() {
        $scope.savedState.formats = wizardFactory.getDateFormats();
    }

    function showFormats(field) {
        var selected = [];
        if (field.format) {
            selected = $filter("filter")(
                $scope.savedState.formats
                , {id: field.format}
            );
        }
        return (selected.length ? selected[0].pattern : "");
    }

    function validateFormatBeforeSave(data) {
        if (!$scope.savedState.disableFormatSelect && (data === null)) {
            return L.errorDateFormatRequired;
        }
    }

    function validateFieldNameBeforeSave(data) {
        return wizardService.validateHeaderOrColumnName(data);
    }

    function validateSizeBeforeSave(data) {
        var regex = /^[0-9]{1,5}$/;
        if (!regex.test(data) && !$scope.savedState.disableSizeSelect) {
            return L.errorDigitsOnly;
        }
    }

    function validateSizeAfterSave(data, index) {
        var savedState = $scope.savedState;

        if (savedState.disableSizeSelect) {
            savedState.mappingRecords[index].size = null;
        } else if (!savedState.disableSizeSelect) {
            savedState.mappingRecords[index].size = data;
        }
    }

    function enableProperties(data, index) {
        var savedState = $scope.savedState;

        if (data === 2) {
            savedState.disableFormatSelect = false;
            savedState.disableSizeSelect = true;
            savedState.mappingRecords[index].size = null;
        } else if (data === 1) {
            savedState.disableFormatSelect = true;
            savedState.disableSizeSelect = false;
        } else {
            savedState.disableFormatSelect = true;
            savedState.disableSizeSelect = true;
            savedState.mappingRecords[index].size = null;
        }
    }

    function resetDestinationFields(index) {
        wizardService.resetMappingRecord(index);
        $scope.savedState.mappingRecords = wizardService.getMappingRecords();
        $scope.savedState.disableFormatSelect = true;
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;

        //mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
        savedState.disableFormatSelect = true;
        savedState.disableSizeSelect = false;
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        // Get a handle to the synchronized mapping records
        $scope.savedState.mappingRecords = wizardService
            .syncMappingRecordsWithTransformOutputs()
            .getMappingRecords()
        ;
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;

    // Function Delegates
    $scope.showDataTypes = showDataTypes;
    $scope.validateDataTypeAfterSave = validateDataTypeAfterSave;
    $scope.loadFormats = loadFormats;
    $scope.showFormats = showFormats;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;
    $scope.validateFieldNameBeforeSave = validateFieldNameBeforeSave;
    $scope.validateSizeBeforeSave = validateSizeBeforeSave;
    $scope.validateSizeAfterSave = validateSizeAfterSave;
    $scope.enableProperties = enableProperties;
    $scope.resetDestinationFields = resetDestinationFields;

    // Event Listeners
    $scope.$on("wizardService:cancelWizard", function() {
        var savedState = $scope.savedState;

        // Mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
        savedState.disableFormatSelect = true;
        savedState.disableSizeSelect = false;
        delete savedState.formats;
    });

    $scope.$on("mapping:refreshMappingRecords", function() {
        $scope.savedState.mappingRecords = wizardService.getMappingRecords();
    });

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingNewLookupController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingNewLookupController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingNewLookupController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
