/**
 * Created by ShantiJohnson on 3/17/2015.
 */
/*globals app */
app.controller("mappingSDMController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingNewExtensionController");

    // Sdm Fields as Destination

    // data is true false of sdm checkbox
    // index is the index of the mapping record
    function setSdm(data, index) {
        var savedState = $scope.savedState
            , mapRec = savedState.mappingRecords[index]
            ;

        mapRec.isSdmMapping = data;
        mapRec.mappedSdmFieldId = null;
        mapRec.destName = null;
        mapRec.dataTypeId = null;
        mapRec.size = null;
        mapRec.mappedDestinationOrdinalPos = null;
    }

    // Sdm Fields as Destination
    function showSdmFields(field) {
        var selected = [];
        if (field.mappedSdmFieldId || (field.mappedSdmFieldId === 0)) {
            selected = $filter("filter")(
                $scope.sdmFields
                , {id: field.mappedSdmFieldId}
            );
        }

        return (selected.length ? selected[0].mapping : "");
    }

    // data is ordinalPos of selected sdmField
    // index is the index of the mapping record
    function setSdmField(data, index) {
        wizardService.setMappingRecordToSdmField(data, index);
        $scope.savedState.mappingRecords = wizardService.getMappingRecords();
        enableProperties(
            $scope.savedState.mappingRecords[index].dataTypeId
            , index
        );
    }

    // all columns must map to the SDM
    function checkSdm() {

        $scope.validSdmMapping = true;
        var savedState = $scope.savedState
            , mapRecs = savedState.mappingRecords
            , mapCount = mapRecs.length
            , i
            ;

        for (i = 0; i < mapCount; i++) {
            if (!mapRecs[i].isSdmMapping && mapRecs[i].destName != null)
            {
                $scope.validSdmMapping = false;
                break;
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

        if(data == null) {
            return "Data type required"
        } else if (data !== 2) {
            $scope.savedState.mappingRecords[index].format = null;
        }
    }

    // Size

    function showSdmFieldSize(field) {
        var selected = [];
        if (field.mappedSdmFieldId || field.mappedSdmFieldId === 0) {
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

    // check to ensure the destination field is not already referenced
    function validateSdmFieldBeforeSave(data, index) {
        var savedState = $scope.savedState
            , mapRecs = savedState.mappingRecords
            , mapCount = mapRecs.length
            , i
            ;

        if (data === null) {
            return L.errorSDMFieldRequired;
        }

        for (i = 0; i < mapCount; i++) {
            if (mapRecs[i].isSdmMapping
                && (mapRecs[i].mappedSdmFieldId === data)
                && (i !== index))
            {
                return L.errorSDMFieldInUse;
            }
        }

        checkSdm();
    }

    function validateFieldNameBeforeSave(data, index) {

        if(wizardService.validateHeaderOrColumnName(data) == undefined) {

            $scope.validSdmMapping = false;

        } else {
            return wizardService.validateHeaderOrColumnName(data);
        }
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

        savedState.mappingRecords[index].isSdmMapping = true;
    }


    function resetMappingRecord(index) {

        if(!$scope.savedState.mappingRecords[index].isKeyColumn) {
            wizardService.resetMappingRecord(index);
            $scope.savedState.mappingRecords = wizardService.getMappingRecords();
            $scope.savedState.disableFormatSelect = true;

            //checkSdm();

            return L.destinationNotMapped;
        }
    }

    function checkNonSDMMappingRecord(index) {

        if(!$scope.savedState.mappingRecords[index].isKeyColumn) {
            wizardService.resetMappingRecord(index);
            $scope.savedState.mappingRecords = wizardService.getMappingRecords();
            $scope.savedState.disableFormatSelect = true;

            checkSdm();

            return L.destinationNotMapped;
        } else {
            return  $scope.savedState.mappingRecords[index].destName;
        }
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState;

        // Mapping
        savedState.dataTypes = wizardFactory.getDataTypes();
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
            .getMappingRecords()
        ;

        checkSdm();
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;

    // Function Delegates
    $scope.enableProperties = enableProperties;
    $scope.loadFormats = loadFormats;
    $scope.resetMappingRecord = resetMappingRecord;
    $scope.checkNonSDMMappingRecord = checkNonSDMMappingRecord;
    $scope.setSdm = setSdm;
    $scope.setSdmField = setSdmField;
    $scope.showDataTypes = showDataTypes;
    $scope.showFormats = showFormats;
    $scope.showSdmFieldDataType = showSdmFieldDataType;
    $scope.showSdmFieldSize = showSdmFieldSize;
    $scope.showSdmFields = showSdmFields;
    $scope.validateDataTypeAfterSave = validateDataTypeAfterSave;
    $scope.validateFieldNameBeforeSave = validateFieldNameBeforeSave;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;
    $scope.validateSdmFieldBeforeSave = validateSdmFieldBeforeSave;
    $scope.validateSizeAfterSave = validateSizeAfterSave;
    $scope.validateSizeBeforeSave = validateSizeBeforeSave;

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
        $scope.savedState.mappingRecords = wizardService
            .matchMappingRecordsToSdmFields()
            .getMappingRecords()
        ;

        checkSdm();
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "validsdmform.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingSDMController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingSDMController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingSDMController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
