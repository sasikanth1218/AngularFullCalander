/* Services */
/*globals pgpKeysResource,functionsResource,l10nFactory */
angular.module('cdi.services', ['restangular'])
    .factory('pgpKeysResource', ['Restangular', '$upload', pgpKeysResource])
    .factory('functionsResource', ['Restangular', functionsResource])
    .factory('l10nFactory', ['$http', l10nFactory])
    .factory('usersResource', [ '$q', 'Restangular', '$rootScope', '$cookieStore', function($q, Restangular, $rootScope, $cookieStore) {
            var _usersResource = Restangular.all('users');

            return {
                getUsers: function() {
                    return _usersResource.getList();
                },
                getUser: function(id) {
                    var _userResource = Restangular.one('users', id);
                    return _userResource.get();
                },
                getUsersResource: function() {
                    return _usersResource;
                },
                getUserResource: function(id) {
                    var _userResource = Restangular.one('users', id);
                    return _userResource;
                },
                authenticate: function(name, pass) {
                    // TODO: Validations on user / pass input
                    return  _usersResource.customGET("auth", null, {'Authorization':'Basic ' + btoa(name + ':' + pass) });
                },
                authenticateToken: function(token){
                    return _usersResource.customGET("auth", null, {'Authorization':'Basic ' + token});

                    /*var deferred = $q.defer();
                    _usersResource.customGET("auth", null, {'Authorization':'Basic ' + token}).then(function ($object){
                        var result = $object;
                        deferred.resolve(result);
                    });
                    return deferred.promise;*/
                },
                encode: function(name, pass) {
                    return  btoa(name + ':' + pass);
                },
                setAuthorities: function(user) {
                    var access_level = null;
                    var isSa = null;
                    var isAdmin = null;
                    var isUser = null;
                    for (var i = 0; i < user.roles.length; i++) {
                        switch (user.roles[i]) {
                            case 'ROLE_SA':
                                isSa = true;
                                break;
                            case 'ROLE_ADMIN':
                                isAdmin = true;
                                break;
                            case 'ROLE_USER':
                                isUser = true;
                                break;
                        }
                    }
                    user.isSa = isSa;
                    user.isAdmin = isAdmin;
                    user.isUser = isUser;

                    if (user.isSa) {
                        access_level = 3;
                    } else if (user.isAdmin) {
                        access_level = 2;
                    } else if (user.isUser) {
                        access_level = 1;
                    } else {
                        access_level = 0;
                    }

                    user.access_level = access_level;
                    user.dh = Restangular.defaultHeaders;

                    return user;
                },
                logout: function() {
                    var ca = document.cookie;
                    document.cookie = 'user' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    document.cookie = 'CDIAuthToken' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';


                    delete $rootScope.user;
                    delete Restangular.defaultHeaders;
                    $cookieStore.remove('user');
                }
            }
        }])
    .factory('nodesResource', [
        'Restangular', function(Restangular) {

            var _nodesResource = Restangular.all('nodes');

            return {
                getNodes: function() {
                    return _nodesResource.getList();
                },
                getNode: function(id) {
                    var _nodeResource = Restangular.one('nodes', id);
                    return _nodeResource.get();
                },
                getNodesResource: function() {
                    return _nodesResource;
                }
            }
        }])
    .factory('dataModelResource', [
        'Restangular', function(Restangular) {

            var _dataModelResource = Restangular.one('sdm');

            return {
                getKeys: function() {
                    //console.log("trying to get the keys");
                    var _dataModelKeys = Restangular.all("sdm").customGET("default_keys");
                    return _dataModelKeys;
                }
            };
        }])
    .factory('instancesResource', [
        'Restangular', function(Restangular) {

            var _instancesResource = Restangular.all('instances');

            return {
                getInstances: function() {
                    return _instancesResource.getList();
                },
                getInstance: function(id) {
                    var _instanceResource = Restangular.one('instances', id);
                    return _instanceResource.get();
                },
                getInstancesResource: function() {
                    return _instancesResource;
                },
                getInstanceResource: function(id) {
                    var _instanceResource = Restangular.one('instances', id);
                    return _instanceResource;
                }
            }
        }])
    .factory('demoResource', [
        'Restangular', function(Restangular) {

            var _demoResource = Restangular.all('hygiene');

            return {
                getDemoResource: function() {
                    return _demoResource;
                },
                getDemoResourceEmail : function() {
                    var _demoEmailResource = Restangular.all('hygiene').one('hygiene/email');
                    return _demoEmailResource;
                },
                getDemoResourcePhone: function(){
                    var _demoPhoneResource = Restangular.all('hygiene').one('hygiene/phone');
                    return _demoPhoneResource;
                },
                getDemoResourceName: function() {
                    var _demoNameResource = Restangular.all('hygiene').one('hygiene/name');
                    return _demoNameResource;
                },
                getDemoResourceAddress: function() {
                    var _demoAddressResource = Restangular.all('hygiene').one('hygiene/address');
                    return _demoAddressResource;
                },
                getDemoResourceGeoCode: function() {
                    var _demoGeoCodeResource = Restangular.all('hygiene').one('hygiene/geocoder');
                    return _demoGeoCodeResource;
                }

            }
        }])
    .factory('jobsResource', [
        'Restangular', function(Restangular) {
            'use strict';
            var _jobsResource = Restangular.all('jobs');

            return {
                getJobs: function() {
                    return _jobsResource.getList();
                },
                getJob: function(id) {
                    var _jobResource = Restangular.one('jobs', id);
                    return _jobResource.get();
                },
                getJobCount : function() {
                    return _jobsResource.customGET('count');
                    //var _jobResource = _jobsResource.one('count');
                    //return _jobResource.get();
                },
                getJobSchedules: function(id) {
                    var _jobResource = Restangular.one('jobs', id);
                    return _jobResource.all('schedules').getList();
                },
                getJobScheduleResource: function(id, scheduleId) {
                    var _jobResource = Restangular.one('jobs', id);
                    return _jobResource.one('schedules', scheduleId);
                },
                getJobsResource: function() {
                    return _jobsResource;
                },
                getJobResource: function(id) {
                    var _jobResource = Restangular.one('jobs', id);
                    return _jobResource;
                },
                postJob: function(jobConfig) {
                    return _jobsResource.post(jobConfig);
                },
                executeJob: function(id) {
                    var _executeJobResource = Restangular.one('jobs', id).one('execute');
                    return _executeJobResource.get();
                },

                /**
                 * Initiates an asynchronous call to retrieve the set of jobs
                 * which have no schedules, returning the Promise.
                 *
                 * @returns {Promise}
                 */
                getUnscheduledJobs: function() {
                    return _jobsResource.getList({hasSchedule: false});
                },

                /**
                 * Initiates an asynchronous call to retrieve the set of jobs
                 * that are allowed to be chained, returning the Promise.
                 *
                 * @returns {Promise}
                 */
                getChainableJobs: function() {
                    return _jobsResource.getList({
                        hasSchedule: false
                        , "jobTypes[]": [
                            "ADHOC"
                            , "CUSTOM"
                            , "RECURRING"
                        ]
                    });
                }
            };
        }])
    .factory('schedulesResource', [ 'Restangular', function(Restangular) {

            var _schedulesResource = Restangular.all('schedules');

            return {
                validateCron: function(cron) {
                    return _schedulesResource.customGET("validate", {cron: cron});
                }
            }
        }])
    .factory('connectionsResource', [
        'Restangular', function(Restangular) {

            var _connectionsResource = Restangular.all('connections');

            return {
                getConnections: function() {
                    return _connectionsResource.getList();
                },
                getConnection: function(id) {
                    var _connectionResource = Restangular.one('connections', id);
                    return _connectionResource.get();
                },
                getConnectionsResource: function() {
                    return _connectionsResource;
                },
                getConnectionResource: function(id) {
                    var _connectionResource = Restangular.one('connections', id);
                    return _connectionResource;
                },
                getConnectionTableResource: function(id) {
                    var _connectionTableResource = Restangular.one('connections', id).one('tables');
                    return _connectionTableResource;
                },
                getConnectionListResource: function(id) {
                    var _connectionTableResource = Restangular.one('connections', id).one('lists');
                    return _connectionTableResource;
                },
                getConnectionFetchFileResource: function(id) {
                    var _connectionFetchFileResource = Restangular.one('connections', id).one('fetchFile');
                    return _connectionFetchFileResource;
                },
                getConnectionContentsResource: function(id) {
                    var _connectionContentsResource = Restangular.one('connections', id).one('contents');
                    return _connectionContentsResource;
                },
                getConnectionResourceTypeResource: function(type) {
                    //console.log(type);
                    var _connectionTypeResource = Restangular.one('connections/config').get({type: type}).$object;
                    //console.log(_connectionTypeResource);
                    return _connectionTypeResource;
                }

            }
        }])
    .factory('cdmResource', [
        'Restangular', function(Restangular) {

            var _cdmResource = Restangular.all('cdm/campaigns');

            return {
                getCdmCampaigns: function() {
                    return _cdmResource.getList();
                }
            }
        }])
    .factory('sdmResource', [
        'Restangular', function(Restangular) {

            var _sdmResource = Restangular.all('sdm');

            return {
                getKeys: function() {
                    return _sdmResource.all('keys').getList();
                },
                getSdmFields: function() {
                    return _sdmResource.all('default_fields').getList();
                }
            }
        }])
    .factory('feedsResource', [ '$q', 'Restangular', function($q, Restangular) {
            'use strict';
            var _feedsResource = Restangular.all('feeds');

            return {
                getFeeds: function() {
                    return _feedsResource.getList();
                },
                getFeed: function(id) {
                    var _feedResource = Restangular.one('feeds', id);
                    return _feedResource.get();
                },
                getFeedsResource: function() {
                    return _feedsResource;
                },
                postFeed: function(feed) {
                    return _feedsResource.post(feed);
                },
                getFeedPreviewResource: function(id) {
                    var _feedPreviewResource = Restangular.one('feeds', id).one('preview');
                    return _feedPreviewResource;
                },
                getFeedPreview: function(id, pgpKeyID){
                    var restFeed = Restangular.one('feeds', id).one('preview')
                        , getPromise = null
                    ;

                    // Pass along the pgpKeyID if it has been provided
                    if ((null === pgpKeyID) || (undefined === pgpKeyID)) {
                        getPromise = restFeed.get();
                    } else {
                        getPromise = restFeed.get({pgpKeyId: pgpKeyID});
                    }

                    return getPromise;
                },
                getFeedPreviewResolved: function(id){
                    var deferred = $q.defer();
                    Restangular.one('feeds', id).one('preview').get().then(function ($object){
                        var recordSet = $object;
                        deferred.resolve(recordSet);
                    });
                    return deferred.promise;
                }
            };
        }])
    .factory('executionsResource', ['$q','Restangular', function($q, Restangular) {
            'use strict';
            var _executionsResource = Restangular.all('jobs/executions');

            return {
                getExecutions: function () {
                    return _executionsResource.getList();
                },
                getJobExecutions: function (id) {
                    var _jobResource = Restangular.one('jobs', id);
                    return _jobResource.getList('executions');
                },

                /**
                 * Initiates a GET request for a page of job execution records,
                 * returning the promise.
                 *
                 * @param jobID {number} The Job ID
                 * @param limitTo {number} The maximum number of records to
                 *  request; the actual result may be less than this request
                 * @param recordOffset {number} The index of the first record
                 *  to include in the result
                 * @returns {Promise}
                 */
                getPagedJobExecutions: function(jobID, limitTo, recordOffset) {
                    var pageConfig = {
                        limit: (isNaN(limitTo) ? 0 : limitTo)
                        , offset: (isNaN(recordOffset) ? 0 : recordOffset)
                    };
                    return Restangular.one('jobs', jobID)
                        .getList('executions', pageConfig)
                    ;
                },

                /**
                 * Gets a (promise-bound) count of executions for an identified
                 * job.
                 *
                 * @param jobID {number} The Job ID
                 * @returns {number|object} Will be an HTTP response object
                 *  whenever the request fails
                 */
                getJobExecutionCount: function(jobID) {
                    return Restangular.one('jobs', jobID)
                        .all('executions').one('count').get().$object;
                },

                getJobExecution: function (id, execId) {
                    var _jobExecutionResource = Restangular.one('jobs', id).one('executions', execId);
                    return _jobExecutionResource.get();
                },
                getExecutionResource: function () {
                    return _executionsResource;
                },
                getExecutionSchedules: function(){
                    var deferred = $q.defer();
                    Restangular.all('jobs/schedules').getList().then(function ($object){
                        var schedules = $object;
                        deferred.resolve(schedules);
                    });
                    return deferred.promise;
                },
                getExecutionEvents: function () {
                    var deferred = $q.defer();
                    var currentDate = new Date();
                    var pastDate = new Date();
                    pastDate.setMonth(pastDate.getMonth() - 3);

                    var yyyy = currentDate.getFullYear().toString();
                    var mm = (currentDate.getMonth()+1).toString(); // getMonth() is zero-based
                    var dd  = currentDate.getDate().toString();
                    var currentDateString =  yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding

                    yyyy = pastDate.getFullYear().toString();
                    mm = (pastDate.getMonth()+1).toString(); // getMonth() is zero-based
                    dd  = pastDate.getDate().toString();
                    var pastDateString =  yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding

                    Restangular.all('jobs/executions').getList({fromStart: pastDateString, toStart: currentDateString}).then(function ($object) {
                        var executions = $object;
                        deferred.resolve(executions);
                    });
                    return deferred.promise;
                },
                getExecutionLogResource: function (id) {
                    var _executionResource = Restangular.one('executions', id).one('log');
                    return _executionResource;
                }
            };}
    ])
    .service('scheduleService', ['$rootScope', '$filter', function($rootScope, $filter) {
        'use strict';
        var _schedule = {}
            , _active = false
            , _valid = false
            , _hours = []
            , _modes = {
                DISABLED: 0
                , RECURRING: 1
                , POLLING: 2
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
                        && (2 >= testValue)
                    ;
                }
            }
            , _mode = _modes.DISABLED
        ;

        return {
            getSchedule: function() {
                return _schedule;
            }
            , addSchedule: function(scheduleTemplate) {
                _schedule = scheduleTemplate;
            }
            , clearSchedule: function() {
                _schedule = {};
            }
            , setActive: function(active) {
                _active = active;

                if (!active) {
                    this.clearSchedule();
                    _mode = _modes.DISABLED;
                }

                $rootScope.$broadcast('scheduleService:active', _active);
            }
            , setValid: function(valid) {
                _valid = valid;
                $rootScope.$broadcast('scheduleService:valid', _valid);
            }
            , isValid: function() {
                return _valid;
            }
            , isActive: function() {
                return _active;
            }

            /**
             * Gets the set of permitted scheduling modes.
             *
             * @returns {{DISABLED: number, RECURRING: number, POLLING: number, hasKey: hasKey, hasValue: hasValue}}
             */
            , getModes: function() {
                return _modes;
            }

            /**
             * Gets or sets the intended scheduling mode.  Must be one of the
             * values returned via getModes();
             *
             * @param newValue {number} One of the keys or values provided by
             *  getModes().  If you pass a String, it will be converted to a
             *  matching value, if valid.
             * @returns {number}
             */
            , mode: function(newValue) {
                if (1 === arguments.length) {
                    if (_modes.hasValue(newValue)) {
                        _mode = newValue;
                    } else if (_modes.hasKey(newValue)) {
                        _mode = _modes[newValue];
                    } else {
                        throw 'Unsupported scheduling mode: '
                            + ( (null === newValue)
                                ? 'null'
                                : ( (undefined === newValue)
                                    ? 'undefined'
                                    : '(' + typeof newValue + ') '
                                        + newValue.toString()
                                )
                            )
                        ;
                    }
                }
                return _mode;
            }

            , resetSchedule: function() {
                this.setActive(false);
                this.setValid(false);
            }

            /**
             * Generates a new Schedule Template object with defaults set.
             *
             * @returns {{cronString: string, name: null, description: null, startDate: null, endDate: null, startTime: null, endTime: null, minute: *, hour: *, daysOfWeek: Array, daysOfMonth: Array, months: Array, pollingFrequency: number, enabled: boolean}}
             */
            , getScheduleTemplate: function() {
                return {
                    cronString: null
                    , name: null
                    , description: null
                    , startDate: null
                    , endDate: null
                    , startTime: null
                    , endTime: null
                    , minute: this.getMinutes()[0]
                    , hour: this.getHours()[0]
                    , daysOfWeek: []
                    , daysOfMonth: []
                    , months: []
                    , pollingFrequency: 5
                    , enabled: false
                };
            }

            /**
             * Gets the set of static time intervals -- in whole minutes -- for
             * polling job types.
             *
             * @returns {{value: number, name: string}[]}
             */
            , getPollingFrequencies: function() {
                return [
                    { value: 5, name: '5 minutes' }
                    , { value: 10, name: '10 minutes' }
                    , { value: 15, name: '15 minutes' }
                    , { value: 30, name: '30 minutes' }
                    , { value: 60, name: '1 hour' }
                    , { value: 1440, name: '1 day' }
                ];
            }

            , getMinutes: function() {
                return [
                    {key:'0', label:'0', value: '0'}
                    , {key:'15', label:'15', value: '15'}
                    , {key:'30', label:'30', value: '30'}
                    , {key:'45', label:'45', value: '45'}
                ];
            }

            /**
             * Returns an array of objects that represent UI-ready Hours of Day.
             * This array is cached so as to preserve the object references,
             * else some dependent UI controls become unstable.
             *
             * @returns {Array}
             */
            , getHours: function() {
                var hourInterval;
                if (!_hours.length) {
                    for (hourInterval = 0; hourInterval < 24; hourInterval++) {
                        _hours.push({
                            key: hourInterval
                            , label: hourInterval
                            , value: hourInterval
                        });
                    }
                }
                return _hours;
            }

            , getDaysOfTheWeek: function() {
                return [
                    {key:'1', label:'Sunday', value: '1'}
                    , {key:'2', label:'Monday', value: '2'}
                    , {key:'3', label:'Tuesday', value: '3'}
                    , {key:'4', label:'Wednesday', value: '4'}
                    , {key:'5', label:'Thursday', value: '5'}
                    , {key:'6', label:'Friday', value: '6'}
                    , {key:'7', label:'Saturday', value: '7'}
                ];
            }
            , getDaysOfTheMonth: function() {
                var daysOfTheMonth = [];
                for (var i = 1; i <= 31; i++) {
                    daysOfTheMonth.push({
                        key: i
                        , label: i
                        , value: i
                    });
                }
                return daysOfTheMonth;
            }
            , getMonths: function() {
                return [
                    {key:'1', label:'January', value: '1'}
                    , {key:'2', label:'February', value: '2'}
                    , {key:'3', label:'March', value: '3'}
                    , {key:'4', label:'April', value: '4'}
                    , {key:'5', label:'May', value: '5'}
                    , {key:'6', label:'June', value: '6'}
                    , {key:'7', label:'July', value: '7'}
                    , {key:'8', label:'August', value: '8'}
                    , {key:'9', label:'September', value: '9'}
                    , {key:'10', label:'October', value: '10'}
                    , {key:'11', label:'November', value: '11'}
                    , {key:'12', label:'December', value: '12'}
                ];
            }

            /**
             * Constructs a cron-style configuration string from a supplied
             * schedule template matching that generated by
             * getScheduleTemplate().  Will be an empty-string on error with the
             * error message printed to the console log.  Ignores any already-
             * composed cronString property of the scheduleTemplate.
             *
             * @param scheduleTemplate {object} The populated schedule template
             *  from which to build the cron-style configuration string
             * @returns {string}
             */
            , buildCronString: function(scheduleTemplate) {
                var cronString;

                try {
                    switch (_mode) {
                        case _modes.RECURRING: {
                            cronString = scheduleTemplate.minute.value
                                + ' ' + scheduleTemplate.hour.value
                                + ' ' + (1 > scheduleTemplate.daysOfMonth.length ? '?' : scheduleTemplate.daysOfMonth.map(function(o) { return o.value; }).join(','))
                                + ' ' + (1 > scheduleTemplate.months.length ? '*' : scheduleTemplate.months.map(function(o) { return o.value; }).join(','))
                                + ' ' + (1 > scheduleTemplate.daysOfWeek.length ? '?' : scheduleTemplate.daysOfWeek.map(function(o) { return o.value; }).join(','))
                            ;
                            break;
                        }
                        case _modes.POLLING: {
                            switch (scheduleTemplate.pollingFrequency) {
                                case 1440: {    // Daily
                                    cronString = '0 ' + scheduleTemplate.hour.value + ' * * ?';
                                    break;
                                }
                                case 60: {      // Hourly
                                    cronString = '0 * * * ?';
                                    break;
                                }
                                default: {      // Every N Minutes
                                    cronString = '*/' + scheduleTemplate.pollingFrequency + ' * * * ?';
                                    break;
                                }
                            }
                            break;
                        }
                        default: {
                            throw 'Unsupported scheduling mode:  ' + _mode;
                        }
                    }
                } catch (ex) {
                    cronString = '';
                    window.console.error(ex);
                }

                return cronString;
            }

            /**
             * Gets the cron-style Quartz scheduling string from this schedule
             * service object or any other supplied schedule template matching
             * that generated by getScheduleTemplate(), if given.  This method
             * prefers the manually-set cronString property if found, but will
             * use buildCronString() when not.
             *
             * @param scheduleTemplate OPTIONAL schedule template as provided
             *  by getScheduleTemplate()
             * @returns {string}
             */
            , getCronString: function(scheduleTemplate) {
                var scheduleTPL = (
                    (1 === arguments.length)
                    ? scheduleTemplate
                    : _schedule
                );

                return (
                    (scheduleTPL && scheduleTPL.cronString)
                    ? scheduleTPL.cronString
                    : this.buildCronString(scheduleTPL)
                );
            }

            , buildScheduleConfig: function() {
                var startTimeArray
                    , startDate
                    , endTimeArray
                    , endDate
                ;

                if (!_active) {
                    throw "Schedule is not active";
                }

                if (!_valid) {
                    throw "Schedule is not valid";
                }

                startTimeArray = _schedule.startTime.split(':');
                startDate = _schedule.startDate;
                startDate.setHours(startTimeArray[0]);
                startDate.setMinutes(startTimeArray[1]);

                endTimeArray = _schedule.endTime.split(':');
                endDate = _schedule.endDate;
                endDate.setHours(endTimeArray[0]);
                endDate.setMinutes(endTimeArray[1]);

                return {
                    type: "CRON"
                    , cronString: this.getCronString()
                    , name: _schedule.name
                    , description: _schedule.description
                    , startDate: $filter('date')(startDate, 'yyyy-MM-ddTHH:mm:ss.sssZ')
                    , endDate: $filter('date')(endDate, 'yyyy-MM-ddTHH:mm:ss.sssZ')
                    , intervalType: null
                    , intervalValue: 0
                    , enabled: _schedule.enabled
                    , configMeta: null
                };
            }
            , toUtc: function(date) {
                return Date.UTC(
                    date.getFullYear()
                    , date.getMonth()
                    , date.getDate()
                    , date.getHours()
                    , date.getMinutes()
                    , date.getSeconds()
                    , date.getMilliseconds()
                );
            }
            // TODO: Validation Method for schedule object
        };
    }])
    .service('sftpBrowser', ['connectionsResource', function(connectionsResource) {
        'use strict';
        var _previousSelection = {};
        var _currentSelection = {};
        var _path = {
            remotePath: null,
            isRoot: null
        };
        var _doubleClickCounter = 0;

        var _parentNode = {uuid: "dotdot",
            label: "..",
            nav: false,
            file: false,
            directory: true,
            maxDepth: false,
            treeNodes: [],
            depth: null
        };

        return {
            init: function() {
                var obj = {};
                this.setPreviousSelection(obj);
                this.setCurrentSelection(obj);
                this.resetDoubleClickCounter();
                this.clearPath();
            },
            setPreviousSelection: function(previousSelection) {
                _previousSelection = previousSelection;
            },
            getPreviousSelection: function() {
                return _previousSelection;
            },
            setCurrentSelection: function(currentSelection) {
                _currentSelection = currentSelection;
            },
            getCurrentSelection: function() {
                return _currentSelection;
            },
            setRemotePath: function(path) {
                _path.remotePath = path;
            },
            setPathRoot: function(isRoot) {
                _path.isRoot = isRoot;
            },
            getPath: function() {
                return _path;
            },
            clearPath: function() {
                _path.remotePath = null;
                _path.isRoot = null;
            },
            incrementDoubleClickCounter: function() {
                _doubleClickCounter++;
            },
            getDoubleClickCounter: function() {
                return _doubleClickCounter;
            },
            resetDoubleClickCounter: function() {
                _doubleClickCounter = 0;
            },
            getParentNode: function() {
                return _parentNode;
            },
            retrieveTreeNode: function(connectionId, remotePath) {
                return connectionsResource.getConnectionContentsResource(connectionId).customGET(null, {remotePath: remotePath});
            }
        };
    }])
;
