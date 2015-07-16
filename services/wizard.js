/* Wizard Factory and Services */
/*globals angular */

angular.module('cdi.wizard', ['restangular'])
    .factory('wizardFactory', [
        function() {
            'use strict';

            var _uiModes = {
                NONE: 0
                , ADHOC: 1
                , RECURRING: 2
                , POLLING: 3
                , hasKey: function(keyName) {
                    return ('string' === typeof keyName)
                        && this.hasOwnProperty(keyName)
                        ;
                }
                , hasValue: function(testValue) {
                    return (testValue !== null)
                        && !isNaN(testValue)
                        && ('boolean' !== typeof testValue)
                        && (0 === testValue % 1)
                        && (0 <= testValue)
                        && (3 >= testValue)
                        ;
                }
            };

            var DATA_TYPES = [
                    {id: 1, value: "TEXT"}
                    , {id: 2, value: "DATE"}
                    , {id: 3, value: "INTEGER"}
                    , {id: 4, value: "DECIMAL"}
                    , {id: 5, value: "MONEY"}
                ]
                , _dataTypeNameMap = {}
                , _dataTypeIDMap = {}
                ;

            var FIELD_DELIMITERS = [
                {label: ', (Comma)', value: ','}
                ,{label: '| (Pipe)', value: '|'}
                ,{label: 'Tab', value: '\t'}
                ,{label: '; (Semi-Colon)', value: ';'}
            ];

            var TEXT_QUALIFIERS = [
                {label: 'None (Default)', value: 'none'}
                , {label: '" (Double Quote)', value: '\"'}
                , {label: '\' (Single Quote)', value: '\''}
            ];

            var ROW_TERMINATORS = [
                {label: 'LF (Line Feed)', value: 'lf'}
                , {label: 'CR (Carriage Return)', value: 'cr'}
                , {label: 'CRLF (Carriage Return & Line Feed)', value: 'crlf'}
            ];

            var VALIDATION_TYPES = [
                {id: 0, value: 'None'}
                ,{id: 1, value: 'Exact'}
                ,{id: 2, value: 'Range'}
            ];

            var _wizardPartialsPath = 'app/partials/wizard';
            var WIZARD_STEPS = [
                {   id: 1
                    , name: 'Job'
                    , path: _wizardPartialsPath + '/wizard-step1-job.html'
                    , step: 0
                    , next: 2
                }
                , { id: 2
                    , name: 'Data'
                    , path: _wizardPartialsPath + '/wizard-step2-data.html'
                    , step: 1
                    , next: 3
                }
                , { id: 3
                    , name: 'Define'
                    , path: _wizardPartialsPath + '/wizard-step3-define.html'
                    , step: 2
                    , next: 4
                }
                , { id: 4
                    , name: 'Transform'
                    , path: _wizardPartialsPath + '/wizard-transform-step.html'
                    , step: 3
                    , next: 5
                }
                , { id: 5
                    , name: 'Map'
                    , path: _wizardPartialsPath + '/wizard-step4-map.html'
                    , step: 4
                    , next: 6
                }
                , { id: 6
                    , name: 'Customize'
                    , path: _wizardPartialsPath + '/wizard-step-customize.html'
                    , step: 5
                    , next: 7
                }
                , { id: 7
                    , name: 'Review'
                    , path: _wizardPartialsPath + '/wizard-step5-review.html'
                    , step: 6
                    , next: null
                }
            ];

            (function buildDataTypeMaps() {
                var typeCount = DATA_TYPES.length
                    , typeIndex
                    , evalType
                    ;

                for (typeIndex = 0; typeIndex < typeCount; typeIndex++) {
                    evalType = DATA_TYPES[typeIndex];
                    _dataTypeNameMap[evalType.value] = evalType.id;
                    _dataTypeIDMap[evalType.id] = evalType.value;
                }
            })();

            return {
                getPartials: function() {
                    return WIZARD_STEPS;
                }

                , getPartialByID: function(partialID) {
                    var stepCount = WIZARD_STEPS.length
                        , stepIndex
                        , evalStep
                        , selectedPartial = null
                        ;

                    for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
                        evalStep = WIZARD_STEPS[stepIndex];
                        if (evalStep.id === partialID) {
                            selectedPartial = evalStep;
                            break;
                        }
                    }

                    return selectedPartial;
                }

                /**
                 * Returns the shared set of UI modes (essentially a C-like
                 * enum), _uiModes.
                 */
                , getUIModes: function() {
                    return _uiModes;
                }

                , getJobTypes: function() {
                    return [
                        { name: 'Ad-hoc'
                            , description: 'A job type for creating ad-hoc file loads'
                            , type: 'ADHOC'
                            , uiMode: _uiModes.ADHOC
                        }
                        , { name: 'Recurring - Scheduled'
                            , description: 'A job type for creating recurring file loads'
                            , type: 'RECURRING'
                            , uiMode: _uiModes.RECURRING
                        }
                        , { name: 'Recurring - Polling'
                            , description: 'A job type for creating polling-based file loads'
                            , type: 'RECURRING'
                            , uiMode: _uiModes.POLLING
                        }
                    ];
                }

                /**
                 * Gets the set of static job expiries (number of days a job is
                 * allowed to run).
                 *
                 * @returns {array}
                 */
                , getJobExpiries: function() {
                    return [
                        { value: 0, name: 'No expiration' }
                        , { value: 60, name: '60 days' }
                        , { value: 120, name: '120 days' }
                        , { value: 180, name: '180 days' }
                        , { value: 240, name: '240 days' }
                        , { value: 365, name: '365 days' }
                    ];
                }

                , getModuleTypes: function() {
                    return [
                        { name: 'Upload'
                            , description: 'A module for uploading data directly from the browser'
                            , type: 'UPLOAD'
                            , subType: 'DL'
                        }
                        , { name: 'SFTP'
                            , description: 'A module for downloading data from an SFTP server'
                            , type: 'SFTP'
                            , subType: 'DL'
                        }
                        , { name: 'Server'
                            , description: 'A module for loading data directly from the CDI server'
                            , type: 'LOCALFILESYSTEM'
                            , subType: 'DL'
                        }
                    ];
                }

                , getJobConfigTemplate: function() {
                    return {
                        jobType: null
                        , jobName: null
                        , jobDescription: null
                        , successEmail: null
                        , failureEmail: null
                        , campaignId: null
                        , dlModule: {
                            type: null
                            , feed: null
                            , sftpConnection: null
                            , remotePath: null
                            , filePrefix: null
                            , fileSuffix: null
                            , fileRegex: null
                        }, validationModule: {
                            validationType: null
                            , validationAmount: null
                            , validationRangeLower: null
                            , validationRangeUpper: null
                            , abort: null
                            , notifyOnAbort: null
                            , notifyLevelAbove: null
                            , notifyLevelBelow: null
                        }, lrModule: {
                            type: null
                            , rejectThreshold: null
                            , fileFeed: null
                            , destFields: null
                            , verticaFeed: null
                            , header: false
                            , delimiter: null
                            , textQualifier: null
                            , terminator: null
                            , fileRegex: null
                            , databaseTable: null
                            , databaseTableConnectionId: null
                        }, listElement: {
                            isTemplate: false
                            , prefix: null
                            , suffix: null
                        }, scheduleConfig: null
                        , daysAvailable: 0
                        , pgpKeyID: null
                    };
                }

                /**
                 *  Creates and returns a referential map of the various modules
                 *  -- unique by sub-type -- found within a given job
                 *  configuration object.  This is particularly important for
                 *  feeding the UI in Wizard Step 5 to avoid a lot of otherwise
                 *  unnecessary looping or guessing which module element to
                 *  display.
                 *
                 *  @param jobConfig {object} The job configuration object from
                 *      which to return the module map.
                 *  @returns {object} An object with one named member per module
                 *      sub-type, allowing for modules to be accessed like:
                 *      moduleMap.LR.whatever.
                 */
                , extractModuleMap: function(jobConfig) {
                    var modIndex
                        , modCount = (
                            (   jobConfig
                                && jobConfig.modules
                                && Array.isArray(jobConfig.modules)
                            )
                            ? jobConfig.modules.length
                            : 0
                        )
                        , moduleMap = {}
                    ;

                    for (modIndex = 0; modIndex < modCount; modIndex++) {
                        moduleMap[jobConfig.modules[modIndex].subType] =
                            jobConfig.modules[modIndex];
                    }

                    return moduleMap;
                },

                getDataTypes: function() {
                    return DATA_TYPES;
                },

                /**
                 * Translates a DATA_TYPES name to its identifier.  Returns
                 * undefined when the name is unknown.
                 *
                 * @param dataTypeName {string} Name to translate
                 * @returns (number|undefined)
                 */
                getDataTypeIDFromName: function(dataTypeName) {
                    return _dataTypeNameMap[dataTypeName];
                },

                /**
                 * Translates a DATA_TYPES identifier to its name.  Returns
                 * undefined when the identifier is unknown.
                 *
                 * @param dataTypeID {number} Identifier to translate
                 * @returns (string|undefined)
                 */
                getDataTypeNameFromID: function(dataTypeID) {
                    return _dataTypeIDMap[dataTypeID];
                },

                getValidationTypes: function() {
                    return VALIDATION_TYPES;
                },
                getDelimiters: function() {
                    return FIELD_DELIMITERS;
                },
                getFreeFormDelimiter: function() {
                    return {
                        label: 'FREEFORM'
                        , value: null
                    };
                },
                getTextQualifiers: function() {
                    return TEXT_QUALIFIERS;
                },
                getRowTerminators: function() {
                    return ROW_TERMINATORS;
                },
                getListSuffixFormat: function() {
                    return [
                        {label: 'Date Format - YYYYMMDD', value: 'YYYYMMDD'}
                        , {label: 'DateTime Format - YYYYMMDDHHMMSS', value: 'YYYYMMDDHHMMSS'}
                    ];
                },
                getMappingTypes: function() {
                    return [
                        { name: 'Extension', description: 'A mapping type for creating an extension', type: 'EXTENSION', active: true }
                        , { name: 'Lookup', description: 'A mapping type for creating a lookup', type: 'LOOKUP', active: true }
                        , { name: 'List', description: 'A mapping type for creating a list', type: 'LIST', active: true }
                        , { name: 'Suppression', description: 'A mapping type for creating a suppression', type: 'SUPPRESSION', active: false }
                        , { name: 'Standard Data Model', description: 'A mapping type for mapping to the SDM', type: 'SDM', active: true }
                    ];
                },
                getDateFormats: function() {
                    return [
                        {id:1, pattern: 'DD-MON-YYYY'}
                        , {id:2, pattern: 'DD/MM/YYYY'}
                        , {id:3, pattern: 'DD-MM-YYYY'}
                        , {id:4, pattern: 'DD-MM-YY'}
                        , {id:5, pattern: 'DD-MON-YYYY HH:MI:SS'}
                        , {id:6, pattern: 'DD/MM/YYYY HH:MI:SS'}
                        , {id:7, pattern: 'DD-MM-YYYY HH:MI:SS'}
                        , {id:8, pattern: 'DD-MM-YY HH:MI:SS'}
                        , {id:9, pattern: 'MON-DD-YYYY'}
                        , {id:10, pattern: 'MM-DD-YYYY'}
                        , {id:11, pattern: 'MM-DD-YY'}
                        , {id:12, pattern: 'MM/DD/YYYY'}
                        , {id:13, pattern: 'MM-DDYYYY'}
                        , {id:14, pattern: 'MM/DD/YY'}
                        , {id:15, pattern: 'MON-DD-YYYY HH:MI:SS'}
                        , {id:16, pattern: 'MM-DD-YYYY HH:MI:SS'}
                        , {id:17, pattern: 'MM/DD/YYYY HH:MI:SS'}
                        , {id:18, pattern: 'MM/DD/YY HH:MI:SS'}
                        , {id:19, pattern: 'YYYY-MON-DD'}
                        , {id:20, pattern: 'YY-MM-DD'}
                        , {id:21, pattern: 'YYYY/MM/DD'}
                        , {id:22, pattern: 'YYYY-MM-DD'}
                        , {id:23, pattern: 'YYYYMMDD'}
                        , {id:24, pattern: 'YYYY-MON-DD HH:MI:SS'}
                        , {id:25, pattern: 'YYYY-MM-DD HH:MI:SS'}
                        , {id:26, pattern: 'YYYY/MM/DD HH:MI:SS'}
                    ];
                },
                getUploadDlModule: function() {
                    return {
                        "type": "UPLOAD",
                        "subType": "DL",
                        "attributes": null,
                        "feeds": null,
                        "configMeta": null
                    };
                },
                getCampaignEbModule: function() {
                    return {
                        "type": "CAMPAIGN",
                        "subType": "CAMPAIGN",
                        "ordinalPos": 5,
                        "attributes": [
                            {
                                "key": "CAMPAIGNID",
                                "value": null,
                                "ordinalPos": 0,
                                "configMeta": null
                            }, {
                                "key": "FAILUREEMAILTO",
                                "value": null,
                                "ordinalPos": 1,
                                "configMeta": null
                            }, {
                                "key": "SUCCESSEMAILTO",
                                "value": null,
                                "ordinalPos": 2,
                                "configMeta": null
                            }
                        ],
                        "feeds": null,
                        "configMeta": null
                    };
                },
                getSftpDlModule: function() {
                    return {
                        "type": "SFTP",
                        "subType": "DL",
                        "attributes": [{
                            "key": "FAILUREEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "SUCCESSEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "CONNECTIONID",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "FILEPATH",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "FILEREGEX",
                            "value": "",
                            "configMeta": null
                        }],
                        "feeds": null,
                        "configMeta": null
                    };
                }
                , getValidationModule: function() {
                    return {
                        "type": "VALIDATION",
                        "subType": "VL",
                        "attributes": [{
                            "key": "VALIDATIONTYPE",
                            "value": null,
                            "configMeta": null
                        }, {
                            "key": "VALIDATIONAMOUNT",
                            "value": 0,
                            "configMeta": null
                        }, {
                            "key": "VALIDATIONRANGELOWER",
                            "value": 0,
                            "configMeta": null
                        },
                            {
                                "key": "VALIDATIONRANGEUPPER",
                                "value": 0,
                                "configMeta": null
                            }, {
                                "key": "ABORT",
                                "value": false,
                                "configMeta": null
                            }, {
                                "key": "NOTIFYONABORT",
                                "value": false,
                                "configMeta": null
                            }, {
                                "key": "NOTIFYLEVELABOVE",
                                "value": null,
                                "configMeta": null
                            }, {
                                "key": "NOTIFYLEVELBELOW",
                                "value": null,
                                "configMeta": null
                            }, {
                                "key": "FEEDID",
                                "value": null,
                                "configMeta": null
                            },{
                                "key": "FAILUREEMAILTO",
                                "value": "",
                                "configMeta": null
                            }, {
                                "key": "SUCCESSEMAILTO",
                                "value": "",
                                "configMeta": null
                            }],
                        "configMeta": null
                    };
                }

                , getPollingModule: function() {
                    return {
                        type: "POLLING"
                        , subType: "Polling"
                        , attributes: [
                            {   key: "FILEREGEX"
                                , value: ""
                                , configMeta: null
                            }, {   key: "FILEPATH"
                                , value: ""
                                , configMeta: null
                            }, {   key: "CONNECTIONID"
                                , value: ""
                                , configMeta: null
                            }
                        ]
                        , feeds: []
                        , configMeta: null
                    };
                }

                , getDelimitedLrModule: function() {
                    return {
                        "type": "DELIMITED",
                        "subType": "LR",
                        "attributes": [{
                            "key": "FAILUREEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "SUCCESSEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "REJECTTHRESHOLD",
                            "value": "",
                            "configMeta": null
                        }],
                        "feeds": [{
                            "type": "FILE",
                            "mappable": false,
                            "mapsTo": 0,
                            "mapsFrom": -1,
                            "file": true,
                            "attributes": [{
                                "key": "FEEDID",
                                "value": "",
                                "ordinalPos": 0,
                                "configMeta": null
                            }, {
                                "key": "DELIMITER",
                                "value": "",
                                "ordinalPos": 1,
                                "configMeta": null
                            }, {
                                "key": "HEADER",
                                "value": "",
                                "ordinalPos": 2,
                                "configMeta": null
                            }, {
                                "key": "QUALIFIER",
                                "value": "",
                                "ordinalPos": 3,
                                "configMeta": null
                            }, {
                                "key": "TERMINATOR",
                                "value": "",
                                "ordinalPos": 4,
                                "configMeta": null
                            }, {
                                "key": "FILEREGEX",
                                "value": "",
                                "ordinalPos": 5,
                                "configMeta": null
                            }],
                            "fields": [{
                                "key": "FIELD",
                                "value": "",
                                "ordinalPos": 0,
                                "dataType": null,
                                "name": null,
                                "size": 0,
                                "format": null,
                                "isRequired": false,
                                "defaultValue": null,
                                "validation": null,
                                "isKeyColumn": false,
                                "functionAttributeId": null,
                                "configMeta": null
                            }],
                            "configMeta": null
                        }, {
                            "type": "VERTICA",
                            "mappable": true,
                            "mapsTo": -1,
                            "mapsFrom": 0,
                            "file": false,
                            "attributes": [{
                                "key": "MAPPINGTYPE",
                                "value": "",
                                "configMeta": null
                            }, {
                                "key": "CONNECTIONID",
                                "value": "",
                                "configMeta": null
                            }, {
                                "key": "TABLENAME",
                                "value": "",
                                "configMeta": null
                            }],
                            "fields": [{
                                "key": "FIELD",
                                "value": "",
                                "ordinalPos": 0,
                                "dataType": null,
                                "name": null,
                                "size": 0,
                                "format": null,
                                "isRequired": false,
                                "defaultValue": null,
                                "validation": null,
                                "isKeyColumn": false,
                                "functionAttributeId": null,
                                "configMeta": null
                            }],
                            "configMeta": null
                        }],
                        "configMeta": null
                    };
                },
                getFileFeed: function() {
                    return {
                        "type": "FILE",
                        "mappable": false,
                        "mapsTo": 0,
                        "mapsFrom": -1,
                        "file": true,
                        "attributes": [{
                            "key": "FEEDID",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "DELIMITER",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "HEADER",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "QUALIFIER",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "TERMINATOR",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "FILEREGEX",
                            "value": "",
                            "configMeta": null
                        }],
                        "fields": [{
                            "key": "FIELD",
                            "value": "",
                            "ordinalPos": 0,
                            "dataType": null,
                            "name": null,
                            "size": 0,
                            "format": null,
                            "isRequired": false,
                            "defaultValue": null,
                            "validation": null,
                            "isKeyColumn": false,
                            "functionAttributeId": null,
                            "configMeta": null
                        }],
                        "configMeta": null
                    };
                },
                getVerticaFeed: function() {
                    return {
                        "type": "VERTICA",
                        "mappable": true,
                        "mapsTo": -1,
                        "mapsFrom": 0,
                        "file": false,
                        "attributes": [{
                            "key": "MAPPINGTYPE",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "CONNECTIONID",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "TABLENAME",
                            "value": "",
                            "configMeta": null
                        }],
                        "fields": [{
                            "key": "FIELD",
                            "value": "",
                            "ordinalPos": 0,
                            "dataType": null,
                            "name": null,
                            "size": 0,
                            "format": null,
                            "defaultValue": null,
                            "validation": null,
                            "isKeyColumn": false,
                            "functionAttributeId": null,
                            "configMeta": null
                        }],
                        "configMeta": null
                    };
                },
                getField: function() {
                    return {
                        "key": "FIELD",
                        "value": "",
                        "ordinalPos": 0,
                        "dataType": null,
                        "name": null,
                        "size": 0,
                        "format": null,
                        "defaultValue": null,
                        "validation": null,
                        "isKeyColumn": false,
                        "functionAttributeId": null,
                        "configMeta": null
                    };
                },
                getDatabaseTableConfigModel: function() {
                    return {
                        "name": null,
                        "connectionId": 0,
                        "behavior": null,
                        "relationshipType": null,
                        "tableType": null,
                        "columns": [{
                            "name": "COLUMN_NAME",
                            "dataType": "TEXT",
                            "size": null,
                            "ordinalPos": 0,
                            "nullable": true,
                            "defaultValue": null,
                            "configMeta": null,
                            "primaryKey": false
                        }],
                        "configMeta": null
                    };
                },
                getColumnModel: function() {
                    return {
                        "name": "COLUMN_NAME",
                        "dataType": "TEXT",
                        "size": null,
                        "ordinalPos": 0,
                        "nullable": true,
                        "defaultValue": null,
                        "configMeta": null,
                        "primaryKey": false
                    };
                },
                getListElementConfigModel: function() {
                    return {
                        "name": null,
                        "status": "READY",
                        "isTemplate": false,
                        "prefix": null,
                        "suffix": null,
                        "parentListId": null,
                        "configMeta": null,
                        "connectionId": 0
                    };
                },
                getSqlEbModuleModel: function() {
                    return {
                        "type": "SQL",
                        "subType": "EB",
                        "ordinalPos": 2,
                        "attributes": [{
                            "key": "FAILUREEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "SUCCESSEMAILTO",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "LISTID",
                            "value": "",
                            "configMeta": null
                        }],
                        "feeds": [{
                            "type": "MULTITABLE",
                            "mappable": true,
                            "mapsTo": -1,
                            "mapsFrom": 0,
                            "file": false,
                            "attributes": [{
                                "key": "TABLENAME",
                                "value": "",
                                "ordinalPos": 0,
                                "configMeta": null
                            }, {
                                "key": "CONNECTIONID",
                                "value": "",
                                "ordinalPos": 0,
                                "configMeta": null
                            }, {
                                "key": "MAPPINGTYPE",
                                "value": "",
                                "ordinalPos": 0,
                                "configMeta": null
                            }],
                            "fields": [{
                                "key": "TABLE.FIELD",
                                "value": "",
                                "ordinalPos": 0,
                                "dataType": null,
                                "name": null,
                                "size": 0,
                                "format": null,
                                "isRequired": false,
                                "defaultValue": null,
                                "validation": null,
                                "isKeyColumn": false,
                                "functionAttributeId": null,
                                "configMeta": null
                            }],
                            "configMeta": null
                        }],
                        "configMeta": null
                    };
                },
                getMultiTableFeedModel: function() {
                    return {
                        "type": "MULTITABLE",
                        "mappable": true,
                        "mapsTo": -1,
                        "mapsFrom": 0,
                        "file": false,
                        "attributes": [{
                            "key": "TABLENAME",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "CONNECTIONID",
                            "value": "",
                            "configMeta": null
                        }, {
                            "key": "MAPPINGTYPE",
                            "value": "",
                            "configMeta": null
                        }],
                        "fields": [{
                            "key": "TABLE.FIELD",
                            "value": "",
                            "ordinalPos": 0,
                            "dataType": null,
                            "name": null,
                            "size": 0,
                            "format": null,
                            "isRequired": false,
                            "defaultValue": null,
                            "validation": null,
                            "isKeyColumn": false,
                            "functionAttributeId": null,
                            "configMeta": null
                        }],
                        "configMeta": null
                    };
                },
                getSftpFilePattern: function(prefix, suffix) {
                    // Build regex given prefix and suffix, assume only * and ?
                    // convert * to [A-Za-z0-9_ -]*
                    // convert ? to [A-Za-z0-9_ -]
                    // eg filename_???_text* .dat --> filename_[A-Za-z0-9_ -][A-Za-z0-9_ -][A-Za-z0-9_ -]_text[A-Za-z0-9_ -]*\.dat
                    // don't forget to escape the period in suffix

                    var filePattern = prefix + suffix;
                    var filePatternCleaned = filePattern.replace(/\?*\*\?+/g, '*');

                    // preceding
                    filePatternCleaned = filePatternCleaned.replace(/\?*\*+/g, '*');

                    // trailing
                    filePatternCleaned = filePatternCleaned.replace(/\*\?+/g, '*');

                    // replace concurrent stars
                    filePatternCleaned = filePatternCleaned.replace(/\**\*\*+/g, '*');

                    // convert to regex ?
                    var filePatternRegex = filePatternCleaned.replace(/\?/g, '[A-Za-z0-9_ -]');

                    filePatternRegex = filePatternRegex.replace(/\*/g, '[A-Za-z0-9_ -]*');

                    filePattern = filePatternRegex;

                    return filePattern;
                }
            };
        }])
    .service('wizardService', ['$rootScope', 'wizardFactory', 'scheduleService', function($rootScope, wizardFactory, scheduleService) {
        'use strict';
        var _partial = {};

        // Tracks the maximum accessible step number
        var _maxStep = 1;

        // A directly exposed handle to saved states for each view that is
        // managed by this wizardService singleton.  This is not the same as
        // the job configuration template because it isn't meant to store any
        // job configuration data.  Rather, this merely saves state of UI
        // elements and the fetched data that drives them so that the user can
        // freely bounce between wizard steps without losing inputs or breaking
        // the wizard.
        var _viewStates = {};

        // step 1
        var _jobType = {};
        var _jobConfig = {};
        var _moduleTypes = [];

        // step 2
        var _moduleType = [];
        var _feed = {};

        // step 3
        var _previewRecords = {};
        var _header = false;
        var _delimiter = {};
        var _isFreeFormDelimiter = false;
        var _freeFormDelimiter = null;
        var _qualifier = {};
        var _terminator = {};
        var _headerRecord = [];
        var _records = [];
        var _orderedColumns = [];

        // step 4
        var _mapSelectedConnection = {};
        var _mapSelectedMappingType = {};
        var _mapSelectedMappableObject = {};
        var _isNewMappableObject = false;
        var _newMappableObject = {};
        var _mappingBehaviour = {};
        var _mappingLoadType = {};
        var _listElement = {};
        var _mappingRecords = [];
        var _destinationRecords = [];
        var _mapSelectedKey = [];
        var _sdmFields = [];

        // Transformation Step
        var _transformRules = [];


        var _reservedTableColumnNames = ["LIST_RECORD_ID", "LIST_ID", "LIST_NAME", "CUSTOMER_ID", "INSERT_DATE", "UPDATE_DATE"];

        return {
            init: function() {
                var obj = {};
                var ary = [];
                this.setPartial(obj);
                this.setMaxStep(1);
                this.setJobType(obj);
                this.setJobConfig(obj);
                this.setModuleTypes(ary);
                this.setModuleType(obj);
                this.setFeed(obj);
                this.setPreviewRecords(obj);
                this.setHeaderRecord(ary);
                this.setRecords(ary);
                this.setHeader(false);
                this.setDelimiter(obj);
                this.setFreeFormDelimiter(null);
                this.setIsFreeFormDelimiter(false);
                this.setQualifier(obj);
                this.setTerminator(obj);
                this.setOrderedColumns(ary);
                this.setMapSelectedConnection(obj);
                this.setMapSelectedMappingType(obj);
                this.setMapSelectedMappableObject(obj);
                this.setIsNewMappableObject(false);
                this.setNewMappableObject(obj);
                this.setMappingBehaviour(obj);
                this.setMappingLoadType(obj);
                this.setMappingRecords(ary);
                this.setDestinationRecords(ary);
                this.setMapSelectedKey(ary);
                this.setSdmFields(ary);
                this.setListElement(obj);
                this.setTransformRules([]);
                this.resetViewStates();

                // Also initialize all subscribing partials by simulating a
                // cancel event.
                $rootScope.$broadcast('wizardService:cancelWizard');

                // Reset the schedule partial, which is shared by other modules.
                scheduleService.clearSchedule();
                scheduleService.resetSchedule();
            },
            cancelWizard: function() {
                $rootScope.$broadcast('wizardService:cancelWizard');
                this.setTransformRules([]);
                this.resetViewStates();
            },
            getPartial: function() {
                return _partial;
            },
            setPartial: function(partial) {
                _partial = partial;
            },

            /**
             * Sets the maximum accessible wizard step number.
             *
             * @param newValue {number} The new step number.
             */
            setMaxStep: function(newValue) {
                this._maxStep = newValue;
            },

            /**
             * Gets the maximum accessible wizard step number.
             *
             * @returns {number}
             */
            getMaxStep: function() {
                return this._maxStep;
            },

            setPartialById: function(partialId) {
                var stepParts = wizardFactory.getPartials()
                    , stepCount = stepParts.length
                    , stepIndex
                    , evalStep
                ;

                for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
                    evalStep = stepParts[stepIndex];
                    if (evalStep.id === partialId) {
                        this.setPartial(evalStep);
                        break;
                    }
                }
            },

            /**
             * Handle to a name-spaced collection of view state data that must
             * be preserved as the user steps or bounces through the wizard.
             * Apart from a cache of server-populated control data and control
             * states outside of job builder data, no user input should be saved
             * to this object reference.  Parts of this object are wholesale
             * wiped out based on user actions that invalidate other steps, so
             * do not use this as a permanent store.
             */
            viewStates: _viewStates,

            /**
             * Fully purges the view-states cache.
             *
             * @returns {object} this
             */
            resetViewStates: function() {
                var propName;

                if (null === _viewStates) {
                    _viewStates = {};
                } else {
                    for (propName in _viewStates) {
                        if (_viewStates.hasOwnProperty(propName)) {
                            delete _viewStates[propName];
                        }
                    }
                }

                return this;
            },

            /**
             * Resets the view and job builder data for all steps following the
             * active step, presumably because a material change has occurred
             * on the active step that invalidates all later wizard data.
             */
            invalidateLaterSteps: function() {
                var activeStep = this.getPartial()
                    , stepNumber = activeStep.step + 1
                ;

                // Disallow stepping beyond the next invalidated step
                this._maxStep = stepNumber;

                switch (stepNumber) {
                    case 1: // Job
                        // Nothing after this page depends on values here
                        /* falls through */
                    case 2: // Data
                        // All later steps heavily depend on values here
                        this.setFeed({});
                        this.setPreviewRecords({});
                        this.setHeaderRecord([]);
                        this.setHeader(false);
                        this.setRecords([]);
                        this.setFreeFormDelimiter(null);
                        this.setIsFreeFormDelimiter(false);
                        delete _viewStates.wizardStep3DefineController;
                        /* falls through */
                    case 3: // Define
                        // Changes here invalidate transformations
                        this.setTransformRules([]);
                        delete _viewStates.wizardTransformStepController;
                        /* falls through */
                    case 4: // Transform
                        // Later steps dynamically load changes from this page,
                        // so they don't need to be invalidated.
                        /* falls through */
                    case 5: // Map
                        delete _viewStates.wizardStep4MapController;
                        /* falls through */
                    case 6: // Customize
                        // Nothing after this page depends on values here
                        break;
                    default: // Unknown page
                        window.console.log(
                            "INTERNAL ERROR:  Unknown wizard step number, "
                            + stepNumber
                            + ", given to invalidateLaterSteps."
                        );
                }
            },

            getJobType: function() {
                return _jobType;
            },
            setJobType: function(jobType) {
                _jobType = jobType;
            },

            /**
             * Sets the data transformation rules, collected from the Transform
             * step of the New Job Wizard.
             *
             * @param newValue {Array} The new transformation rules
             */
            setTransformRules: function(newValue) {
                _transformRules = newValue;
            },

            /**
             * Synchronizes the internal mapping records with the output columns
             * of all selected transformation functions, adding and removing
             * records as needed.
             *
             * @returns {object} this
             */
            syncMappingRecordsWithTransformOutputs: function() {
                var mappingRecords = this.getMappingRecords()
                    , trnRules = this.getTransformRules()
                        .filter(function(o) {
                            // Interested only in functions with output
                            return (
                                (undefined !== o.outputs)
                                && (0 < o.outputs.length)
                            );
                        })
                    , ruleCount = trnRules.length
                    , outAttributeIDs = trnRules
                        .map(function(o) {
                            // Reduce to only arrays of output attribute
                            // identifiers for each selected function.
                            return o.outputs.map(function(e) {
                                return e.attributeID;
                            });
                        })
                    , allMappedIDs = [].concat.apply([], outAttributeIDs)
                    , ordinalPos = 0
                    , oldMappedIDs = mappingRecords
                        .filter(function(o) {
                            // Snag the highest ordinal position while we are
                            // already scanning all the mapping records.
                            if (o.ordinalPos > ordinalPos) {
                                ordinalPos = o.ordinalPos;
                            }

                            // Keep only those records that are output from a
                            // transformation function.
                            return (
                                (undefined !== o.functionAttributeId)
                                && (null !== o.functionAttributeId)
                            );
                        })
                        .map(function(o) {
                            return o.functionAttributeId;
                        })
                    , mappedID
                    , ruleOutputs
                    , outCount
                    , outIndex
                    , evalRec
                    , i
                ;

                // Remove function output records that are no longer mapped
                for (i = 0; i < mappingRecords.length; i++) {
                    evalRec = mappingRecords[i];
                    mappedID = evalRec.functionAttributeId;
                    if ((undefined !== mappedID)
                        && (null !== mappedID)
                        && (0 > allMappedIDs.indexOf(mappedID))
                    ) {
                        mappingRecords.splice(i, 1);
                        i--;
                    }
                }

                // Add function output records that have been newly mapped
                for (i = 0; i < ruleCount; i++) {
                    ruleOutputs = trnRules[i].outputs;
                    outCount = ruleOutputs.length;

                    for (outIndex = 0; outIndex < outCount; outIndex++) {
                        evalRec = ruleOutputs[outIndex];
                        mappedID = evalRec.attributeID;

                        if (0 > oldMappedIDs.indexOf(mappedID)) {
                            mappingRecords.push({
                                name: evalRec.columnName
                                , ordinalPos: ++ordinalPos
                                , isKeyColumn: false
                                , inputName: evalRec.columnName
                                , destName: evalRec.columnName
                                , isSdmMapping: false
                                , isRequired: false
                                , dataTypeId:
                                    wizardFactory.getDataTypeIDFromName(
                                        evalRec.dataType
                                    )
                                , size: evalRec.size
                                , format: null
                                , defaultValue: null
                                , mappedDestinationOrdinalPos: null
                                , mappedSdmFieldId: null
                                , functionAttributeId: mappedID
                                , isTransformOutput: true
                            });
                        }
                    }
                }

                return this;
            },

            /**
             * Gets a reference to the present data transformation rules.
             *
             * @returns {Array}
             */
            getTransformRules: function() {
                return _transformRules;
            },

            getJobConfig: function() {
                return _jobConfig;
            },
            setJobConfig: function(jobConfig) {
                _jobConfig = jobConfig;
            },
            getModuleTypes: function() {
                return _moduleTypes;
            },
            setModuleTypes: function(moduleTypes) {
                _moduleTypes = moduleTypes;
            },
            getModuleType: function() {
                return _moduleType;
            },
            setModuleType: function(moduleType) {
                _moduleType = moduleType;
            },
            getFeed: function() {
                return _feed;
            },
            setFeed: function(feed) {
                _feed = feed;
            },
            getPreviewRecords: function() {
                return _previewRecords;
            },
            setPreviewRecords: function(previewRecords) {
                _previewRecords = previewRecords;
            },
            setHeaderRecord: function(headerRecord) {
                _headerRecord = headerRecord;
            },
            getHeaderRecord: function() {
                return _headerRecord;
            },
            setRecords: function(records) {
                _records = records;
            },
            getRecords: function() {
                return _records;
            },
            getHeader: function() {
                return _header;
            },
            setHeader: function(header) {
                _header = header;
            },
            getDelimiter: function() {
                return _delimiter;
            },
            setDelimiter: function(delimiter) {
                _delimiter = delimiter;
            },
            resetDelimiter: function() {
                var obj = {};
                this.setDelimiter(obj);
            },
            getFreeFormDelimiter: function() {
                return _freeFormDelimiter;
            },
            setFreeFormDelimiter: function(freeFormDelimiter) {
                _freeFormDelimiter = freeFormDelimiter;
            },
            isFreeFormDelimiter: function() {
                return _isFreeFormDelimiter;
            },
            setIsFreeFormDelimiter: function(isFreeFormDelimiter) {
                _isFreeFormDelimiter = isFreeFormDelimiter;
            },
            getQualifier: function() {
                return _qualifier;
            },
            setQualifier: function(qualifier) {
                _qualifier = qualifier;
            },
            getTerminator: function() {
                return _terminator;
            },
            setTerminator: function(terminator) {
                _terminator = terminator;
            },
            getOrderedColumns: function() {
                return _orderedColumns;
            },
            setOrderedColumns: function(orderedColumns) {
                _orderedColumns = orderedColumns;
            },
            clearOrderedColumns: function() {
                var ary = [];
                this.setOrderedColumns(ary);
            },
            getMapSelectedConnection: function() {
                return _mapSelectedConnection;
            },
            setMapSelectedConnection: function(mapSelectedConnection) {
                _mapSelectedConnection = mapSelectedConnection;
            },
            getMapSelectedMappingType: function() {
                return _mapSelectedMappingType;
            },
            setMapSelectedMappingType: function(mapSelectedMappingType) {
                _mapSelectedMappingType = mapSelectedMappingType;
            },
            getMapSelectedMappableObject: function() {
                return _mapSelectedMappableObject;
            },
            setMapSelectedMappableObject: function(mapSelectedMappableObject) {
                _mapSelectedMappableObject = mapSelectedMappableObject;
            },
            isNewMappableObject: function() {
                return _isNewMappableObject;
            },
            setIsNewMappableObject: function(newMappableObject) {
                _isNewMappableObject = newMappableObject;
            },
            getNewMappableObject: function() {
                return _newMappableObject;
            },
            setNewMappableObject: function(newMappableObject) {
                _newMappableObject = newMappableObject;
            },
            getMappingBehaviour: function() {
                return _mappingBehaviour;
            },
            setMappingBehaviour: function(mappingBehaviour) {
                _mappingBehaviour = mappingBehaviour;
            },
            getMappingLoadType: function() {
                return _mappingLoadType;
            },
            setMappingLoadType: function(mappingLoadType) {
                _mappingLoadType = mappingLoadType;
            },
            getMappingRecords: function() {
                return _mappingRecords;
            },
            setMappingRecords: function(mappingRecords) {
                _mappingRecords = mappingRecords;
            },
            setListElement: function(listElement) {
                _listElement = listElement;
            },
            getListElement: function() {
                return _listElement;
            },
            getDestinationRecords: function() {
                return _destinationRecords;
            },
            setDestinationRecords: function(destinationRecords) {
                _destinationRecords = destinationRecords;
            },
            getMapSelectedKey: function() {
                return _mapSelectedKey;
            },
            setMapSelectedKey: function(mapSelectedKeys) {
                var mapRecs = this.getMappingRecords()
                    , mapCount = mapRecs.length
                    , mapIndex
                    , evalMap
                ;

                var previousKeyResult = this.isNewKey(mapSelectedKeys);

                //if(this.isNewKey(mapSelectedKeys)) {
                //    _mapSelectedKey.push(mapSelectedKeys);
                //}

                // Update the mapping records to set this selected column as the
                // key column.
                for (mapIndex = 0; mapIndex < mapCount; mapIndex++) {
                    evalMap = mapRecs[mapIndex];

                    //window.console.error("start: " + JSON.stringify(evalMap));

                    // allow for multiple columns/fields to be selected as a key. TODO probably need to allow removing keys
                    if(!evalMap.isKeyColumn) {

                       evalMap.isKeyColumn =
                            (mapSelectedKeys.ordinalPos === evalMap.ordinalPos);
                    } else {
                        if(previousKeyResult != undefined) {
                            if(!evalMap.isSdmMapping) {
                                if (evalMap.name === previousKeyResult) {
                                    evalMap.isKeyColumn = false;
                                    evalMap.destName = evalMap.name;
                                    evalMap.dataTypeId = 1;
                                    evalMap.size = 50;
                                }
                            }   else if (evalMap.inputName === previousKeyResult){
                                    evalMap.isKeyColumn = false;
                                    evalMap.name = previousKeyResult;
                                    evalMap.value = previousKeyResult;
                                }
                       }
                    }

                    //window.console.error("end: " + JSON.stringify(evalMap));
                }
            },
            isNewKey: function(mapSelectedKeys) {
                if(mapSelectedKeys.mappedSdmKey != undefined) {

                    var k = 0
                        , m = 0
                        , kl = mapSelectedKeys.mappedSdmKey.length;

                    for (k = 0; k < kl; k++) {
                        var selectedKeyName = mapSelectedKeys.mappedSdmKey[k].name;

                        if (_mapSelectedKey != undefined) {

                            var ml = _mapSelectedKey.length
                                , result = false
                                , previousKey = undefined;

                            for (m = 0; m < ml; m++) {
                                if (selectedKeyName === _mapSelectedKey[m].mappedSdmKey[0].name) {
                                    previousKey = _mapSelectedKey[m].name;
                                    result = true;
                                    break;
                                }
                            }

                            if (result) {
                                _mapSelectedKey.splice(m, 1);
                                _mapSelectedKey.push(mapSelectedKeys);
                                return previousKey;
                            } else {
                                _mapSelectedKey.push(mapSelectedKeys);
                                return undefined;
                            }
                        } else {
                            _mapSelectedKey.push(mapSelectedKeys);
                            return undefined;
                        }
                    }
                } else {
                    return undefined;
                }
            },
            clearMapSelectedKey: function() {
                _mapSelectedKey = [];
            },
            getSdmFields: function() {
                return _sdmFields;
            },
            setSdmFields: function(sdmFields) {
                _sdmFields = sdmFields;
            }

            , getRecordSet: function(
                previewData
                , fieldDelimiter
                , textQualifier
            ) {
                var previewDataArray
                    , previewHeaderDataArray
                    , numberOfColumns
                    , previewLength
                    , headerRecord = []
                    , records = []
                    , n
                    , i
                    , k
                    , newRecord
                    , currentHeaderFieldName
                    , hasHeader
                    ;

                hasHeader = (this.getHeader() !== false);

                previewDataArray = this.getPreviewDataArray(previewData, fieldDelimiter, textQualifier);

                numberOfColumns = previewDataArray[0].length;
                if (hasHeader === true) {
                    previewHeaderDataArray = previewDataArray.shift();
                }
                previewLength = previewDataArray.length;

                // Define header (first record, always assume generics)
                for (n = 0; n < numberOfColumns; n++) {
                    if (angular.isUndefined(previewHeaderDataArray)
                        || angular.isUndefined(previewHeaderDataArray[n])) {
                        currentHeaderFieldName = "field_" + (n + 1);
                    }
                    else {
                        currentHeaderFieldName = previewHeaderDataArray[n];
                    }
                    headerRecord.push({name: currentHeaderFieldName, ordinalPos: n});
                }

                // Define data set (records)
                for (i = 0; i < previewLength; i++) {
                    newRecord = {};
                    for (k = 0; k < numberOfColumns; k++) {
                        newRecord[k] = previewDataArray[i][k];
                    }
                    records.push(newRecord);
                }

                return [headerRecord, records];
            },

            getPreviewDataArray: function(
                previewData
                , fieldDelimiter
                , textQualifier) {
                previewData = previewData || this.getPreviewRecords();
                if ( (previewData === null) || (previewData === undefined) ) {
                    throw "Unhandled exception: Preview is null or undefined";
                }

                // Identify the selected text qualifier.  When not selected, it
                // will be the literal value, none.
                textQualifier = textQualifier || this.getQualifier().value;
                if ("none" === textQualifier) {
                    textQualifier = "";
                }

                if (this.isFreeFormDelimiter()) {
                    fieldDelimiter = fieldDelimiter || this.getFreeFormDelimiter().value;
                }   else {
                    fieldDelimiter = fieldDelimiter || this.getDelimiter().value;
                }

                return this.CSVToArray(
                    previewData
                    , fieldDelimiter
                    , textQualifier
                );
            },

            /**
             * This will parse a delimited string into an array of arrays. The
             * default delimiter is the comma, but this can be overridden in the
             * second argument.
             *
             * @param csvData {string} The data to parse
             * @param fieldDelimiter {string} The field delimiter (,|;Tab)
             * @param textQualifier {string} The text qualifier ("')
             * @returns {*[]}
             */
            CSVToArray: function(csvData, fieldDelimiter, textQualifier) {
                var matchPattern
                    , parsedData = [[]] // Create an array to hold our data. Give the array a default empty first row.
                    , patternMatches    // Create an array to hold our individual pattern matching groups.
                    , matchedValue
                    , matchedDelimiter
                    , matchDoubleQualifier = ""
                ;

                // Check to see if the delimiters are defined.  If not, then
                // use sensible defaults.
                fieldDelimiter = (fieldDelimiter || ",");

                // Create a regular expression to parse the CSV values.
                if (textQualifier) {
                    matchPattern = new RegExp(
                        (   "(\\" + fieldDelimiter + "|\\r?\\n|\\r|^)"  // Field and row delimiters
                            + "(?:" + textQualifier + "([^" + textQualifier + "]*(?:" + textQualifier + textQualifier + "[^" + textQualifier + "]*)*)" + textQualifier + "" // Qualified fields
                            + "|([^" + textQualifier + "\\" + fieldDelimiter + "\\r\\n]*))" // Bare fields
                        ), "g"
                    );

                    // Build a Regular Expression for detecting double-up text
                    // delimiters.
                    matchDoubleQualifier = new RegExp(textQualifier + textQualifier, "g");
                } else {
                    // Only using field and row delimiters
                    matchPattern = new RegExp(
                        "(\\" + fieldDelimiter + "|\\r?\\n|\\r|^)"
                        + "([^\\" + fieldDelimiter + "\\r\\n]*)" // Bare fields
                        , "g"
                    );
                }

                // Keep looping over the regular expression matches until we can
                // no longer find a match.
                patternMatches = matchPattern.exec(csvData);
                while (patternMatches) {
                    // Get the delimiter that was found.
                    matchedDelimiter = patternMatches[1];

                    // Check to see if the given delimiter has a length (is not
                    // the start of string) and if it matches field delimiter.
                    // If it does not, then we know that this delimiter is a row
                    // delimiter.
                    if (matchedDelimiter.length &&
                        (matchedDelimiter !== fieldDelimiter)
                    ) {
                        // Since we have reached a new row of data, add an empty
                        // row to our data array.
                        parsedData.push([]);
                    }

                    // Now that we have our delimiter out of the way, let's
                    // check to see which kind of value we captured (qualified
                    // or not).
                    if (patternMatches[2]) {
                        if (textQualifier) {
                            // We found a qualified value. When we capture this
                            // value, unescape any double qualifiers.
                            matchedValue = patternMatches[2].replace(
                                matchDoubleQualifier, textQualifier
                            );
                        } else {
                            // Non-qualified values are copied as-is.
                            matchedValue = patternMatches[2];
                        }
                    } else {
                        // We found a non-qualified value.
                        matchedValue = patternMatches[3];
                    }

                    // Now that we have our value string, let's add it to the
                    // data array.
                    parsedData[parsedData.length - 1].push(matchedValue);

                    // Find the next match
                    patternMatches = matchPattern.exec(csvData);
                }

                // Return the parsed data.
                return parsedData;
            },

            validateHeaderOrColumnName: function(data) {
                var regex = /^[A-Za-z0-9][A-Za-z0-9_]{0,29}$/;
                if (!regex.test(data)) {
                    return 'Length between 1 and 30 chars, contain only "_", A-Z, a-z, 0-9';
                }
                var regexKeywords = /^cdi/i;
                if (regexKeywords.test(data)) {
                    return 'The prefix \'cdi\' is reserved';
                }
            },

            /**
             * Resets the mapping records, preserving keys and ordinal positions
             * found in the header record.
             *
             * @returns {Array} Collection of mapping records
             *  (this._mappingRecords)
             */
            generateMappingRecords: function() {
                var mappingRecords = []
                    , headerRecord = this.getHeaderRecord()
                    , headerRecordCount = headerRecord.length
                    , headerRecordIndex
                    , nextRecord = null
                    , nextName = ''
                    , nextPosition = 0
                ;

                for (headerRecordIndex = 0;
                     headerRecordIndex < headerRecordCount;
                     headerRecordIndex++
                ) {
                    nextName = headerRecord[headerRecordIndex].name;
                    nextPosition = headerRecord[headerRecordIndex].ordinalPos;
                    nextRecord = {
                        name: nextName
                        , ordinalPos: nextPosition
                        , isKeyColumn: false
                        , inputName: nextName
                        , destName: this.checkDestName(nextName)
                        , isSdmMapping: false
                        , isRequired: false
                        , dataTypeId: 1
                        , size: 50
                        , format: null
                        , defaultValue: null
                        , mappedDestinationOrdinalPos: null
                        , mappedSdmFieldId: null
                    };

                    mappingRecords.push(nextRecord);
                }

                this.setMappingRecords(mappingRecords);
                return mappingRecords;
            },

            checkDestName: function(destName) {
                var checkRegEx = /^[A-Za-z0-9][A-Za-z0-9_]*$/
                    , cleanedDestName
                    , filterChar
                    , i
                ;

                if (!checkRegEx.test(destName)) {
                    cleanedDestName = '';
                    for (i = 0; i < destName.length; i++) {
                        filterChar = destName.charAt(i);

                        if (checkRegEx.test(filterChar)) {
                            cleanedDestName = cleanedDestName + filterChar;
                        } else {
                            cleanedDestName = cleanedDestName + "_";
                        }
                    }
                    return cleanedDestName;
                }

                return destName;
            },

            generateDestinationRecords: function() {
                var destinationRecords = []
                    , mapSelectedMappableObject = this.getMapSelectedMappableObject()
                    , mapCols
                    , colCount
                    , mapColumn
                    , colName
                    , colIndex
                ;

                if (jQuery.isEmptyObject(mapSelectedMappableObject)) {
                    throw "The destination is not defined";
                }

                mapCols = mapSelectedMappableObject.columns;
                if (jQuery.isEmptyObject(mapCols)) {
                    throw "There was an error retrieving the destination fields";
                }

                colCount = mapCols.length;
                for (colIndex = 0; colIndex < colCount; colIndex++) {
                    mapColumn = mapCols[colIndex];
                    colName = mapColumn.name;

                    if ((colName.substring(0,4) !== "CDI_")
                        && (colName !== "CUSTOMER_ID")
                        && (-1 === _reservedTableColumnNames.indexOf(colName))
                    ) {
                        destinationRecords.push({
                            name: colName
                            , ordinalPos: mapColumn.ordinalPos
                            , primaryKey: mapColumn.primaryKey
                            , dataType: mapColumn.dataType
                            , defaultValue: mapColumn.defaultValue
                            , size: Math.ceil(mapColumn.size / 3)
                        });
                    }
                }

                this.setDestinationRecords(destinationRecords);
                return destinationRecords;
            },

            matchMappingRecordsToDestination: function() {
                var mapRecords = this.getMappingRecords()
                    , destRecs = this.getDestinationRecords()
                    , mrCount = mapRecords.length
                    , destCount = destRecs.length
                    , mapRecord
                    , destRecord
                    , i
                    , k
                ;

                if (jQuery.isEmptyObject(mapRecords)) {
                    throw "The mapping records are not defined";
                }

                if (jQuery.isEmptyObject(destRecs)) {
                    throw "The destination records are not defined";
                }

                // Update only known destination records
                for (i = 0; i < destCount; i++) {
                    destRecord = destRecs[i];

                    // for each destination record
                    for (k = 0; k < mrCount; k++) {
                        mapRecord = mapRecords[k];

                        // map PK
                        if (mapRecord.isKeyColumn && destRecord.primaryKey) {
                            mapRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(destRecord.dataType);
                            mapRecord.destName = destRecord.name;
                            mapRecord.isSdmMapping = false;
                            mapRecord.mappedDestinationOrdinalPos = destRecord.ordinalPos;
                            mapRecord.mappedSdmFieldId = null;
                            mapRecord.size = destRecord.size;
                            break;

                        // check to see if the name of the mapping record matches the destination record
                        } else if (mapRecord.name.toUpperCase() === destRecord.name.toUpperCase()) {
                            mapRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(destRecord.dataType);
                            mapRecord.destName = destRecord.name;
                            mapRecord.isSdmMapping = false;
                            mapRecord.mappedDestinationOrdinalPos = destRecord.ordinalPos;
                            mapRecord.mappedSdmFieldId = null;
                            mapRecord.size = destRecord.size;
                            break;
                        }
                    }
                }

                // check mapping records for destination mapping
                // if mappedDestinationOrdinalPos is null
                // set to destName to 'not mapped' if not mapped to a destination.
                // TODO - potential code refractor to put into above for loops
                for (k = 0; k < mrCount; k++) {
                    mapRecord = mapRecords[k];

                    if(mapRecord.mappedDestinationOrdinalPos === null) {
                        mapRecord.destName = "not mapped";
                    }
                }

                return this;
            },

            setMappingRecordToDestinationRecord: function(
                destinationRecordOrdinalPos
                , mappingRecordIndex
            ) {
                var mapRecs = this.getMappingRecords()
                    , mapRec = mapRecs[mappingRecordIndex]
                    , destRecs = this.getDestinationRecords()
                    , destRecCount = destRecs.length
                    , destinationRecordIndex
                    , destRec
                    , n
                ;

                for (n = 0; n < destRecCount; n++) {
                    if (destRecs[n].ordinalPos === destinationRecordOrdinalPos) {
                        destinationRecordIndex = n;
                        break;
                    }
                }

                destRec = destRecs[destinationRecordIndex];
                mapRec.destName = destRec.name;
                mapRec.mappedDestinationOrdinalPos = destRec.ordinalPos;
                mapRec.dataTypeId = wizardFactory.getDataTypeIDFromName(destRec.dataType);
                mapRec.size = destRec.size;
            },

            resetMappingRecord: function(mappingRecordIndex) {
                var mapRecs = this.getMappingRecords()
                    , mapRec = mapRecs[mappingRecordIndex]
                ;

                // clear out defaults
                mapRec.isSdmMapping = false;
                mapRec.destName = null;
                mapRec.dataTypeId = null;
                mapRec.size = null;
                mapRec.mappedDestinationOrdinalPos = null;
                mapRec.mappedSdmFieldId = null;
                mapRec.format = null;
            },

            lookupKey: function(selectedKeys, inputName) {

                // TODO clean up but want to get working
                for(var i=0; i<selectedKeys.keyLookup.length; i++) {
                    if(selectedKeys.keyLookup[i].key.toUpperCase() === inputName.toUpperCase()) {
                        for(var z=0; z<selectedKeys.mappedSdmKey.length; z++) {
                            if(selectedKeys.mappedSdmKey[z].name.toUpperCase() === selectedKeys.keyLookup[i].value.toUpperCase()) {
                                return selectedKeys.mappedSdmKey[z];
                            }
                        }
                    }
                }

                return null;
            },

            /**
             * Automatically maps input table columns to List columns based on
             * column name matching.
             *
             * @param newList
             * @returns {Array} Collection of mapping records
             *  (this._mappingRecords)
             */
            matchMappingRecordsToListFields: function(newList) {
                var mappingRecords = this.getMappingRecords()
                    , listFields = this.generateDestinationRecords()
                    , mappingRecordCount = mappingRecords.length
                    , mappingRecord = null
                    , listFieldCount = listFields.length
                    , mapSelectedKeys = this.getMapSelectedKey()
                    , mskCount = mapSelectedKeys.length
                    , mapSelectedKey = null
                    , mappedSDMKey = null
                    , fieldMatcher = null
                    , mappingRecordIndex
                    , mskIndex
                    , listFieldIndex
                    , blnMapped
                    , listField
                ;

                if (jQuery.isEmptyObject(mappingRecords)) {
                    throw "The mapping records are not defined";
                }

                // for each mapping record
                for (mappingRecordIndex = 0;
                     mappingRecordIndex < mappingRecordCount;
                     mappingRecordIndex++
                ) {
                    mappingRecord = mappingRecords[mappingRecordIndex];

                    if (mappingRecord.isKeyColumn) {
                        // map key columns
                        for (mskIndex = 0; mskIndex < mskCount; mskIndex++) {
                            mapSelectedKey = mapSelectedKeys[mskIndex];

                            if (mappingRecord.ordinalPos === mapSelectedKey.ordinalPos) {

                                // find the select key in selected keys
                                //mappedSDMKey = mapSelectedKey.mappedSdmKey;
                                mappedSDMKey = this.lookupKey(mapSelectedKey, mappingRecord.inputName);
                                if(mappedSDMKey != null) {
                                    mappingRecord.destName = mappedSDMKey.name;
                                    mappingRecord.mappedDestinationOrdinalPos = mappedSDMKey.ordinalPos;
                                    mappingRecord.mappedSdmFieldId = null;
                                    mappingRecord.isSdmMapping = false;
                                    mappingRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(mappedSDMKey.dataType);
                                    mappingRecord.size = Math.ceil(mappedSDMKey.size / 3);
                                    break;
                                } else {
                                    throw "The mapped key(s) are not defined";
                                }
                            }
                        }
                    } else {
                        // map list columns fields
                        blnMapped = false;
                        for (listFieldIndex = 0;
                             listFieldIndex < listFieldCount;
                             listFieldIndex++
                        ) {
                            // check to see if the name of the mapping record matches the destination record
                            listField = listFields[listFieldIndex];

                            //if (mappingRecord.name.toUpperCase() === listField.name.toUpperCase()) {
                            if (this.testMappingRecordName(mappingRecord.name.toUpperCase(), listField.name.toUpperCase())) {
                                blnMapped = true;
                                mappingRecord.destName = listField.name;
                                mappingRecord.mappedDestinationOrdinalPos = listField.ordinalPos;
                                mappingRecord.isSdmMapping = false;
                                mappingRecord.mappedSdmFieldId = null;
                                mappingRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(listField.dataType);
                                mappingRecord.size = listField.size;
                                break;
                            }

                            fieldMatcher = null;
                        }

                        if (!blnMapped) {
                            if (newList) {
                                mappingRecord.destName = mappingRecord.destName.toUpperCase().replace(/ /g, "_");
                                mappingRecord.isSdmMapping = true;
                                mappingRecord.mappedSdmFieldId = null;
                                mappingRecord.dataTypeId = 1;
                                mappingRecord.size = 50;
                            } else {
                                mappingRecord.destName = "not mapped";
                                mappingRecord.isSdmMapping = false;
                                mappingRecord.mappedSdmFieldId = null;
                                mappingRecord.dataTypeId = null;
                                mappingRecord.size = null;
                            }
                        }
                    }
                }

                this.setMappingRecords(mappingRecords);
                return mappingRecords;
            }

            , testMappingRecordName: function(mappingRecordName, listFieldName) {
                if (mappingRecordName === listFieldName || mappingRecordName.replace(/ /g, "_") === listFieldName) {
                    return true;
                } else {
                    return false;
                }
            }

            , checkForSDM: function(sdmFields, mappingRecord) {
                var sdmField
                    , fieldMatcher
                    , sdmFieldIndex
                    , sdmFieldCount = sdmFields.length
                ;

                for (sdmFieldIndex = 0; sdmFieldIndex < sdmFieldCount; sdmFieldIndex++) {
                    // check to see if the name of the mapping record matches the destination record
                    sdmField = sdmFields[sdmFieldIndex];
                    fieldMatcher = new RegExp(sdmField.matchRegex, "i");

                    if ((mappingRecord.name.toUpperCase() === sdmField.column.toUpperCase())
                        || (mappingRecord.name.match(fieldMatcher))
                    ) {
                        mappingRecord.mappedSdmFieldId = sdmField.id;
                        mappingRecord.isSdmMapping = true;
                        mappingRecord.destName = sdmField.mapping;
                        break;
                    }
                }

                return mappingRecord;
            }

            /**
             * Automatically maps input table columns to Standard Data Model
             * columns based on column name matching.
             *
             * @returns {object} this
             */
            , matchMappingRecordsToSdmFields: function() {
                var mappingRecords = this.getMappingRecords()
                    , sdmFields = this.getSdmFields()
                    , mappingRecord = null
                    , mapSelectedKey = null
                    , mappedSDMKey = null
                    , sdmField = null
                    , fieldMatcher = null
                    , mappingRecordCount
                    , mappingRecordIndex
                    , sdmFieldCount
                    , mapSelectedKeys
                    , mskCount
                    , mskIndex
                    , sdm
                    , sdmFieldIndex
                ;

                if (jQuery.isEmptyObject(mappingRecords)) {
                    throw "The mapping records are not defined";
                }

                if (jQuery.isEmptyObject(sdmFields)) {
                    throw "The SDM fields are not defined";
                }

                mappingRecordCount = mappingRecords.length;
                sdmFieldCount = sdmFields.length;
                mapSelectedKeys = this.getMapSelectedKey();
                mskCount = mapSelectedKeys.length;

                // for each mapping record
                for (mappingRecordIndex = 0; mappingRecordIndex < mappingRecordCount; mappingRecordIndex++) {
                    mappingRecord = mappingRecords[mappingRecordIndex];

                    if (mappingRecord.isKeyColumn) {
                        // map key columns
                        for (mskIndex = 0; mskIndex < mskCount; mskIndex++) {
                            mapSelectedKey = mapSelectedKeys[mskIndex];

                            // find the select key in selected keys
                            mappedSDMKey = this.lookupKey(mapSelectedKey, mappingRecord.inputName);

                            if (mappingRecord.ordinalPos === mapSelectedKey.ordinalPos) {

                                if(mappedSDMKey != null) {
                                    //mappedSDMKey = mapSelectedKey.mappedSdmKey;
                                    sdm = this.checkForSDM(sdmFields, mappingRecord);
                                    mappingRecord.mappedSdmFieldId = sdm.mappedSdmFieldId;
                                    mappingRecord.isSdmMapping = sdm.isSdmMapping;
                                } else {
                                    throw "The mapped key(s) are not defined";
                                }

                                // if sdm field mapping calls a different function in the template pages
                                if (sdm.isSdmMapping) {
                                    mappingRecord.mappedDestinationOrdinalPos = mapSelectedKey.ordinalPos;
                                    mappingRecord.destName = sdm.destName;
                                    mappingRecord.value = mappedSDMKey.name;
                                    mappingRecord.name =  mappedSDMKey.name;
                                    mappingRecord.isSdmMapping = true;
                                } else {
                                    // TODO This needs to be updated to include the actual destination object which might be different
                                    mappingRecord.mappedDestinationOrdinalPos = mapSelectedKey.ordinalPos;
                                    mappingRecord.destName = mappedSDMKey.name;
                                }

                                // match data type
                                mappingRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(mappedSDMKey.dataType);
                                mappingRecord.size = Math.ceil(mappedSDMKey.size / 3);
                                break;
                            }
                        }
                    } else {
                        // map sdm fields
                        for (sdmFieldIndex = 0; sdmFieldIndex < sdmFieldCount; sdmFieldIndex++) {
                            // check to see if the name of the mapping record matches the destination record
                            sdmField = sdmFields[sdmFieldIndex];
                            fieldMatcher = new RegExp(sdmField.matchRegex, "i");

                            if (   (mappingRecord.name.toUpperCase() === sdmField.column.toUpperCase())
                                || (mappingRecord.name.match(fieldMatcher))
                            ) {
                                mappingRecord.destName = sdmField.mapping;
                                mappingRecord.mappedDestinationOrdinalPos = sdmField.ordinalPos;
                                mappingRecord.isSdmMapping = true;
                                mappingRecord.mappedSdmFieldId = sdmField.id;
                                mappingRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(sdmField.dataType);
                                mappingRecord.size = Math.ceil(sdmField.size / 3);
                                break;
                            }

                            fieldMatcher = null;
                        }
                    }
                }

                return this;
            }

            , setMappingRecordToSdmField: function(sdmFieldId, mappingRecordIndex) {
                var mapRecords = this.getMappingRecords()
                    , mapRecord = mapRecords[mappingRecordIndex]
                    , sdmFields = this.getSdmFields()
                    , sdmField
                    , n
                    , sdmFieldIndex
                ;

                for (n = 0; n < sdmFields.length; n++) {
                    if (sdmFields[n].id === sdmFieldId) {
                        sdmFieldIndex = n;
                        break;
                    }
                }

                sdmField = sdmFields[sdmFieldIndex];
                mapRecord.mappedSdmFieldId = sdmField.id;
                mapRecord.destName = sdmField.mapping;
                mapRecord.mappedDestinationOrdinalPos = sdmField.ordinalPos;
                mapRecord.dataTypeId = wizardFactory.getDataTypeIDFromName(sdmField.dataType);
                mapRecord.size = Math.ceil(sdmField.size / 3);
            }

            , buildJobConfig: function(jobConfigTemplate) {
                var jobConfig = this.getJobConfig();

                // Validate the present job configuration
                this.validateJobConfig();

                // Update the job configuration from the new template
                jobConfig.name = jobConfigTemplate.jobName;
                jobConfig.description = jobConfigTemplate.jobDescription;
                jobConfig.daysAvailable = jobConfigTemplate.daysAvailable;

                // Add Schedule
                if (scheduleService.isActive()) {
                    jobConfig.scheduleConfig =
                        scheduleService.buildScheduleConfig();

                    if (scheduleService.mode() === scheduleService.getModes().POLLING) {
                        this.setConfigModule(
                            jobConfig
                            , "Polling"
                            , this.buildPollingModule(jobConfigTemplate)
                        );
                    } else {
                        // Ensure Polling is always removed from non-polling
                        // jobs.
                        this.deleteConfigModuleType(jobConfig, "Polling");
                    }
                }

                // Step 2
                this.setConfigModule(
                    jobConfig
                    , "DL"
                    , this.buildDlModule(jobConfigTemplate)
                );

                // add/remove validation module
                if (jobConfigTemplate.validationModule.validationType.id !== 0) {
                    this.setConfigModule(
                        jobConfig
                        , "VL"
                        , this.buildValidationModule(jobConfigTemplate)
                    );
                } else {
                    this.deleteConfigModuleType(jobConfig, "VL");
                }

                // TODO: Validate Header Record
                // Step 3-4 LR Module
                this.validateHeaderRecord();
                this.setConfigModule(
                    jobConfig
                    , "LR"
                    , this.buildLrModule(jobConfigTemplate)
                );

                // eb SQL module
                this.setConfigModule(
                    jobConfig
                    , "EB"
                    , this.buildEbModule(jobConfigTemplate)
                );

                // eb campaign module
                try {
                    if (jobConfigTemplate.campaignId !== null) {
                        this.setConfigModule(
                            jobConfig
                            , "CAMPAIGN"
                            , this.buildCampaignEbModule(jobConfigTemplate)
                        );
                    }
                } catch (err) {
                    throw err;
                }

                // db table config
                jobConfig.databaseTableConfig = this.buildDatabaseTableConfig();

                // list element config
                jobConfig.listElementConfig = this.buildListElementConfig(jobConfigTemplate);

                return jobConfig;
            }

            , dayOfYear: function(expDate) {
                var oneJan = new Date(this.getFullYear(),0,1);
                return Math.ceil((expDate - oneJan) / 86400000);
            },
            validateJobConfig: function() {
                // TODO: Additional Checks
                if (jQuery.isEmptyObject(this.getJobConfig())) {
                    throw "The job config is undefined, try restarting the wizard";
                }

                if (this.getJobConfig().type !== this.getJobType().type) {
                    throw "The job config type does not match the selected type, try restarting the wizard";
                }
            },
            validateHeaderRecord: function() {
                // TODO: Additional Checks
                if (jQuery.isEmptyObject(this.getHeaderRecord())) {
                    throw "The header record is undefined, try restarting the wizard";
                }
            }

            /**
             * Deletes all instances of any modules of a given sub-type from a
             * job config.
             *
             * @param jobConfig {object} The job config to strip of all
             *  occurrences of the specified moduleSubType
             * @param moduleSubType {string} The sub-type of the module to strip
             */
            , deleteConfigModuleType: function(jobConfig, moduleSubType) {
                var moduleIndex
                    , moduleCount = jobConfig.modules.length
                ;

                for (moduleIndex = 0; moduleIndex < moduleCount; moduleIndex++) {
                    if (jobConfig.modules[moduleIndex].subType === moduleSubType) {
                        jobConfig.modules.splice(moduleIndex, 1);
                        moduleIndex--;
                        moduleCount--;  // Faster than reevaluating .length on every iteration
                    }
                }
            }

            /**
             * Replaces every occurrence of a given module sub-type with a new,
             * single module of the same type for a given job configuration
             * object.
             *
             * @param jobConfig {object} The job config to update
             * @param moduleSubType {string} The sub-type of the module to
             *  replace
             * @param module {object} The replacement module
             */
            , setConfigModule: function(jobConfig, moduleSubType, module) {
                // Delete every occurrence of the specified module sub-type
                this.deleteConfigModuleType(jobConfig, moduleSubType);

                // Add the new, one-and-only instance of this module
                jobConfig.modules.push(module);
            }

            /**
             * Composes a complete POLLING module, populated with attributes
             * pulled from a supplied job configuration template.
             *
             * @param jobConfigTemplate {object} The job configuration template
             *  from which to pull POLLING attributes.
             * @returns {object}
             */
            , buildPollingModule: function(jobConfigTemplate) {
                var newModule = wizardFactory.getPollingModule()
                    , dlModule = jobConfigTemplate.dlModule
                    , moduleAttributes = newModule.attributes
                    , attrCount = moduleAttributes.length
                    , attrMap = {}
                    , attrIndex
                    , extraNote = "Please check your SFTP Connection settings and try again."
                ;

                // Compose a map of attributes for quick referential updates
                for (attrIndex = 0; attrIndex < attrCount; attrIndex++) {
                    attrMap[moduleAttributes[attrIndex].key] =
                        moduleAttributes[attrIndex];
                }

                // Copy values from the template to the module, ensuring each is
                // present.
                if (dlModule.sftpConnection.id) {
                    attrMap.CONNECTIONID.value = dlModule.sftpConnection.id;
                } else {
                    throw "An SFTP Connection must be selected.  " + extraNote;
                }

                if (dlModule.remotePath) {
                    attrMap.FILEPATH.value = dlModule.remotePath;
                } else {
                    throw "A Path on the SFTP server must be specified.  "
                    + extraNote;
                }

                if (!dlModule.filePrefix) {
                    throw "A file mask prefix must be specified.  " + extraNote;
                } else {
                    if (!dlModule.fileSuffix) {
                        throw "A file mask suffix must be specified.  "
                        + extraNote;
                    } else {
                        attrMap.FILEREGEX.value =
                            wizardFactory.getSftpFilePattern(
                                dlModule.filePrefix
                                , dlModule.fileSuffix
                            );
                    }
                }

                return newModule;
            }

            , buildValidationModule: function(jobConfigTemplate) {
                var valModule = wizardFactory.getValidationModule()
                    , validationType = jobConfigTemplate.validationModule.validationType.value
                    , valAmounts = []   // TODO:  This array gets values pushed into it that are never used anywhere; can we get rid of it?
                    , attributesLength
                    , i
                ;

                if (validationType === wizardFactory.getValidationTypes()[0].value) {
                    // exact validation type
                    valAmounts.push(jobConfigTemplate.validationModule.validationAmount);
                } else if (validationType === wizardFactory.getValidationTypes()[1].value) {
                    // range validation type
                    valAmounts.push(jobConfigTemplate.validationModule.validationRangeLower);
                    valAmounts.push(jobConfigTemplate.validationModule.validationRangeUpper);
                }
                attributesLength = valModule.attributes.length;

                for (i = 0; i < attributesLength; i++) {
                    switch (valModule.attributes[i].key) {
                        case "VALIDATIONTYPE":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.validationType.value;
                            break;
                        case "VALIDATIONAMOUNT":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.validationAmount;
                            break;
                        case "ABORT":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.abort;
                            break;
                        case "NOTIFYONABORT":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.notifyOnAbort;
                            break;
                        case "NOTIFYLEVELABOVE":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.notifyLevelAbove;
                            break;
                        case "NOTIFYLEVELBELOW":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.notifyLevelBelow;
                            break;
                        case "VALIDATIONRANGELOWER":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.validationRangeLower;
                            break;
                        case "VALIDATIONRANGEUPPER":
                            valModule.attributes[i].value = jobConfigTemplate.validationModule.validationRangeUpper;
                            break;
                        case "FEEDID":
                            valModule.attributes[i].value = this.getFeed().id;
                            break;
                        case "FAILUREEMAILTO":
                            valModule.attributes[i].value = jobConfigTemplate.failureEmail;
                            break;
                        case "SUCCESSEMAILTO":
                            valModule.attributes[i].value = jobConfigTemplate.successEmail;
                            break;
                        default:
                            throw "Unknown VL Module Attribute.  Please try restarting the wizard.";
                    }
                }

                return valModule;
            }

            , buildDlModule: function(jobConfigTemplate) {
                // TODO: check all required values for UPLOAD are present SFTP or CDI Server
                var dlModule = {}, i, attributesLength;

                switch (jobConfigTemplate.dlModule.type) {
                    case "UPLOAD": {
                        dlModule = wizardFactory.getUploadDlModule();
                        break;
                    }
                    case "SFTP": {
                        jobConfigTemplate.dlModule.fileRegex =
                            wizardFactory.getSftpFilePattern(
                                jobConfigTemplate.dlModule.filePrefix
                                , jobConfigTemplate.dlModule.fileSuffix
                            );
                        dlModule = wizardFactory.getSftpDlModule();
                        attributesLength = dlModule.attributes.length;

                        for (i = 0; i < attributesLength; i++) {
                            switch (dlModule.attributes[i].key) {
                                case "FAILUREEMAILTO":
                                    dlModule.attributes[i].value = jobConfigTemplate.failureEmail;
                                    break;
                                case "SUCCESSEMAILTO":
                                    dlModule.attributes[i].value = jobConfigTemplate.successEmail;
                                    break;
                                case "CONNECTIONID":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.sftpConnection.id;
                                    break;
                                case "FILEPATH":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.remotePath;
                                    break;
                                case "FILEREGEX":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.fileRegex;
                                    break;
                                default:
                                    throw "Unknown DL Module Attribute, try restarting the wizard";
                            }
                        }

                        break;
                    }
                    case "LOCALFILESYSTEM": {
                        jobConfigTemplate.dlModule.fileRegex =
                            wizardFactory.getSftpFilePattern(
                                jobConfigTemplate.dlModule.filePrefix
                                , jobConfigTemplate.dlModule.fileSuffix
                            );
                        dlModule = wizardFactory.getSftpDlModule();

                        // slight modification for Local CDI Server Config
                        dlModule.type = "LOCALFILEDOWNLOAD";
                        attributesLength = dlModule.attributes.length;

                        for (i = 0; i < attributesLength; i++) {
                            switch (dlModule.attributes[i].key) {
                                case "FAILUREEMAILTO":
                                    dlModule.attributes[i].value = jobConfigTemplate.failureEmail;
                                    break;
                                case "SUCCESSEMAILTO":
                                    dlModule.attributes[i].value = jobConfigTemplate.successEmail;
                                    break;
                                case "CONNECTIONID":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.sftpConnection.id;
                                    break;
                                case "FILEPATH":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.remotePath;
                                    break;
                                case "FILEREGEX":
                                    dlModule.attributes[i].value = jobConfigTemplate.dlModule.fileRegex;
                                    break;
                                default:
                                    throw "Unknown DL Module Attribute, try restarting the wizard";
                            }
                        }

                        break;
                    }
                    default: {
                        throw "Unknown DL Module Type, try restarting the wizard";
                    }
                }

                return dlModule;
            }
            , removeModuleAttributes: function(moduleAttributes, removeAttributes) {
                var attrCount = removeAttributes.length
                    , removeKey
                    , r
                    , i
                ;

                if (attrCount > 0) {
                    for (r = 0; r < attrCount; r++) {
                        removeKey = removeAttributes[r];
                        for (i = 0; i < moduleAttributes.length; i++) {
                            if (moduleAttributes[i].key === removeKey) {
                                moduleAttributes.splice(i, 1);
                                break;
                            }
                        }
                    }
                }

                return moduleAttributes;
            }
            , buildLrModule: function(jobConfigTemplate) {
                var removeAttributesValues = []
                    , moduleConfig = wizardFactory.getDelimitedLrModule()
                    , attributeCount = moduleConfig.attributes.length
                    , testAttribute
                    , i
                ;

                // TODO: validation checks
                // Only available LR type for UI at the moment
                jobConfigTemplate.lrModule.type = "DELIMITED";

                for (i = 0; i < attributeCount; i++) {
                    testAttribute = moduleConfig.attributes[i];
                    switch (testAttribute.key) {
                        case "FAILUREEMAILTO":
                            testAttribute.value = jobConfigTemplate.failureEmail;
                            break;
                        case "SUCCESSEMAILTO":
                            testAttribute.value = jobConfigTemplate.successEmail;
                            break;
                        case "REJECTTHRESHOLD":
                            if ((jobConfigTemplate.rejectThreshold !== "")
                                && (jobConfigTemplate.rejectThreshold !== null)
                            ) {
                                testAttribute.value = jobConfigTemplate.rejectThreshold / 100;
                            } else {
                                removeAttributesValues.push("REJECTTHRESHOLD");
                            }

                            break;
                        default:
                            throw "Unknown LR Module Attribute, try restarting the wizard";
                    }
                }

                // remove Attributes if needed
                moduleConfig.attributes = this.removeModuleAttributes(
                    moduleConfig.attributes
                    , removeAttributesValues
                );

                this.setConfigFeed(
                    moduleConfig
                    , "FILE"
                    , this.buildFileFeed(jobConfigTemplate)
                );
                this.setConfigFeed(
                    moduleConfig
                    , "VERTICA"
                    , this.buildVerticaFeed(jobConfigTemplate)
                );

                return moduleConfig;
            },
            buildEbModule: function(jobConfigTemplate) {
                var ebModule = wizardFactory.getSqlEbModuleModel()
                    , moduleCount = ebModule.attributes.length
                    , i
                    , ebAttribute
                    , mapSelMapObj = this.getMapSelectedMappableObject()
                    , listProps
                ;

                // TODO: validation checks

                for (i = 0; i < moduleCount; i++) {
                    ebAttribute = ebModule.attributes[i];

                    switch (ebAttribute.key) {
                        case "FAILUREEMAILTO":
                            ebAttribute.value =
                                jobConfigTemplate.failureEmail;
                            break;
                        case "SUCCESSEMAILTO":
                            ebAttribute.value =
                                jobConfigTemplate.successEmail;
                            break;
                        case "LISTID":
                            listProps = mapSelMapObj.listProps;
                            if ((null !== listProps)
                                && (undefined !== listProps)
                            ) {
                                ebAttribute.value = listProps.id;
                            }
                            break;
                        default:
                            throw "Unknown EB Module Attribute.  Please try restarting the wizard";
                    }
                }

                this.setConfigFeed(
                    ebModule
                    , "MULTITABLE"
                    , this.buildMultiTableFeed(jobConfigTemplate)
                );

                return ebModule;
            },

            buildCampaignEbModule: function(jobConfigTemplate) {
                var campaignModule = null
                    , moduleCount
                    , i
                ;

                if (jobConfigTemplate.campaignId !== null) {
                    campaignModule = wizardFactory.getCampaignEbModule();
                    moduleCount = campaignModule.attributes.length;

                    for (i = 0; i < moduleCount; i++) {
                        switch (campaignModule.attributes[i].key) {
                            case "CAMPAIGNID": {
                                campaignModule.attributes[i].value = jobConfigTemplate.campaignId;
                                break;
                            }
                            case "FAILUREEMAILTO": {
                                campaignModule.attributes[i].value = jobConfigTemplate.failureEmail;;
                                break;
                            }
                            case "SUCCESSEMAILTO": {
                                campaignModule.attributes[i].value = jobConfigTemplate.successEmail;;
                                break;
                            }

                            default: {
                                throw "Unknown Campaign EB Module Attribute.  Please try restarting the wizard.";
                            }
                        }
                    }
                }

                return campaignModule;
            },

            setConfigFeed: function(moduleConfig, feedType, feedConfig) {
                var feedSet = moduleConfig.feeds
                    , feedIndex
                ;

                // Delete all feeds of the given type (the length of this array
                // will change on iterations where an element is removed).
                for (feedIndex = 0; feedIndex < feedSet.length; feedIndex++) {
                    if (feedSet[feedIndex].type === feedType) {
                        feedSet.splice(feedIndex, 1);
                        feedIndex--;
                    }
                }

                // Add the replacement feed config
                feedSet.push(feedConfig);
            },
            buildFileFeed: function(jobConfigTemplate) {
                var fileFeed = wizardFactory.getFileFeed()
                    , pgpKeyID = jobConfigTemplate.pgpKeyID
                ;

                for (var i = 0; i < fileFeed.attributes.length; i++) {
                    switch (fileFeed.attributes[i].key) {
                        case "FEEDID":
                            fileFeed.attributes[i].value = this.getFeed().id;
                            break;
                        case "DELIMITER":
                            if (this.isFreeFormDelimiter()) {
                                fileFeed.attributes[i].value = this.getFreeFormDelimiter().value;
                            } else {
                                fileFeed.attributes[i].value = this.getDelimiter().value;
                            }

                            break;
                        case "HEADER":
                            fileFeed.attributes[i].value = this.getHeader();
                            break;
                        case "QUALIFIER":
                            fileFeed.attributes[i].value = this.getQualifier().value;
                            break;
                        case "TERMINATOR":
                            fileFeed.attributes[i].value = this.getTerminator().value;
                            break;
                        case "FILEREGEX":
                            // TODO: Refactor this to be properly stored in the service
                            fileFeed.attributes[i].value = jobConfigTemplate.dlModule.fileRegex;
                            break;
                        default:
                            throw "Unknown File Feed Attribute, try restarting the wizard";
                    }
                }

                // Attach a PGP Key ID if this feed is encrypted
                if ((null !== pgpKeyID) && (undefined !== pgpKeyID)) {
                    fileFeed.attributes.push({
                        key: "PGPKEYID"
                        , value: pgpKeyID
                    });
                }

                fileFeed = this.setFields(fileFeed, this.buildFields("FILE"));

                return fileFeed;
            },
            buildVerticaFeed: function() {
                var _feed = wizardFactory.getVerticaFeed();
                for (var i = 0; i < _feed.attributes.length; i++) {
                    switch (_feed.attributes[i].key) {
                        case "MAPPINGTYPE":
                            _feed.attributes[i].value = this.getMappingLoadType();
                            break;
                        case "CONNECTIONID":
                            _feed.attributes[i].value = this.getMapSelectedConnection().id;
                            break;
                        case "TABLENAME":
                            _feed.attributes[i].value = this.getMapSelectedMappableObject().name;
                            break;
                        default:
                            throw "Unknown File Feed Attribute, try restarting the wizard";
                    }
                }

                _feed = this.setFields(_feed, this.buildFields("VERTICA"));

                return _feed;
            },
            buildMultiTableFeed: function() {
                var _feed = wizardFactory.getMultiTableFeedModel();
                for (var i = 0; i < _feed.attributes.length; i++) {

                    switch (_feed.attributes[i].key) {
                        case "TABLENAME":
                            _feed.attributes[i].value = this.getMapSelectedMappableObject().name;
                            break;
                        case "MAPPINGTYPE":
                            _feed.attributes[i].value = this.getMappingLoadType();
                            break;
                        case "CONNECTIONID":
                            _feed.attributes[i].value = this.getMapSelectedConnection().id;
                            break;
                        default:
                            throw "Unknown Multi Table Feed Attribute, try restarting the wizard";
                    }

                }

                _feed = this.setFields(_feed, this.buildFields("MULTITABLE"));

                return _feed;
            },
            setFields: function(feedConfig, fields) {
                feedConfig.fields = fields;
                return feedConfig;
            },

            buildFields: function(feedType) {
                var fields = []
                    , fieldTpl
                    , dateFormats = wizardFactory.getDateFormats()
                    , dataTypes = wizardFactory.getDataTypes()
                    , defaultDataType = dataTypes[0].value
                    , mappingRecords = this.getMappingRecords()
                    , mapRecCount = mappingRecords.length
                    , i
                    , mapRec
                    , fnAttributeMap = {}
                    , trnRules = this.getTransformRules()
                    , ruleCount = trnRules.length
                    , ruleIndex
                    , subRules
                    , subCount
                    , subIndex
                    , subRule
                    , highestPos = 0
                ;

                switch (feedType) {
                    case "FILE": {
                        // Build a map of mapping record ordinal positions to
                        // data transformation function attribute IDs.
                        for (ruleIndex = 0;
                             ruleIndex < ruleCount;
                             ruleIndex++
                        ) {
                            subRules = trnRules[ruleIndex].inputs;
                            subCount = subRules.length;

                            for (subIndex = 0; subIndex < subCount; subIndex++) {
                                subRule = subRules[subIndex];
                                fnAttributeMap[subRule.mappingRecordOrdinalPos] =
                                    subRule.attributeID;
                            }
                        }

                        for (i = 0; i < mapRecCount; i++) {
                            mapRec = mappingRecords[i];

                            // Do not append transformation function output
                            // fields to this feed type.
                            if (mapRec.isTransformOutput) {
                                continue;
                            }

                            fieldTpl = wizardFactory.getField();
                            fieldTpl.value = mapRec.inputName;
                            fieldTpl.ordinalPos = mapRec.ordinalPos;
                            fieldTpl.name = mapRec.inputName;
                            fieldTpl.isRequired = mapRec.isRequired;
                            fieldTpl.defaultValue = null;
                            fieldTpl.validation = null;
                            fieldTpl.functionAttributeId = (
                                (fnAttributeMap[mapRec.ordinalPos])
                                ? fnAttributeMap[mapRec.ordinalPos]
                                : null
                            );

                            if (mapRec.destName) {
                                if (mapRec.dataTypeId !== null) {
                                    fieldTpl.dataType = dataTypes[mapRec.dataTypeId - 1].value;
                                } else {
                                    fieldTpl.dataType = defaultDataType;
                                }

                                if (mapRec.format !== null) {
                                    fieldTpl.format = dateFormats[mapRec.format - 1].pattern;
                                } else {
                                    fieldTpl.format = null;
                                }

                                fieldTpl.size = mapRec.size;
                                fieldTpl.isKeyColumn = mapRec.isKeyColumn;
                            } else {
                                // destination not defined, set static values
                                fieldTpl.dataType = defaultDataType;
                                fieldTpl.size = 50;
                                fieldTpl.format = null;
                                fieldTpl.isKeyColumn = false;
                            }

                            fields.push(fieldTpl);
                        }

                        break;
                    }

                    case "VERTICA": {
                        // Build a map of mapping record column names to data
                        // transformation function attribute IDs.
                        for (ruleIndex = 0;
                             ruleIndex < ruleCount;
                             ruleIndex++
                        ) {
                            subRules = trnRules[ruleIndex].outputs;
                            subCount = subRules.length;

                            for (subIndex = 0; subIndex < subCount; subIndex++) {
                                subRule = subRules[subIndex];
                                fnAttributeMap[subRule.columnName] =
                                    subRule.attributeID;
                            }
                        }

                        for (i = 0; i < mapRecCount; i++) {
                            mapRec = mappingRecords[i];

                            if (this.checkVertica(mapRec)) {
                                fieldTpl = wizardFactory.getField();

                                if (mapRec.isSdmMapping) {
                                    // Vertica table, we don't care about the
                                    // SDM mapping; that's in the MULTITABLE
                                    // feed.
                                    if (this.getMapSelectedMappingType().type === "LIST") {
                                        fieldTpl.value = mapRec.destName;
                                        fieldTpl.name = mapRec.destName;
                                    } else {
                                        // check for the key
                                        if (mapRec.isKeyColumn) {
                                            fieldTpl.value = mapRec.name;
                                            fieldTpl.name = mapRec.name;
                                        } else {
                                            fieldTpl.value = mapRec.inputName;
                                            fieldTpl.name = mapRec.inputName;
                                        }
                                    }
                                } else {
                                    fieldTpl.value = mapRec.destName;
                                    fieldTpl.name = mapRec.destName;
                                }

                                fieldTpl.ordinalPos = mapRec.ordinalPos;

                                // Track the highest ordinalPos so additional
                                // fields can be sequenced.
                                if (mapRec.ordinalPos > highestPos) {
                                    highestPos = mapRec.ordinalPos;
                                }

                                fieldTpl.dataType = dataTypes[mapRec.dataTypeId - 1].value;
                                fieldTpl.size = mapRec.size;
                                fieldTpl.isRequired = mapRec.isRequired;

                                if (mapRec.format !== null) {
                                    fieldTpl.format = dateFormats[mapRec.format - 1].pattern;
                                } else {
                                    fieldTpl.format = null;
                                }
                                fieldTpl.defaultValue = null;
                                fieldTpl.validation = null;
                                fieldTpl.isKeyColumn = mapRec.isKeyColumn;
                                fieldTpl.functionAttributeId = (
                                    (fnAttributeMap[mapRec.name])
                                    ? fnAttributeMap[mapRec.name]
                                    : null
                                );
                                fields.push(fieldTpl);
                            }
                        }

                        break;
                    }

                    case "MULTITABLE": {
                        for (i = 0; i < mapRecCount; i++) {
                            mapRec = mappingRecords[i];
                            if (this.checkMultiTable(
                                    this.getMapSelectedMappingType().type
                                    , mapRec
                                )
                            ) {
                                fieldTpl = wizardFactory.getField();
                                fieldTpl.key = "TABLE.FIELD";

                                if (mapRec.isSdmMapping) {
                                    if (this.getMapSelectedMappingType().type === "LIST") {
                                        fieldTpl.value = this.getMapSelectedMappableObject().name + "." + mapRec.destName;
                                    } else {
                                        fieldTpl.value = mapRec.destName;
                                    }
                                } else {
                                    fieldTpl.value = this.getMapSelectedMappableObject().name + "." + mapRec.destName;
                                }

                                fieldTpl.ordinalPos = mapRec.ordinalPos;
                                fieldTpl.dataType = dataTypes[mapRec.dataTypeId - 1].value;
                                fieldTpl.name = null;
                                fieldTpl.size = mapRec.size;
                                fieldTpl.isRequired = mapRec.isRequired;
                                if (mapRec.format !== null) {
                                    fieldTpl.format = dateFormats[mapRec.format - 1].pattern;
                                } else {
                                    fieldTpl.format = null;
                                }
                                fieldTpl.defaultValue = null;
                                fieldTpl.validation = null;
                                fieldTpl.isKeyColumn = mapRec.isKeyColumn;
                                fieldTpl.functionAttributeId = null;
                                fields.push(fieldTpl);
                            }
                        }

                        break;
                    }

                    default: {
                        throw "Unknown Feed Type, try restarting the wizard";
                    }
                }

                return fields;
            },
            checkVertica: function(mappingRecord) {
                var result = true;

                if (mappingRecord.destName === 'not mapped' || mappingRecord.destName === null ) {
                    return false;
                }

                return result;
            },
            checkMultiTable: function(mappingType, mappingRecord) {
                var result = true;

                if (mappingRecord.destName === 'not mapped' || mappingRecord.destName === null ) {
                    return false;
                } else if (mappingType === 'LIST' && mappingRecord.isKeyColumn) {
                    return false;
                }

                return result;
            },
            buildDatabaseTableConfig: function() {
                var databaseTableConfig = null;

                if (this.isNewMappableObject()) {
                    databaseTableConfig = wizardFactory.getDatabaseTableConfigModel();
                    databaseTableConfig.name = this.getMapSelectedMappableObject().name;
                    databaseTableConfig.connectionId = this.getMapSelectedConnection().id;
                    databaseTableConfig.behavior = this.getMappingBehaviour();

                    // If Type List needs to be SDM
                    if (this.getMapSelectedMappingType().type === "LIST") {
                        databaseTableConfig.relationshipType = "SDM";
                    } else {
                        databaseTableConfig.relationshipType = this.getMapSelectedMappingType().type;
                    }
                    databaseTableConfig.columns = this.buildColumns();

                    if (databaseTableConfig.columns.length === 0) {
                        databaseTableConfig = null;
                    }
                }

                return databaseTableConfig;
            },
            buildListElementConfig: function(jobConfigTemplate) {
                var listFileConfig = wizardFactory.getListElementConfigModel();

                if (this.isNewMappableObject() &&
                    (this.getMapSelectedMappingType().type === "LIST")
                ) {
                    listFileConfig.name = this.getNewMappableObject().name;
                    listFileConfig.connectionId = this.getMapSelectedConnection().id;

                    // settings for creating new list name on execution
                    if (jobConfigTemplate.listElement.isTemplate) {
                        listFileConfig.isTemplate = jobConfigTemplate.listElement.isTemplate;

                        // prefix is not required.  Remove if null
                        if ((jobConfigTemplate.listElement.prefix !== null)
                            && (jobConfigTemplate.listElement.prefix !== "")
                        ) {
                            listFileConfig.prefix = jobConfigTemplate.listElement.prefix;
                        } else {
                            // remove name prefix
                            delete listFileConfig.prefix;
                        }

                        listFileConfig.suffix = jobConfigTemplate.listElement.suffix;
                    } else {
                        // remove all new list exec elements
                        delete listFileConfig.isTemplate;
                        delete listFileConfig.prefix;
                        delete listFileConfig.suffix;
                    }
                } else {
                    listFileConfig = null;
                }

                return listFileConfig;
            },
            buildColumns: function() {
                var columns = []
                    , counter = 0
                    , mappingRecords = this.getMappingRecords()
                    , mapRecCount = mappingRecords.length
                    , dataTypes = wizardFactory.getDataTypes()
                    , i
                    , column
                    , mapRec
                ;

                for (i = 0; i < mapRecCount; i++) {
                    column = wizardFactory.getColumnModel();
                    mapRec = mappingRecords[i];

                    // reversed for using a list
                    if (this.getMapSelectedMappingType().type !== 'LIST') {
                        if (mapRec.isSdmMapping) {
                            continue;
                        }

                        if (!mapRec.destName) {
                            continue;
                        }
                    }  if (this.getMapSelectedMappingType().type === 'LIST') {
                        if (!mapRec.isSdmMapping) {
                            continue;
                        }
                    }

                    column.name = mapRec.destName;
                    column.dataType = dataTypes[mapRec.dataTypeId - 1].value;
                    column.size = mapRec.size;
                    column.ordinalPos = counter;
                    column.nullable = true;
                    column.defaultValue = null;

                    // list cannot set a primary key for database table config
                    if (this.getMapSelectedMappingType().type === 'LIST' || this.getMapSelectedMappingType().type === 'EXTENSION') {
                        column.primaryKey = false;
                    } else {
                        column.primaryKey = mapRec.isKeyColumn;
                    }

                    columns.push(column);
                    counter++;
                }
                return columns;
            }
        };
    }]);
