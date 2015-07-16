/*globals app */

/**
 * Defines a controller for the Jobs > Create > Transform step.
 */
app.controller("wizardTransformStepController", function (
    $scope
    , functionsResource
    , wizardService
    , usSpinnerService
    , l10nFactory
) {
    "use strict";

    // Import parent functions
    var isBlocking = $scope.$parent.isBlocking
        , addBlocker = $scope.$parent.addBlocker
        , removeBlocker = $scope.$parent.removeBlocker
        , addHTTPAlert = $scope.$parent.addHTTPAlert
    ;

    // Localized view text
    var L = l10nFactory.getStrings("wizardTransformStepController");

    //region Functions

    /**
     * Automatically applies data transformation functions that are marked as
     * such.
     */
    function autoApplyFunctions() {
        var fnList = $scope.savedState.functionList
            , fnCount = fnList.length
            , fnIndex
            , fn
            , mapList = $scope.savedState.mappingRecords
            , mapCount = mapList.length
            , transformRules = $scope.transformRules
            , ruleIndex
            , transformRule
            , ruleInputs
            , inCount
            , inIndex
            , hasMatch
        ;

        // Do not repeatedly perform auto-mapping when the user is merely
        // bouncing between wizard steps.
        if ($scope.savedState.hasAutoMapped) {
            return;
        }

        // It cannot be predicted whether the mapping columns or the functions
        // end-points will respond first, or in any predictable order, so each
        // of them calls this function, which runs only when both have loaded.
        if (fnCount && mapCount) {
            $scope.savedState.hasAutoMapped = true;
            addBlocker();

            // Keep the automatic function application order consistent
            fnList.sort(sortFunctionNames);

            for (fnIndex = 0; fnIndex < fnCount; fnIndex++) {
                fn = fnList[fnIndex];
                if (fn.automaticMap) {
                    addNewTransformationRule();

                    // Simulate selecting the automatic function
                    ruleIndex = transformRules.length - 1;
                    transformRule = transformRules[ruleIndex];
                    transformRule.functionID = fn.id;

                    // Simulate a user event to redraw the view
                    onRuleSelectionEvent({
                        $index: ruleIndex
                        , transformRule: transformRule
                    });

                    // Delete the function if it couldn't match any fields
                    ruleInputs = transformRule.inputs;
                    inCount = ruleInputs.length;
                    hasMatch = false;
                    for (inIndex = 0; inIndex < inCount; inIndex++) {
                        if (null !== ruleInputs[inIndex].mappingRecordOrdinalPos) {
                            hasMatch = true;
                        }
                    }
                    if (!hasMatch) {
                        removeTransformationRule(ruleIndex);
                    }
                }
            }

            removeBlocker();
        }
    }

    /**
     * Loads the collection of data transformation functions from the server.
     */
    function reloadFunctionList() {
        var savedState = $scope.savedState;
        savedState.defaultFunctionSelection = L.functionListLoading;
        savedState.functionList = [];

        addBlocker();
        functionsResource.getList().then(
            function (resultSet) {
                if (resultSet.length) {
                    resultSet.sort(function (l, r) {
                        return l.name.localeCompare(r.name);
                    });

                    savedState.defaultFunctionSelection = L.selectFunction;
                } else {
                    savedState.defaultFunctionSelection = L.createFunction;
                }

                savedState.functionList = resultSet;
                $scope.savedState.overwritingFunctions = getOverwritingFunctions();
                rebuildFunctionIDMap();
                autoApplyFunctions();
            }
            , function (httpResult) {
                $scope.defaultChainJobSelection = L.noFunctionsAvailable;
                addHTTPAlert(httpResult);
            }
        ).then(
            function () {
                removeBlocker();
            }
        );
    }

    /**
     * Loads the collection of input fields for the current feed.
     * Reloads mapping records
     */
    function reloadMappingRecords() {
        addBlocker();
        wizardService.generateMappingRecords();
        $scope.savedState.mappingRecords = wizardService.getMappingRecords();
        $scope.savedState.headerRecord = wizardService.getHeaderRecord();
        rebuildMappingRecordsMap();
        autoApplyFunctions();
        removeBlocker();
    }

    /**
     * Adds a new data transformation rule.
     */
    function addNewTransformationRule() {
        $scope.transformRules.push({
            functionID: null
            , inputs: []
            , outputs: []
        });
        $scope.savedState.viewDriver.push({
            inputCollapsed: false
            , outputCollapsed: false
            , inputs: []
            , outputs: []
            , mappableFields: []
        });
        rebuildSelectableFunctions();
    }

    /**
     * Removes a specific data transformation rule.
     *
     * @param ruleIndex {number} Index of the rule to remove
     */
    function removeTransformationRule(ruleIndex) {
        $scope.transformRules.splice(ruleIndex, 1);
        $scope.savedState.viewDriver.splice(ruleIndex, 1);
        rebuildSelectableFunctions();
        rebuildMappableFields();
    }

    /**
     * Gets a list of transformation functions for which all inputs are
     * overwritten by the transformed output.
     *
     * @returns {Array}
     */
    function getOverwritingFunctions() {
        var fnList = $scope.savedState.functionList
            , fnCount = fnList.length
            , fnIndex
            , fn
            , muList = []
            , overwritesAllInputs
            , fnAttrs
            , fnAttrCount
            , i
            , inspectAttr
        ;

        for (fnIndex = 0; fnIndex < fnCount; fnIndex++) {
            fn = fnList[fnIndex];
            overwritesAllInputs = true;
            fnAttrs = fn.functionAttributes;
            fnAttrCount = fnAttrs.length;

            for (i = 0; i < fnAttrCount; i++) {
                inspectAttr = fnAttrs[i];
                if (("INPUTPARAMETER" === inspectAttr.key)
                    && (!inspectAttr.overwriteSource)
                ) {
                    overwritesAllInputs = false;
                    break;
                }
            }

            if (overwritesAllInputs) {
                muList.push(fn);
            }
        }

        return muList;
    }

    /**
     * Gets a list of all functions that have yet to be applied.
     *
     * @returns {Array}
     */
    function getUnusedFunctions() {
        var ruleSet = $scope.transformRules
            , fnList = $scope.savedState.functionList
            , fnMap = $scope.savedState.functionMap
            , allFnIDs = fnList.map(function (o) { return o.id; })
            , usedFnIDs = ruleSet.map(function (o) { return o.functionID; })
            , unusedFnIDs = allFnIDs.filter(function (e) {
                return (-1 === usedFnIDs.indexOf(e));
            })
            , unusedCount = unusedFnIDs.length
            , unusedIndex
            , unusedFns = []
        ;

        for (unusedIndex = 0; unusedIndex < unusedCount; unusedIndex++) {
            unusedFns.push(fnMap[unusedFnIDs[unusedIndex]]);
        }

        return unusedFns;
    }

    /**
     * Helper function for sorting data transformation functions.
     *
     * @param l {object} The left-hand function
     * @param r {object} The right-hand function
     * @returns {boolean|number}
     */
    function sortFunctionNames(l, r) {
        return l.name.localeCompare(r.name);
    }

    /**
     * Helper function for RexExp replacement; converts camelCaseValues to
     * underscore_values.
     *
     * @param _ The whole original expression
     * @param $1 The first capture group (upper-case letters)
     * @param $2 The second capture group (lower-case letters)
     * @returns {string}
     */
    function camelToUnderscore(_, $1, $2) {
        return "_" + $1.toLowerCase() + ($2 || "");
    }

    /**
     * Helper function for RexExp replacement; lowers the case of only the
     * first character.
     *
     * @param $0 The whole capture group
     * @returns {string}
     */
    function unCapitalize($0) {
        return $0.substring(0, 1).toLowerCase() + $0.substring(1);
    }

    /**
     * Wholly rebuilds the set of data transformation functions for each data
     * transformation rule.
     */
    function rebuildSelectableFunctions() {
        var ruleSet = $scope.transformRules
            , unusedFunctions = getUnusedFunctions()
            , unCount = unusedFunctions.length
            , fnMap = $scope.savedState.functionMap
            , owList = $scope.savedState.overwritingFunctions
            , owCount = owList.length
            , fnIndex
            , selFns = []
            , inputFns
            , ruleCount = ruleSet.length
            , ruleIndex
            , selectedFnID
            , collectedIDs = {}
            , uniqueIDs = []
            , dedupeID
        ;

        // Deduplicate the selectable function IDs using an associative array
        for (ruleIndex = 0; ruleIndex < ruleCount; ruleIndex++) {
            // Add the unused functions
            for (fnIndex = 0; fnIndex < unCount; fnIndex++) {
                dedupeID = unusedFunctions[fnIndex].id;
                collectedIDs[dedupeID] = dedupeID;
            }

            // Add the repeatable functions
            for (fnIndex = 0; fnIndex < owCount; fnIndex++) {
                dedupeID = owList[fnIndex].id;
                collectedIDs[dedupeID] = dedupeID;
            }
        }
        for (dedupeID in collectedIDs) {
            if (collectedIDs.hasOwnProperty(dedupeID)) {
                uniqueIDs.push(collectedIDs[dedupeID]);
            }
        }

        // Convert the collected, unique IDs back into functions
        unCount = uniqueIDs.length;
        for (ruleIndex = 0; ruleIndex < ruleCount; ruleIndex++) {
            selFns[ruleIndex] = [];
            inputFns = selFns[ruleIndex];
            selectedFnID = ruleSet[ruleIndex].functionID;

            for (fnIndex = 0; fnIndex < unCount; fnIndex++) {
                inputFns.push(fnMap[uniqueIDs[fnIndex]]);
            }

            // Add the selected function back into the control's view, as long
            // as one is selected and it is not already in the view.
            if ((null !== selectedFnID)
                && (undefined !== selectedFnID)
                && (-1 === uniqueIDs.indexOf(selectedFnID))
            ) {
                inputFns.unshift(fnMap[selectedFnID]);
            }

            inputFns.sort(sortFunctionNames);
        }

        $scope.savedState.selectableFunctions = selFns;
    }

    /**
     * Rebuilds the data transformation function map (id:object).
     */
    function rebuildFunctionIDMap() {
        var fnSet = $scope.savedState.functionList
            , fnMap = $scope.savedState.functionMap
            , fnCount = fnSet.length
            , fnIndex
            , fn
        ;

        for (fnIndex = 0; fnIndex < fnCount; fnIndex++) {
            fn = fnSet[fnIndex];
            fnMap[fn.id] = fn;
        }
    }

    /**
     * Rebuilds the mapping record map (id:object).
     */
    function rebuildMappingRecordsMap() {
        var mapRecs = $scope.savedState.mappingRecords
            , headRec = $scope.savedState.headerRecord
            , recMap = $scope.savedState.mappingRecordsMap
            , recCount = mapRecs.length
            , recIndex
            , mapRec
        ;

        for (recIndex = 0; recIndex < recCount; recIndex++) {
            // Exclude columns that are created by other function selections;
            // HINT:  They won't exist in the header record.
            if (headRec[recIndex]) {
                mapRec = mapRecs[recIndex];
                mapRec.headerName = headRec[recIndex].name; // Add the user's desired name
                recMap[mapRec.ordinalPos] = mapRec;
            }
        }
    }

    /**
     * Gets a list of all mapping fields that have yet to be associated with a
     * data transformation rule, ignoring those added by other transformation
     * functions.
     *
     * @returns {Array}
     */
    function getUnmappedFields() {
        var ruleSet = $scope.transformRules
            , ruleCount = ruleSet.length
            , ruleIndex
            , ruleInputs
            , inputCount
            , inputIndex
            , excludeID
            , excludeIDs = []
            , excludeIDMap = {}
            , mapRecords = $scope.savedState.mappingRecords
                .filter(function(o) {
                    // Ignore records that are output from a transformation
                    // function.
                    return (
                        (undefined === o.functionAttributeId)
                        || (null === o.functionAttributeId)
                    );
                })
        ;

        // Gather up the IDs of all selected mapping columns for exclusion
        for (ruleIndex = 0; ruleIndex < ruleCount; ruleIndex++) {
            ruleInputs = ruleSet[ruleIndex].inputs;
            inputCount = ruleInputs.length;

            // Use an associative array to eliminate duplicates
            for (inputIndex = 0; inputIndex < inputCount; inputIndex++) {
                excludeID = ruleInputs[inputIndex].mappingRecordOrdinalPos;
                if (null !== excludeID) {
                    excludeIDMap[excludeID] = excludeID;
                }
            }
        }
        for (excludeID in excludeIDMap) {
            if (excludeIDMap.hasOwnProperty(excludeID)) {
                excludeIDs.push(parseInt(excludeID));
            }
        }

        // Return the non-excluded fields
        return mapRecords.filter(function (o) {
            return (-1 === excludeIDs.indexOf(o.ordinalPos));
        });
    }

    /**
     * Gets the identifier of an input field which matches a given data
     * transformation function attribute.
     *
     * @param functionAttribute {object} The data transformation function
     *  attribute to test
     * @returns {number|null}
     */
    function getAutoMapFieldID(functionAttribute) {
        var regEx = (functionAttribute.automaticMapRegex
                ? new RegExp(functionAttribute.automaticMapRegex, "i")
                : null
            )
            , mapFieldID = null
            , mapFields
            , fieldCount
            , fieldIndex
            , checkField
        ;

        if (regEx) {
            mapFields = $scope.savedState.mappingRecords;
            fieldCount = mapFields.length;

            for (fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                checkField = mapFields[fieldIndex];
                if (-1 < checkField.destName.search(regEx)) {
                    mapFieldID = checkField.ordinalPos;
                    break;
                }
            }
        }

        return mapFieldID;
    }

    /**
     * Rebuilds a particular data transformation rule's view so that its input
     * and output requirements can become interactive.
     *
     * @param ruleIndex {number} The data transformation rule index to update
     * @param functionID {number} The selected data transformation function
     *  identifier for this rule
     */
    function updateTransformRuleView(ruleIndex, functionID) {
        var selectedFn = $scope.savedState.functionMap[functionID]
            , isStdCDIFn = selectedFn.isStandardCdiFunction
            , fnAttrs = selectedFn.functionAttributes
            , fnAttrCount = fnAttrs.length
            , transformRule = $scope.transformRules[ruleIndex]
            , ruleInputs = transformRule.inputs
            , ruleOutputs = transformRule.outputs
            , viewDriver = $scope.savedState.viewDriver[ruleIndex]
            , viewInputs = viewDriver.inputs
            , viewOutputs = viewDriver.outputs
            , viewFields = viewDriver.mappableFields
            , fnAttrIndex
            , fnAttr
        ;

        while (viewInputs.length) {
            viewInputs.pop();
            ruleInputs.pop();
            viewFields.pop();
        }

        while (viewOutputs.length) {
            viewOutputs.pop();
            ruleOutputs.pop();
        }

        for (fnAttrIndex = 0; fnAttrIndex < fnAttrCount; fnAttrIndex++) {
            fnAttr = fnAttrs[fnAttrIndex];

            if ("INPUTPARAMETER" === fnAttr.key) {
                viewInputs.push(fnAttr);
                ruleInputs.push({
                    attributeID: fnAttr.id
                    , mappingRecordOrdinalPos: getAutoMapFieldID(fnAttr)
                });
                viewFields.push(getUnmappedFields());
            } else if ("OUTPUTPARAMETER" === fnAttr.key) {
                viewOutputs.push(fnAttr);
                ruleOutputs.push({
                    attributeID: fnAttr.id
                    , isStandardCdiFunction: isStdCDIFn
                    , dataType: fnAttr.dataType
                    , size: fnAttr.size
                    , columnName: fnAttr.value
                        .replace(/\W+/g, "_")   // Non-word to _
                        .replace(/([A-Z]+)([a-z\d]+)?/g, camelToUnderscore)
                        .replace(/^[A-Z]/, unCapitalize)
                        .replace(/_+/g, "_")    // Repeating _ to single _
                        .replace(/^_/, "")      // No leading _
                        .replace(/_$/, "")      // No trailing _
                });
            }
        }

        // If auto-mapping matches anything, the view will become inconsistent
        // with the controller, so refresh the per-controller mappable fields.
        rebuildMappableFields();
    }

    /**
     * Wholly rebuilds the per-control view of selectable mapping fields such
     * that each control's selectable values are distinct, containing only
     * permissible values for that particular data transformation rule
     * attribute.
     */
    function rebuildMappableFields() {
        var ruleSet = $scope.transformRules
            , fieldMap = $scope.savedState.mappingRecordsMap
            , viewDriver = $scope.savedState.viewDriver
            , ruleCount = viewDriver.length
            , unmappedFields = getUnmappedFields()
            , umCount = unmappedFields.length
            , umIndex
            , ruleIndex
            , ruleInputs
            , viewFields
            , inputCount
            , inputIndex
            , mapFields
            , selectedID
        ;

        // Due to a back-end implementation limitation, each mapping field may
        // be selected only once, for now.  Should this limitation be ever
        // fixed, this whole function can go away and just let the user pick
        // repeatedly from $scope.savedState.mappingRecords.

        // Build the unique view of available mapping columns per input control
        for (ruleIndex = 0; ruleIndex < ruleCount; ruleIndex++) {
            ruleInputs = ruleSet[ruleIndex].inputs;
            viewFields = viewDriver[ruleIndex].mappableFields;
            inputCount = ruleInputs.length;
            for (inputIndex = 0; inputIndex < inputCount; inputIndex++) {
                mapFields = viewFields[inputIndex];
                selectedID = ruleInputs[inputIndex].mappingRecordOrdinalPos;

                while (mapFields.length) {
                    mapFields.pop();
                }

                for (umIndex = 0; umIndex < umCount; umIndex++) {
                    mapFields.push(unmappedFields[umIndex]);
                }

                if ((null !== selectedID) && (undefined !== selectedID)) {
                    mapFields.unshift(fieldMap[selectedID]);
                }
            }
        }
    }

    /**
     * Fires whenever the user selects a data transformation function.
     *
     * @param eventSource {object} The originating UI element.
     */
    function onRuleSelectionEvent(eventSource) {
        rebuildSelectableFunctions();
        updateTransformRuleView(
            eventSource.$index
            , eventSource.transformRule.functionID
        );
    }

    /**
     * Fires whenever the user selects an input mapping field for a data
     * transformation rule.
     */
    function onInputFieldSelectionEvent() {
        rebuildMappableFields();
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        $scope.savedState.viewDriver = [];

        // The default function selector text
        $scope.savedState.defaultFunctionSelection = L.functionListLoading;

        // The list of data transformation functions
        $scope.savedState.functionList = [];
        $scope.savedState.functionMap = {};
        $scope.savedState.overwritingFunctions = [];
        $scope.savedState.selectableFunctions = [];
        reloadFunctionList();

        // Load the mapping records
        $scope.savedState.mappingRecords = [];
        $scope.savedState.mappingRecordsMap = {};
        $scope.savedState.headerRecord = [];

        // Permit the auto-mapping function to run only once
        $scope.savedState.hasAutoMapped = false;
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        // The transformation rules
        $scope.transformRules = wizardService.getTransformRules();

        // The mapping records may have changed since the last render
        reloadMappingRecords();
    }

    //endregion

    //region View Constructor
    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;

    // Maximum character length of an output column name
    $scope.maxColumnNameLength = 33;

    // Function delegates
    $scope.addNewTransformationRule = addNewTransformationRule;
    $scope.isBlocking = isBlocking;
    $scope.onInputFieldSelectionEvent = onInputFieldSelectionEvent;
    $scope.onRuleSelectionEvent = onRuleSelectionEvent;
    $scope.removeTransformationRule = removeTransformationRule;

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardTransformStepForm.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardTransformStepController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardTransformStepController = {};
        $scope.savedState = wizardService.viewStates.wizardTransformStepController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
