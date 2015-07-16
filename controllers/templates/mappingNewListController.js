/*globals app */
app.controller("mappingNewListController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingNewListController");

    // Sdm Fields as Destination

    // data is true false of sdm checkbox
    // index is the index of the mapping record
    function setSdm(data, index) {
        var mapRec = $scope.savedState.mappingRecords[index];

        mapRec.isSdmMapping = data;
        mapRec.mappedSdmFieldId = null;
        mapRec.destName = null;
        mapRec.dataTypeId = null;
        mapRec.size = null;
        mapRec.mappedDestinationOrdinalPos = null;
    }

    // Sdm Fields as Destination

    // data is ordinalPos of selected destination record
    // index is the index of the mapping record
    function setDestination(data, index) {
        var savedState = $scope.savedState;

        wizardService.setMappingRecordToDestinationRecord(data, index);
        savedState.mappingRecords = wizardService.getMappingRecords();

        if (savedState.mappingRecords[index].dataTypeId === 2) {
            savedState.disableFormatSelect = false;
            savedState.mappingRecords[index].size = null;
        } else if (savedState.mappingRecords[index].dataTypeId) {
            savedState.disableFormatSelect = true;
        } else {
            savedState.disableFormatSelect = true;
        }
    }

    // destination records
    function showDestinationRecords(field) {
        var selected
            , destRecord = field
        ;

        if (null !== field) {
            selected = $filter("filter")(
                $scope.savedState.destinationRecords, function (f) {
                    return (f.name === field.toUpperCase());
                }
            );
            destRecord = (selected.length ? selected[0].name : field);
        } else {
            destRecord = "";
        }

        return destRecord;
    }

    // Data Type

    function showDataTypes(field) {
        var selected = [];
        if(field.dataTypeId) {
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

    function resetMappingRecord(index) {
        wizardService.resetMappingRecord(index);
        $scope.savedState.mappingRecords = wizardService.getMappingRecords();
        $scope.savedState.disableFormatSelect = true;
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;

        savedState.destinationRecords = wizardService.generateDestinationRecords();

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
            .matchMappingRecordsToListFields(true)
        ;
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;

    // Function Delegates
    $scope.enableProperties = enableProperties;
    $scope.loadFormats = loadFormats;
    $scope.resetMappingRecord = resetMappingRecord;
    $scope.setDestination = setDestination;
    $scope.setSdm = setSdm;
    $scope.showDataTypes = showDataTypes;
    $scope.showDestinationRecords = showDestinationRecords;
    $scope.showFormats = showFormats;
    $scope.validateDataTypeAfterSave = validateDataTypeAfterSave;
    $scope.validateFieldNameBeforeSave = validateFieldNameBeforeSave;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;
    $scope.validateSizeAfterSave = validateSizeAfterSave;
    $scope.validateSizeBeforeSave = validateSizeBeforeSave;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        //mapping
        $scope.savedState.dataTypes = wizardFactory.getDataTypes();
        $scope.savedState.disableFormatSelect = true;
        $scope.savedState.disableSizeSelect = false;
        delete $scope.savedState.formats;
    });

    $scope.$on("mapping:refreshMappingRecords", function() {
        initViewState();
    });

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingNewListController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingNewListController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingNewListController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
