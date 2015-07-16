/*globals app */
app.controller("mappingExistingListController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingExistingListController");

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

    // destination records

    function showDestinationRecords(field) {
        var selected;

        if (field !== null) {
            selected = $filter("filter")(
                $scope.savedState.destinationRecords
                , function (f) {
                    return (f.name === field.toUpperCase());
                }
            )[0];

            if ((undefined === selected) || (null === selected)) {
                return field;
            } else {
                return (selected.length ? selected[0].name : field);
            }
        } else {
            return "";
        }
    }

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

    // check to ensure the destination field is not already referenced
    function validateDestinationBeforeSave(data, index) {
        var savedState = $scope.savedState
            , mapRecs = savedState.mappingRecords
            , mapCount = mapRecs.length
            , i
        ;

        if (data === null) {
            return L.errorDestFieldRequired;
        }

        for (i = 0; i < mapCount; i++) {
            if (!mapRecs[i].isSdmMapping
                && (mapRecs[i].mappedDestinationOrdinalPos === data)
                && (i !== index)
            ) {
                return L.errorDestFieldInUse;
            }
        }
    }

    // Data Type

    function showSdmFieldDataType(field) {
        var selected = [];
        if (field.dataTypeId) {
            selected = $filter("filter")(
                $scope.savedState.dataTypes
                , {id: field.dataTypeId}
            );
        }
        return (selected.length ? selected[0].value : "");
    }

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

    // Format

    function loadFormats() {
        $scope.savedState.formats = wizardFactory.getDateFormats();
    }

    function showFormats(field) {
        var selected = [];
        if (field.format) {
            selected = $filter("filter")($scope.savedState.formats, {id: field.format});
        }
        return (selected.length ? selected[0].pattern : "");
    }

    function validateFormatBeforeSave(data) {
        if (!$scope.savedState.disableFormatSelect && (data === null)) {
            return L.errorDateFormatRequired;
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

    function validateDataTypeAfterSave(data, index) {
        if (data === null) {
            return L.errorDataTypeRequired;
        } else if (data !== 2) {
            $scope.savedState.mappingRecords[index].format = null;
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
            .matchMappingRecordsToListFields(false)
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
    $scope.showSdmFieldDataType = showSdmFieldDataType;
    $scope.validateDataTypeAfterSave = validateDataTypeAfterSave;
    $scope.validateDestinationBeforeSave = validateDestinationBeforeSave;
    $scope.validateFieldNameBeforeSave = validateFieldNameBeforeSave;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;
    $scope.validateSizeAfterSave = validateSizeAfterSave;
    $scope.validateSizeBeforeSave = validateSizeBeforeSave;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        var savedState = $scope.savedState;

        //mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
        savedState.disableFormatSelect = true;
        savedState.disableSizeSelect = false;
        savedState.formats = undefined;
    });

    $scope.$on("mapping:refreshMappingRecords", function() {
        initViewState();
    });

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingListController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingExistingListController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingListController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
