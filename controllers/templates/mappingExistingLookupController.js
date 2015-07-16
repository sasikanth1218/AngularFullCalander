/*globals app */
app.controller("mappingExistingLookupController", function (
    $scope
    , $filter
    , l10nFactory
    , wizardFactory
    , wizardService
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("mappingExistingLookupController");

    // Destination Records

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
        var mapRecs = $scope.savedState.mappingRecords
            , recCount = mapRecs.length
            , i
        ;

        for (i = 0; i < recCount; i++) {
            if ((mapRecs[i].mappedDestinationOrdinalPos === data)
                && (i !== index)
            ) {
                return L.errorDestFieldInUse;
            }
        }
    }

    // Data Type

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

    // Format

    function loadFormats(index) {
        var savedState = $scope.savedState;

        savedState.formats = wizardFactory.getDateFormats();

        if (savedState.mappingRecords[index].dataTypeId === 2) {
            savedState.disableFormatSelect = false;
            savedState.mappingRecords[index].size = null;
        } else if (savedState.mappingRecords[index].dataTypeId) {
            savedState.disableFormatSelect = true;
        } else {
            savedState.disableFormatSelect = true;
        }
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

        savedState.destinationRecords =
            wizardService.generateDestinationRecords();

        // Mapping
        savedState.disableFormatSelect = true;
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        // Get a handle to the synchronized mapping records
        $scope.savedState.mappingRecords = wizardService
            .syncMappingRecordsWithTransformOutputs()
            .matchMappingRecordsToDestination()
            .getMappingRecords()
        ;
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;

    // Function Delegates
    $scope.loadFormats = loadFormats;
    $scope.resetDestinationFields = resetDestinationFields;
    $scope.setDestination = setDestination;
    $scope.showDestinationDataType = showDestinationDataType;
    $scope.showDestinationRecords = showDestinationRecords;
    $scope.showFormats = showFormats;
    $scope.validateDestinationBeforeSave = validateDestinationBeforeSave;
    $scope.validateFormatBeforeSave = validateFormatBeforeSave;

    // Event Listeners

    $scope.$on("wizardService:cancelWizard", function() {
        //mapping
        $scope.savedState.disableFormatSelect = true;
        delete $scope.savedState.formats;
    });

    $scope.$on("mapping:refreshMappingRecords", function() {
        $scope.savedState.destinationRecords = wizardService.generateDestinationRecords();
        $scope.savedState.mappingRecords = wizardService
            .matchMappingRecordsToDestination()
            .getMappingRecords()
        ;
    });

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingLookupController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController.mappingExistingLookupController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController.mappingExistingLookupController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
