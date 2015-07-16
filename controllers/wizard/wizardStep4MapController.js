/*globals app */
app.controller("wizardStep4MapController", function (
    $scope
    , $rootScope
    , $sce
    , usSpinnerService
    , l10nFactory
    , wizardFactory
    , wizardService
    , connectionsResource
    , sdmResource
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
    var L = l10nFactory.getStrings("wizardStep4MapController");

    // HTML templates
    var tplBase = "app/partials/templates";
    var mappingTemplateNewLookup = [
        {name: "NEWLOOKUP", path: tplBase + "/mappingNewLookup.html"}
        , {name: "EXISTINGLOOKUP", path: tplBase + "/mappingExistingLookup.html"}
        , {name: "NEWEXTENSION", path: tplBase + "/mappingNewExtension.html"}
        , {name: "EXISTINGEXTENSION", path: tplBase + "/mappingExistingExtension.html"}
        , {name: "NEWLIST", path: tplBase + "/mappingNewList.html"}
        , {name: "EXISTINGLIST", path: tplBase + "/mappingExistingList.html"}
        , {name: "SDM", path: tplBase + "/mappingSDM.html"}
    ];
    Object.freeze(mappingTemplateNewLookup);

    function resetWizardJobFormStep4Options(stepId) {
        var savedState = $scope.savedState;

        switch (stepId) {
            case 1:
                //wizardService.setMapSelectedConnection(null);
                /* falls through */
            case 2:
                wizardService.setMapSelectedMappingType(null);
                savedState.collapseWizardJobFormStep4OptionsStep3 = true;

                savedState.mappableObjects = null;
                /* falls through */
            case 3:
                savedState.selectedMappableObject = null;
                wizardService.setMapSelectedMappableObject(null);

                savedState.collapseWizardJobFormStep4OptionsStep4 = true;

                savedState.newMappableObject = null;
                savedState.newMappableObjectCheckBox = false;
                wizardService.setIsNewMappableObject(false);
                wizardService.setNewMappableObject(null);
                /* falls through */
            case 4:
                savedState.collapseWizardJobFormStep4OptionsStep4 = true;
                savedState.collapseWizardJobFormStep4Tooltip = true;
                savedState.selectedMappingBehaviour = null;
                savedState.disableStep4MappingBehaviour = false;
                wizardService.setMappingBehaviour(null);
                /* falls through */
            case 5:
                savedState.collapseWizardJobFormStep5Fact = true;
                savedState.collapseWizardJobFormStep5Dimension = true;
                savedState.collapseWizardJobFormStep5FactTooltip = true;
                savedState.collapseWizardJobFormStep5DimensionTooltip = true;
                savedState.selectedMappingLoadType = null;
                /* falls through */
            case 6:
                savedState.enableNextButton = false;
                savedState.collapseWizardJobFormStep6KeyMapping = true;
                savedState.collapseWizardJobFormStep6KeyMappingTooltip = true;
                savedState.collapseWizardJobFormStep6KeySelection = true;
                savedState.collapseWizardJobFormStep6KeySelectionTooltip = true;
                savedState.showMapping = false;
                savedState.selectedMappableObjectKeys = null;
                //savedState.selectedKey = null;
                savedState.selectedKeys = [];
                $scope.tempSelectedKeys = [];
                wizardService.clearMapSelectedKey();
                break;

            case 7:
                savedState.collapseWizardJobFormStep4OptionsStep3 = true;
                savedState.mappableObjects = null;


                savedState.enableNextButton = false;

                savedState.collapseWizardJobFormStep4OptionsStep4 = true;
                savedState.collapseWizardJobFormStep4Tooltip = true;
                savedState.selectedMappingBehaviour = null;
                savedState.disableStep4MappingBehaviour = true;
                wizardService.setMappingBehaviour(null);

                savedState.collapseWizardJobFormStep5Fact = true;
                savedState.collapseWizardJobFormStep5Dimension = true;
                savedState.collapseWizardJobFormStep5FactTooltip = true;
                savedState.collapseWizardJobFormStep5DimensionTooltip = true;
                savedState.selectedMappingLoadType = null;
                savedState.collapseWizardJobFormStep4OptionsStep3 = true;
                savedState.collapseWizardJobFormStep6KeyMapping = true;
                savedState.collapseWizardJobFormStep6KeySelection = true;
                savedState.showMapping = false;
                savedState.selectedMappableObjectKeys = null;

                savedState.selectedKeys = [];
                $scope.tempSelectedKeys = [];
                wizardService.clearMapSelectedKey();

                savedState.selectedMappingLoadType = "UPSERT";
                setMappingLoadType();
                break;
        }
    }

    function closeMapValidationAlert(index) {
        $scope.mapValidationAlerts.splice(index, 1);
    }

    /**
    function setMapSelectedConnection() {
        var selectedConnection = $scope.savedState.selectedConnection;
        if (jQuery.isEmptyObject(selectedConnection)) {
            resetWizardJobFormStep4Options(1);
        } else {
            // enable 2 and set
            wizardService.setMapSelectedConnection(selectedConnection);
        }
    }
    **/

    function addElement(jsonArray) {
        var resultArray = [];

        angular.forEach(jsonArray, function(value) {
            resultArray.push({
                appClientId: value.appClientId
                , behavior: value.behavior
                , columns: value.columns
                , creationDate: value.creationDate
                , id: value.id
                , instanceId: value.instanceId
                , displayName: value.name
                , name: value.name
                , relationshipType: value.relationshipType
                , schema: value.schema
            });
        });

        return resultArray;
    }

    function addListElement(jsonArray) {
        var resultArray = [];

        angular.forEach(jsonArray, function(value) {
            if (value.parentListId === 0) {
                var displayName, templateName;

                if (value.isTemplate) {
                    displayName = value.name + "-TEMPLATE";

                    if (value.prefix !== null) {
                        templateName = value.prefix + "_" + value.name + "_" + value.suffix;
                    } else {
                        templateName = value.name + "_" + value.suffix;
                    }
                } else {
                    displayName = value.name;
                    templateName = null;
                }

                resultArray.push({
                    displayName: displayName
                    , name: value.name
                    , id: value.id
                    , relationshipType: "LIST"
                    , parentListId: value.parentListId
                    , isTemplate: value.isTemplate
                    , prefix: value.prefix
                    , suffix: value.suffix
                    , templateName: templateName
                });
            }
        });

        return resultArray;
    }

    function setMapSelectedMappingType() {
        var savedState = $scope.savedState;

        if (jQuery.isEmptyObject(savedState.selectedMappingType)) {
            resetWizardJobFormStep4Options(2);
        } else {

            wizardService.setMapSelectedMappingType(savedState.selectedMappingType);

            if (savedState.selectedMappingType.type === "SDM") {
                resetWizardJobFormStep4Options(7);
            } else {
                savedState.collapseWizardJobFormStep4OptionsStep3 = false;

                //wizardService.setMapSelectedMappingType(savedState.selectedMappingType);
                resetWizardJobFormStep4Options(3);

                if (savedState.selectedMappingType.type === "LIST") {
                    addBlocker();
                    connectionsResource.getConnectionListResource(
                        wizardService.getMapSelectedConnection().id
                    ).get()
                        .then(function ($object) {
                            savedState.mappableObjects = addListElement($object);
                        }, function (response) {
                            addHTTPAlert(response);
                        })
                        .finally(function () {
                            removeBlocker();
                        })
                    ;
                } else {
                    addBlocker();
                    connectionsResource.getConnectionTableResource(
                        wizardService.getMapSelectedConnection().id
                    ).get()
                        .then(function ($object) {
                            savedState.mappableObjects = addElement($object);
                        }, function (response) {
                            addHTTPAlert(response);
                        })
                        .finally(function () {
                            removeBlocker();
                        })
                    ;
                }
            }
        }
    }

    function setMapSelectedMappableObject() {
        var savedState = $scope.savedState;

        if (jQuery.isEmptyObject(savedState.selectedMappableObject)) {
            resetWizardJobFormStep4Options(3);
            wizardService.setMapSelectedMappableObject(null);
        } else {
            resetWizardJobFormStep4Options(4);

            savedState.collapseWizardJobFormStep4OptionsStep4 = false;
            wizardService.setMapSelectedMappableObject(savedState.selectedMappableObject);

            // Grab mapping behaviour of existing object
            savedState.disableStep4MappingBehaviour = true;

            if (savedState.selectedMappingType.type === "LIST" || savedState.selectedMappingType.type === "SDM") {
                savedState.selectedMappingBehaviour = "FACT";
                wizardService.setMappingBehaviour(savedState.selectedMappingBehaviour);
            } else  {
                savedState.selectedMappingBehaviour = savedState.selectedMappableObject.behavior.toUpperCase();
                wizardService.setMappingBehaviour(savedState.selectedMappingBehaviour);
            }

            if (savedState.selectedMappingBehaviour === "DIMENSION") {
                savedState.collapseWizardJobFormStep5Dimension = false;
            } else if (savedState.selectedMappingBehaviour === "FACT") {
                savedState.collapseWizardJobFormStep5Fact = false;
            } else if (savedState.selectedMappingType.type === "LIST") {
                // hard coded for LIST type mapping
                savedState.selectedMappingBehaviour = "FACT";
                wizardService.setMappingBehaviour(savedState.selectedMappingBehaviour);
                savedState.collapseWizardJobFormStep5Fact = false;
            } else {
                addAlert(L.errorUnknownMappingBehavior, "danger");
            }
        }
    }

    function resetListExecName(newListOnExec) {
        var savedState = $scope.savedState;

        // reset the New List Exec Name
        if (!newListOnExec) {
            savedState.listPrefix = null;
            savedState.listSuffix = null;
            savedState.newListNameOnExecution = false;
            savedState.isValidListNewExec = false;
        } else {
            // set validation state for New List Exec
            savedState.isValidListNewExec = true;
        }
    }

    function checkListSuffix(listSuffix) {
        $scope.savedState.isValidListNewExec = (listSuffix === null);
    }

    function setIsNewMappableObject(newMappableObjectCheckBox) {
        var savedState = $scope.savedState;

        if (newMappableObjectCheckBox) {
            resetWizardJobFormStep4Options(4);
            savedState.selectedMappableObject = null;
            wizardService.setMapSelectedMappableObject(null);
            wizardService.setIsNewMappableObject(true);

            if (savedState.selectedMappingType.name === "List") {
                $scope.checkRegEx = /^[A-Za-z0-9_ -]*$/;
            } else {
                $scope.checkRegEx = /^[A-Za-z0-9][A-Za-z0-9_]*$/;
            }
        } else {
            resetWizardJobFormStep4Options(3);
        }

        // reset the new List on Exec settings
        $scope.resetListExecName(false);
    }

    function checkNewMappableObject() {
        var savedState = $scope.savedState;

        if (savedState.selectedMappingType.type === "LIST") {
            addBlocker();

            // check to see New List Name Execution is checked
            if (savedState.newListNameOnExecution) {
                $scope.jobConfigTemplate.listElement.isTemplate = savedState.newListNameOnExecution;
                $scope.jobConfigTemplate.listElement.prefix = savedState.listPrefix;
                $scope.jobConfigTemplate.listElement.suffix = savedState.listSuffix.value;
            }

            connectionsResource.getConnectionListResource(
                    savedState.selectedConnection.id
                )
                .get({name: savedState.newMappableObject.name})
                .then(function () {
                    $scope.mapValidationAlerts.push({
                        type: "danger"
                        , msg: l10nFactory.interpolateString(
                            L.errorObjectAlreadyExists
                            , savedState.newMappableObject.name
                        )
                    });
                    savedState.collapseWizardJobFormStep4OptionsStep4 = true;
                }, function () {
                    // hard code list as FACT behaviour
                    // disable step 4
                    savedState.selectedMappingBehaviour = "FACT";
                    wizardService.setMappingBehaviour(savedState.selectedMappingBehaviour);
                    savedState.disableStep4MappingBehaviour = true;
                    savedState.collapseWizardJobFormStep4OptionsStep4 = false;
                    // show step 5
                    savedState.collapseWizardJobFormStep5Fact = false;
                    wizardService.setNewMappableObject(savedState.newMappableObject);
                })
                .finally(function() {
                    removeBlocker();
                })
            ;
        } else {
            addBlocker();
            connectionsResource.getConnectionTableResource(
                    savedState.selectedConnection.id
                )
                .get({name: savedState.newMappableObject.name})
                .then(function () {
                    $scope.mapValidationAlerts.push({
                        type: "danger"
                        , msg: l10nFactory.interpolateString(
                            L.errorObjectAlreadyExists
                            , savedState.newMappableObject.name
                        )
                    });
                    savedState.collapseWizardJobFormStep4OptionsStep4 = true;
                }, function () {
                    savedState.collapseWizardJobFormStep4OptionsStep4 = false;
                    wizardService.setMapSelectedMappableObject(savedState.newMappableObject);
                })
                .finally(function() {
                    removeBlocker();
                })
            ;
        }
    }

    function setMappingBehaviour() {
        var savedState = $scope.savedState;

        wizardService.setMappingBehaviour(savedState.selectedMappingBehaviour);
        resetWizardJobFormStep4Options(5);
        if (savedState.selectedMappingBehaviour === "DIMENSION") {
            savedState.collapseWizardJobFormStep5Dimension = false;
        }  else if (savedState.selectedMappingBehaviour === "FACT") {
            savedState.collapseWizardJobFormStep5Fact = false;
        }  else {
            addAlert(L.errorUnknownMappingBehavior, "danger");
        }
    }

    function setMappingLoadType() {
        var savedState = $scope.savedState;

        wizardService.setMappingLoadType(savedState.selectedMappingLoadType);
        resetWizardJobFormStep4Options(6);

        switch (wizardService.getMapSelectedMappingType().type) {
            case "EXTENSION":
                if (wizardService.isNewMappableObject()) {
                    // new mappable object
                    savedState.selectedMappableObjectKeys = sdmResource.getKeys().$object;
                    savedState.collapseWizardJobFormStep6KeyMapping = false;
                } else {
                    addBlocker();
                    connectionsResource.getConnectionTableResource(
                            savedState.selectedConnection.id
                        )
                        .get({
                            name: wizardService.getMapSelectedMappableObject().name
                        })
                        .then(function($object) {
                            wizardService.setMapSelectedMappableObject($object);
                            savedState.selectedMappableObjectKeys = sdmResource.getKeys().$object;
                            savedState.collapseWizardJobFormStep6KeyMapping = false;
                        })
                        .finally(function() {
                            removeBlocker();
                        })
                    ;
                }

                break;
            case "SDM":
                savedState.selectedMappableObjectKeys = sdmResource.getKeys().$object;
                savedState.collapseWizardJobFormStep6KeyMapping = false;

                break;
            case "LIST":
                if (wizardService.isNewMappableObject()) {
                    // new mappable object
                    addBlocker();

                    // pull columns from list table
                    connectionsResource.getConnectionTableResource(
                            savedState.selectedConnection.id
                        )
                        .get({name: "list"})
                        .then(function($object) {
                            var returnObject = $object;
                            returnObject.listProps = null;
                            wizardService.setMapSelectedMappableObject(returnObject);
                            savedState.selectedMappableObjectKeys = sdmResource.getKeys().$object;
                            savedState.collapseWizardJobFormStep6KeyMapping = false;
                        })
                        .finally(function() {
                            removeBlocker();
                        })
                    ;
                } else {
                    addBlocker();
                    // pull columns from list table
                    connectionsResource.getConnectionTableResource(
                            savedState.selectedConnection.id
                        )
                        .get({name: "list"})
                        .then(function($object) {
                            var listObjects = wizardService.getMapSelectedMappableObject();
                            var returnObject = $object;
                            returnObject.listProps = listObjects;
                            wizardService.setMapSelectedMappableObject(returnObject);
                            savedState.selectedMappableObjectKeys = sdmResource.getKeys().$object;
                            savedState.collapseWizardJobFormStep6KeyMapping = false;
                        })
                        .finally(function() {
                            removeBlocker();
                        })
                    ;
                }

                break;
            case "LOOKUP":
                if (wizardService.isNewMappableObject()) {
                    // new mappable object
                    switch (wizardService.getMappingBehaviour()) {
                        case "FACT":
                            generateMappingRecords("NEWLOOKUP");
                            break;
                        case "DIMENSION":
                            savedState.collapseWizardJobFormStep6KeySelection = false;
                            break;
                        default:
                            addAlert(L.errorUnknownMappingBehavior, "danger");
                    }
                } else {
                    switch (wizardService.getMappingBehaviour()) {
                        // existing mappable object
                        case "FACT":
                            addBlocker();
                            connectionsResource.getConnectionTableResource(
                                    savedState.selectedConnection.id
                                )
                                .get({name: wizardService.getMapSelectedMappableObject().name})
                                .then(function($object) {
                                    wizardService.setMapSelectedMappableObject($object);
                                    generateMappingRecords("EXISTINGLOOKUP");
                                })
                                .finally(function() {
                                    removeBlocker();
                                })
                            ;
                            break;
                        case "DIMENSION":
                            // Retrieve the existing mappable object for key selection
                            addBlocker();
                            connectionsResource.getConnectionTableResource(
                                    savedState.selectedConnection.id
                                )
                                .get({name: wizardService.getMapSelectedMappableObject().name})
                                .then(function($object) {
                                    var dimColumns = []
                                        , colCount = $object.columns.length
                                        , i
                                    ;

                                    wizardService.setMapSelectedMappableObject($object);

                                    for (i = 0; i < colCount; i++) {
                                        if ($object.columns[i].primaryKey) {
                                            dimColumns.push($object.columns[i]);
                                        }
                                    }

                                    savedState.selectedMappableObjectKeys = dimColumns;
                                    savedState.collapseWizardJobFormStep6KeyMapping = false;
                                })
                                .finally(function() {
                                    removeBlocker();
                                })
                            ;

                            break;
                        default:
                            addAlert(L.errorUnknownMappingBehavior, "danger");
                            break;
                    }
                }

                break;
            default:
                addAlert(L.errorUnknownMappingType, "danger");
                break;
        }
    }

    function setSelectedKeySelection(selectedKey) {
        wizardService.setMapSelectedKey(selectedKey);

        switch (wizardService.getMapSelectedMappingType().type) {
            case "EXTENSION":
                generateMappingRecords("");
                break;
            case "LOOKUP":
                generateMappingRecords("NEWLOOKUP");
                break;
            case "LIST":
                generateMappingRecords("");
                break;
            case "SDM":
                generateMappingRecords("");
                break;
            default:
                addAlert(L.errorUnknownMappingType, "danger");
                break;
        }
    }

    function setSelectedKeyMapping(selectedKeys, mappedSdmKey) {
        if (!jQuery.isEmptyObject(mappedSdmKey)) {
            //if($scope.tempSelectedKeys.keyLookup == undefined) {
            if(selectedKeys.mappedSdmKey == undefined) {
                selectedKeys.mappedSdmKey = [];
                selectedKeys.keyLookup = [];
                selectedKeys.mappedSdmKey.push(mappedSdmKey);

                var lookup = { value: mappedSdmKey.name, key: selectedKeys.name };
                selectedKeys.keyLookup.push(lookup);

            } else {
                // set new values for additional keys
                selectedKeys.mappedSdmKey.push(mappedSdmKey);
                var lookup = { value: mappedSdmKey.name, key: selectedKeys.name };
                selectedKeys.keyLookup.push(lookup);
            }
        }

        wizardService.setMapSelectedKey(selectedKeys);

        switch (wizardService.getMapSelectedMappingType().type) {
            case "EXTENSION":
                if (wizardService.isNewMappableObject()) {
                    // new mappable object
                    generateMappingRecords("NEWEXTENSION");
                } else {
                    // existing mappable object
                    generateMappingRecords("EXISTINGEXETENSION");
                }

                break;
            case "SDM":
                generateMappingRecords("SDM");
                break;
            case "LOOKUP":
                generateMappingRecords("EXISTINGLOOKUP");
                break;
            case "LIST":
                if (wizardService.isNewMappableObject()) {
                    // new mappable object
                    generateMappingRecords("NEWLIST");
                } else {
                    // existing mappable object
                    generateMappingRecords("EXISTINGLIST");
                }

                break;
            default:
                addAlert(L.errorUnknownMappingType, "danger");
                break;
        }
    }

    function generateMappingRecords(mappingTemplate) {
        var savedState = $scope.savedState;

        switch (mappingTemplate) {
            case "NEWLOOKUP":
                savedState.mappingTemplate = mappingTemplateNewLookup[0].path;
                break;
            case "EXISTINGLOOKUP":
                savedState.mappingTemplate = mappingTemplateNewLookup[1].path;
                break;
            case "NEWEXTENSION":
                savedState.mappingTemplate = mappingTemplateNewLookup[2].path;
                break;
            case "EXISTINGEXETENSION":
                savedState.mappingTemplate = mappingTemplateNewLookup[3].path;
                break;
            case "NEWLIST":
                savedState.mappingTemplate = mappingTemplateNewLookup[4].path;
                break;
            case "EXISTINGLIST":
                savedState.mappingTemplate = mappingTemplateNewLookup[5].path;
                break;
            case "SDM":
                savedState.mappingTemplate = mappingTemplateNewLookup[6].path;
                break;
            default:
                savedState.mappingTemplate = null;
                break;
        }

        savedState.showMapping = true;
        savedState.enableNextButton = true;
        $rootScope.$broadcast("mapping:refreshMappingRecords");
    }

    /**
     * Fires whenever this controller receives an event notification indicating
     * that the wizard has been cancelled.
     */
    function onCancelWizardEvent() {
        var savedState = $scope.savedState;

        savedState.enableNextButton = false;

        // 1
        //savedState.connections = null;
        savedState.selectedConnection = null;

        // 2
        savedState.mappingTypes = null;
        savedState.selectedMappingType = null;

        // 3
        savedState.collapseWizardJobFormStep4OptionsStep3 = true;
        savedState.mappableObjects = null;
        savedState.selectedMappableObject = null;
        $scope.mapValidationAlerts = [];
        savedState.newMappableObject = null;
        savedState.newMappableObjectCheckBox = false;
        savedState.listSuffixFormats = null;

        savedState.newListNameOnExecution = false;
        savedState.listPrefix = null;
        savedState.listSuffix = null;

        // 4
        savedState.collapseWizardJobFormStep4OptionsStep4 = true;
        savedState.collapseWizardJobFormStep4Tooltip = true;
        savedState.selectedMappingBehaviour = null;
        savedState.disableStep4MappingBehaviour = false;

        // 5
        savedState.collapseWizardJobFormStep5Fact = true;
        savedState.collapseWizardJobFormStep5Dimension = true;
        savedState.collapseWizardJobFormStep5FactTooltip = true;
        savedState.collapseWizardJobFormStep5DimensionTooltip = true;
        savedState.selectedMappingLoadType = null;

        // 6
        savedState.collapseWizardJobFormStep6KeyMapping = true;
        savedState.collapseWizardJobFormStep6KeyMappingTooltip = true;
        savedState.collapseWizardJobFormStep6KeySelection = true;
        savedState.collapseWizardJobFormStep6KeySelectionTooltip = true;
        savedState.selectedMappableObjectKeys = null;

        //mapping
        savedState.showMapping = false;
    }

    function getSelectedConnection(connections) {
        var verticaConn = connections.filter(function(conn) {
            return "VERTICA" === conn.type;
        });
        return ((verticaConn.length > 0) ? verticaConn[0] : null);
    }

    /**
     * Prepares the view for its first render.
     */
    function initViewState() {
        var savedState = $scope.savedState
            , mapSelectedMappingType = wizardService.getMapSelectedMappingType()
            , headerRecord = wizardService.getHeaderRecord()
        ;

        savedState.enableNextButton = false;

        // 1
        addBlocker();
        connectionsResource.getConnections().then(function (connections) {

            savedState.selectedConnection = getSelectedConnection(connections);
            wizardService.setMapSelectedConnection(savedState.selectedConnection);

        }).finally(function() { removeBlocker(); });

        // 2
        savedState.mappingTypes = wizardFactory.getMappingTypes();
        savedState.selectedMappingType =
            jQuery.isEmptyObject(mapSelectedMappingType)
            ? null
            : mapSelectedMappingType
        ;

        // 3
        $scope.mapValidationAlerts = [];
        savedState.collapseWizardJobFormStep4OptionsStep3 = true;
        savedState.selectedMappableObject = null;
        savedState.newMappableObject = { name: null };
        savedState.newMappableObjectCheckBox = false;
        savedState.listSuffixFormats = wizardFactory.getListSuffixFormat();

        savedState.newListNameOnExecution = false;
        savedState.listPrefix = null;
        savedState.listSuffix = null;
        savedState.isValidListNewExec = false;

        // 4
        savedState.collapseWizardJobFormStep4OptionsStep4 = true;
        savedState.collapseWizardJobFormStep4Tooltip = true;
        savedState.selectedMappingBehaviour = null;
        savedState.disableStep4MappingBehaviour = false;

        sdmResource.getSdmFields().then(function($object) {
            savedState.sdmFields = $object;
            wizardService.setSdmFields($object);
        });

        // 5
        savedState.collapseWizardJobFormStep5Fact = true;
        savedState.collapseWizardJobFormStep5Dimension = true;
        savedState.collapseWizardJobFormStep5FactTooltip = true;
        savedState.collapseWizardJobFormStep5DimensionTooltip = true;
        savedState.selectedMappingLoadType = null;

        // 6
        savedState.collapseWizardJobFormStep6KeyMapping = true;
        savedState.collapseWizardJobFormStep6KeyMappingTooltip = true;
        savedState.collapseWizardJobFormStep6KeySelection = true;
        savedState.collapseWizardJobFormStep6KeySelectionTooltip = true;
        savedState.headerRecord = jQuery.isEmptyObject(headerRecord)
            ? null
            : headerRecord
        ;
        savedState.selectedMappableObjectKeys = null;
        //savedState.selectedKey = null;
        savedState.selectedKeys = [];
        $scope.tempSelectedKeys = [];

        //mapping
        savedState.showMapping = false;
        savedState.mappingTemplate = null;
    }

    /**
     * Prepares the view to redisplay already-supplied user inputs and control
     * states.
     */
    function resumeViewState() {
        var selectedMappingType = $scope.savedState.selectedMappingType
            , selectedMappingName = (selectedMappingType
                ? selectedMappingType.name
                : ""
            )
        ;

        $scope.selectDataLoadTypeFactHelp =
            $sce.trustAsHtml(l10nFactory.interpolateString(
                L.selectDataLoadTypeFactHelp
                , selectedMappingName
            ));

        $scope.selectDataLoadTypeDimensionHelp =
            $sce.trustAsHtml(l10nFactory.interpolateString(
                L.selectDataLoadTypeDimensionHelp
                , selectedMappingName
            ));
    }

    //region View Scope Constructor

    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;
    $scope.selectDataMapTypeHelp = $sce.trustAsHtml(L.selectDataMapTypeHelp);

    $scope.checkRegEx = /^[A-Za-z0-9][A-Za-z0-9_]*$/;

    // Function Delegates
    $scope.checkListSuffix = checkListSuffix;
    $scope.checkNewMappableObject = checkNewMappableObject;
    $scope.closeMapValidationAlert = closeMapValidationAlert;
    $scope.isBlocking = isBlocking;
    $scope.resetListExecName = resetListExecName;
    $scope.setIsNewMappableObject = setIsNewMappableObject;
    //$scope.setMapSelectedConnection = setMapSelectedConnection;
    $scope.setMapSelectedMappableObject = setMapSelectedMappableObject;
    $scope.setMapSelectedMappingType = setMapSelectedMappingType;
    $scope.setMappingBehaviour = setMappingBehaviour;
    $scope.setMappingLoadType = setMappingLoadType;
    $scope.setSelectedKeyMapping = setSelectedKeyMapping;
    $scope.setSelectedKeySelection = setSelectedKeySelection;

    // Event Listeners
    $scope.$on("wizardService:cancelWizard", onCancelWizardEvent);

    // Disallow upper-case characters in new table names
    $scope.$watch("savedState.newMappableObject.name", function() {
        var objectRef = $scope.savedState.newMappableObject;

        // Do nothing when the newMappableObject is missing
        if ( (null === objectRef)
            || (undefined === objectRef)
            || (null === objectRef.name)
            || (undefined === objectRef.name)
        ) {
            return;
        }

        objectRef.name = objectRef.name.toLocaleLowerCase();
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardJobFormStep4Options.$valid"
        , $scope.$parent.onFormValidChangeEvent
    );

    // Obtain or initialize the saved state object reference and resume it
    $scope.savedState = wizardService.viewStates.wizardStep4MapController;
    if (undefined === $scope.savedState) {
        wizardService.viewStates.wizardStep4MapController = {};
        $scope.savedState = wizardService.viewStates.wizardStep4MapController;
        initViewState();
    }
    resumeViewState();

    //endregion
});
