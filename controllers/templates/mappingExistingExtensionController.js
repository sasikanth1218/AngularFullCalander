/* globals app */
app.controller("mappingExistingExtensionController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingExistingExtensionController");

    // Sdm Fields as Destination

    // data is true false of sdm checkbox
    // index is the index of the mapping record
    function setSdm(data, index) {
        var mapRecord = $scope.savedState.mappingRecords[index];
        mapRecord.isSdmMapping = data;
        mapRecord.mappedSdmFieldId = null;
        mapRecord.destName = null;
        mapRecord.dataTypeId = null;
        mapRecord.size = null;
        mapRecord.mappedDestinationOrdinalPos = null;
    }

    // Sdm Fields as Destination

    function showSdmFields(field) {
        var showFields = false;

        if (field.isKeyColumn) {
            showFields = (field.destName ? field.destName : "");
        } else {
            var selected = [];
            if (field.mappedSdmFieldId || (field.mappedSdmFieldId === 0)) {
                selected = $filter("filter")(
                    $scope.sdmFields
                    , {id: field.mappedSdmFieldId}
                );
            }
            showFields = (selected.length ? selected[0].mapping : "");
        }

        return showFields;
    }

    // data is ordinalPos of selected sdmField
    // index is the index of the mapping record
    function setSdmField(data, index) {
        var savedState = $scope.savedState;

        wizardService.setMappingRecordToSdmField(data, index);
        savedState.mappingRecords = wizardService.getMappingRecords();
        enableProperties(savedState.mappingRecords[index].dataTypeId, index);
    }

    // check to ensure the destination field is not already referenced
    function validateSdmFieldBeforeSave(data, index) {
        var mapRecs = $scope.savedState.mappingRecords
            , recCount = mapRecs.length
            , i
        ;

        if (data === null) {
            return L.errorSDMFieldRequired;
        }

        for (i = 0; i < recCount; i++) {
            if (mapRecs[i].isSdmMapping
                && (mapRecs[i].mappedSdmFieldId === data)
                && (i !== index)
            ) {
                return L.errorSDMFieldInUse;
            }
        }
    }

    // destination records

    function showDestinationRecords(field) {
        var selected = [];
        if (field.mappedDestinationOrdinalPos
            || (field.mappedDestinationOrdinalPos === 0)
        ) {
            selected = $filter("filter")(
                $scope.savedState.destinationRecords
                , {ordinalPos: field.mappedDestinationOrdinalPos}
            );
        }
        return (selected.length ? selected[0].name : "");
    }

    function setDestination(data, index) {
        var savedState = $scope.savedState;

        // data is ordinalPos of selected destination record
        // index is the index of the mapping record
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
        var mapRecs = $scope.savedState.mappingRecords
            , recCount = mapRecs.length
            , i
        ;

        if (data === null) {
            return L.errorDestFieldRequired;
        }

        for (i = 0; i < recCount; i++) {
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
        if (field.mappedSdmFieldId || (field.mappedSdmFieldId === 0)) {
            selected = $filter("filter")(
                $scope.sdmFields
                , {id: field.mappedSdmFieldId}
            );
        }
        return (selected.length ? selected[0].dataType : "");
    }

    function showDestinationDataType(field) {
        var selected = [];
        if (field.mappedDestinationOrdinalPos
            || (field.mappedDestinationOrdinalPos === 0)
        ) {
            selected = $filter("filter")(
                $scope.savedState.destinationRecords
                , {ordinalPos: field.mappedDestinationOrdinalPos}
            );
        }
        return (selected.length ? selected[0].dataType : "");
    }

    // Size

    function showSdmFieldSize(field) {
        var selected = [];
        if (field.mappedSdmFieldId || (field.mappedSdmFieldId === 0)) {
            selected = $filter("filter")(
                $scope.sdmFields
                , {id: field.mappedSdmFieldId}
            );
        }
        return (selected.length ? Math.ceil(selected[0].size / 3) : "");
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

    function resetMappingRecord(index) {
        var savedState = $scope.savedState;

        wizardService.resetMappingRecord(index);
        savedState.mappingRecords = wizardService.getMappingRecords();
        savedState.disableFormatSelect = true;
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

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;

        savedState.destinationRecords =
            wizardService.generateDestinationRecords();

        //mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
        savedState.showDestFieldsSelect = true;
        savedState.disableFormatSelect = true;
        savedState.disableSizeSelect = false;
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        // The SDM fields are defined in the parent scope by an outer controller
        $scope.sdmFields = $scope.$parent.savedState.sdmFields;

        // Get a handle to the synchronized mapping records
        $scope.savedState.mappingRecords = wizardService
            .syncMappingRecordsWithTransformOutputs()
            .matchMappingRecordsToSdmFields()
            .matchMappingRecordsToDestination()
            .getMappingRecords()
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
    $scope.setSdmField = setSdmField;
    $scope.showDestinationDataType = showDestinationDataType;
    $scope.showDestinationRecords = showDestinationRecords;
    $scope.showFormats = showFormats;
    $scope.showSdmFieldDataType = showSdmFieldDataType;
    $scope.showSdmFieldSize = showSdmFieldSize;
    $scope.showSdmFields = showSdmFields;
    $scope.validateDestinationBeforeSave = validateDestinationBeforeSave;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;
    $scope.validateSdmFieldBeforeSave = validateSdmFieldBeforeSave;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        var savedState = $scope.savedState;

        //mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
        savedState.showDestFieldsSelect = true;
        savedState.disableFormatSelect = true;
        savedState.disableSizeSelect = false;
        delete savedState.formats;
    });

    $scope.$on("mapping:refreshMappingRecords", function() {
        var savedState = $scope.savedState;

        savedState.mappingRecords = wizardService
            .matchMappingRecordsToSdmFields()
            .getMappingRecords()
        ;
    });

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingExtensionController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingExistingExtensionController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingExtensionController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
