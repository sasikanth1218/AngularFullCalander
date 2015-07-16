app.controller('adminController', function ($scope, $routeParams, nodesResource, usersResource, instancesResource, $http, $timeout, $log, dataModelResource, usSpinnerService, $window, connectionsResource, $filter, VERSION, APP_NAME, BUILD, $location) {

    var tabs = [
        // TODO: Define Roadmap item for System tab
        // { heading: 'System', name: 'system', icon: 'fa-dashboard', partial: 'app/partials/admin/system.html', active: false, disabled: false}
        {
            heading: 'Nodes',
            name: 'nodes',
            icon: 'fa-th-large',
            partial: 'app/partials/admin/nodes.html',
            active: false,
            disabled: false
        }
        , {
            heading: 'Instances',
            name: 'instances',
            icon: 'fa-th',
            partial: 'app/partials/admin/instances.html',
            active: false,
            disabled: false
        }
        , {
            heading: 'Users',
            name: 'users',
            icon: 'fa-users',
            partial: 'app/partials/admin/users.html',
            active: false,
            disabled: false
        }
    ];

    var cdmClients = [
        {
            appClientId: 100000,
            schema: 'qa'
        }
        , {
            appClientId: 100051,
            schema: 'ajax'
        }
        , {
            appClientId: 999999,
            schema: 'acme'
        }
    ];
    var customerKey1 = {name: '', dataType: 'TEXT', size: '300', ordinalPos: '0', sdmColumn: ''};
    var customerKey2 = {name: '', dataType: 'TEXT', size: '300', ordinalPos: '0', sdmColumn: ''};
    var customerKey3 = {name: '', dataType: 'TEXT', size: '300', ordinalPos: '0', sdmColumn: ''};
    var customerKey4 = {name: '', dataType: 'TEXT', size: '300', ordinalPos: '0', sdmColumn: ''};
    var customerKey5 = {name: '', dataType: 'TEXT', size: '300', ordinalPos: '0', sdmColumn: ''};

    var nodeAccordion = {
        isOpen: false
    };

    var nodes = nodesResource.getNodes().$object;
    var users = usersResource.getUsers().$object;
    var cUser = usersResource.getUsersResource().customGET('config', {type: 'SA'}).$object;
    var instances = instancesResource.getInstances().$object;
    var customerKeys = dataModelResource.getKeys().$object;
    var connections = connectionsResource.getConnections().$object;
    var cInstance = instancesResource.getInstancesResource().customGET('config', {type: 'DEFAULT'}).$object;
    var rawConnections = connectionsResource.getConnections().$object;
    var defaultCustomerKey;
    var alerts = [];
    var nodeAlerts = [
        {
            type: 'danger',
            msg: 'Update Nodes at your own peril!'
        }
    ];
    var userAlerts = [];
    var instanceAlerts = [];
    var messages = [
        {
            type: 'info',
            msg: 'Current Tab:'
        }
    ];

    var userConfig = {
        "firstName": null,
        "lastName": null,
        "email": null,
        "passwd": null,
        "enabled": true
    }

    //init for Initialization
    init();

    function init() {
        $scope.version = VERSION;
        $scope.build = BUILD;
        $scope.appName = APP_NAME;
        $scope.tabs = [];
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].name === $routeParams.tab) {
                tabs[i].active = true;
                $scope.tabs.push(tabs[i]);
            } else {
                $scope.tabs.push(tabs[i]);
            }
        }
        $scope.testNumber = 53;

        console.log("There, I've initialized the TEST NUMBER");
        console.log($scope.testNumber);

        $scope.alerts = alerts;
        $scope.nodeAlerts = nodeAlerts;
        $scope.userAlerts = userAlerts;
        $scope.instanceAlerts = instanceAlerts;
        $scope.customerKeys = customerKeys;
        $scope.connections = connections;
        $scope.messages = messages;
        $scope.nodes = nodes;
        $scope.node = nodes[0];
        $scope.nodeAccordion = nodeAccordion;
        $scope.users = users;
        $scope.cUser = cUser;
        $scope.instances = instances;
        $scope.cInstance = cInstance;


        $scope.customerKey1 = customerKey1;
        $scope.customerKey2 = customerKey2;
        $scope.customerKey3 = customerKey3;
        $scope.customerKey4 = customerKey4;
        $scope.customerKey5 = customerKey5;

        console.log("Checking the instance stuff");

        $scope.includeCdmConnection = true;
        $scope.includeSftpConnection = true;

        $scope.cdmClients = cdmClients;

        $scope.instanceAccordionCreate = {
            isOpen: true
        };
        $scope.instanceCreateCustomerIdentifierAdvanced = {
            isOpen: false
        };

        $scope.instanceCreateAccordionCustomerKey = {
            isOpen: false
        };

        $scope.instanceCreateAccordionAddConnection = {
            isOpen: false
        };

        $scope.instanceCreateAccordionAddConnection1 = {
            isOpen: false
        };
        $scope.instanceAccordionModifyConnection = {
            isOpen: false
        };
        $scope.instanceCreateAccordionConnectionsCdm = {
            isOpen: true
        };

        $scope.userAccordionCreate = {
            isOpen: true
        };

    }

    $scope.addAlert = function () {
        $scope.alerts.push({
            msg: "Another alert!"
        });
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.closeNodeAlert = function (index) {
        $scope.nodeAlerts.splice(index, 1);
    };

    $scope.closeUserAlert = function (index) {
        $scope.userAlerts.splice(index, 1);
    };

    $scope.closeInstanceAlert = function (index) {
        $scope.instanceAlerts.splice(index, 1);
    };

    $scope.setNode = function (index) {
        $scope.nodeAccordion.isOpen = true;
        $scope.node = $scope.nodes[index];
    };

    $scope.createUser = function (cUser) {
        delete cUser.route;
        delete cUser.reqParams;
        delete cUser.parentResource;
        delete cUser.restangularCollection;

        usersResource.getUsersResource().post(cUser).then(function ($object) {
            // console.log($object);
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'success',
                msg: 'User: ' + cUser.name + ' successfully created and assigned id: ' + $object.id
            });
        }, function () {
            console.log("There was an error creating the user");
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'danger',
                msg: 'Oh snap! Doesnt look like that worked'
            });
            return;
        });
    };

    $scope.refreshUsers = function () {
        startSpin('spinner-1');
        usersResource.getUsers().then(function ($object) {
            $scope.users = $object;
            stopSpin('spinner-1');
        }, function (response) {
            stopSpin('spinner-1');
            console.log(response);
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'danger',
                msg: '[' + response.status + ']' + response.data
            });
            return;
        });
    };

    $scope.refreshInstances = function () {
        startSpin('spinner-1');
        instancesResource.getInstances().then(function ($object) {
            $scope.instances = $object;
            stopSpin('spinner-1');
        }, function (response) {
            stopSpin('spinner-1');
            console.log(response);
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'danger',
                msg: '[' + response.status + ']' + response.data
            });
            return;
        });
    };
    $scope.getSaAccount = function (id) {
        var uUser = usersResource.getUser(id).$object
        $scope.uUser = uUser;
    };
    $scope.updateUser = function (uUser) {
        userConfig.firstName = uUser.firstName;
        userConfig.lastName = uUser.lastName;
        userConfig.email = uUser.email;
        userConfig.passwd = uUser.passwd;
        userConfig.enabled = uUser.enabled;

        usersResource.getUserResource(uUser.id).customPUT(userConfig).then(function ($object) {
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'success',
                msg: 'User: ' + uUser.name + ' successfully updated'
            });
        }, function () {
            console.log("There was an error updating the user");
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'danger',
                msg: 'Oh snap! Doesnt look like that worked'
            });
            return;
        });
    };
    $scope.getCdmClients = function () {

    };

    $scope.getInstance = function (id) {
        var uInstance = instancesResource.getInstance(id).$object
        $scope.uInstance = uInstance;
        /* @scope.uInstance.id = 53;*/
    };

    $scope.getConnection = function (id) {
        if (id !== undefined) {
            var uConnection = connectionsResource.getConnection(id).$object
            $scope.uConnection = uConnection;
            $scope.showAdminUpdateInstanceConnectinPanel = true;
        } else {
            $scope.showAdminUpdateInstanceConnectinPanel = false;
        }
    };

    $scope.getConnectionsWithFilter = function (instanceId) {
    }

    $scope.clearPassword = function () {
        delete $scope.uUser.passwd;
    };

    $scope.clearAppClientIdManual = function () {
        $scope.cInstance.appClientId = null;
    };

    $scope.clearSdmColumnNameManual = function () {
        $scope.cInstance.customerKeys[0].sdm_column = null;
    };

    $scope.configureCustomerKeysSize = function (size) {
        defaultCustomerKey = $scope.cInstance.customerKeys[0];
        if ($scope.cInstance.customerKeys.length == size) {
            console.log("shortening the length of the array");
            newCustomerKeys = new Array(size - 1);
            for (i = 0; i < size - 1; i++) {
                newCustomerKeys[i] = $scope.cInstance.customerKeys[i];
            }
            console.log("The array" + $scope.cInstance.customerKeys);
            console.log("The new array " + newCustomerKeys);
            $scope.cInstance.customerKeys = newCustomerKeys;
        } else {
            console.log("Adding the the length of the array");
            newCustomerKeys = new Array(size);
            for (i = 0; i < $scope.cInstance.customerKeys.length; i++) {
                newCustomerKeys[i] = $scope.cInstance.customerKeys[i];
            }
            for (i = $scope.cInstance.customerKeys.length; i < size; i++) {
                newCustomerKeys[i] = defaultCustomerKey;
            }
            console.log("The array" + $scope.cInstance.customerKeys);
            console.log("The new array " + newCustomerKeys);
            $scope.cInstance.customerKeys = newCustomerKeys;
        }
    }

    function startSpin(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    };

    function stopSpin(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    };
    $scope.updateNode = function (node) {
        startSpin('spinner-1');
        node.put().then(function ($object) {
            console.log($object);
            stopSpin('spinner-1');
            $scope.nodes = nodesResource.getNodes().$object;
            $scope.nodeAlerts = [];
            $scope.nodeAlerts.push({
                type: 'success',
                msg: 'Node: ' + node.id + ' successfully updated'
            });
        }, function (response) {
            console.log(response);
            stopSpin('spinner-1');
            $scope.nodeAlerts = [];
            $scope.nodeAlerts.push({
                type: 'danger',
                msg: 'Error: ' + response.status
            });
        });
    };
    $scope.updateInstance = function (uInstance) {
        startSpin('spinner-1');
        instancesResource.getInstanceResource(uInstance.id).customPUT(uInstance).then(function ($object) {
            console.log($object);
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'success',
                msg: 'Instance: ' + uInstance.id + ' successfully updated'
            });
        }, function (response) {
            console.log(response);
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'danger',
                msg: 'Error: ' + response.status
            });
            return;
        });
    };
    ;
    $scope.resetUpdateConnection = function (entry1) {
        entry1.$setPristine();
        delete  $scope.instanceAlerts;
    };
    $scope.updateConnection = function (uConnection) {
        startSpin('spinner-1');
        connectionsResource.getConnectionResource(uConnection.id).customPUT(uConnection).then(function ($object) {
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'success',
                msg: 'Instance: ' + uConnection.id + ' successfully updated'
            });

        }, function (response) {
            console.log(response);
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'danger',
                msg: 'Error: ' + response.status
            });
            return;
        });
    };
    $scope.addConnection = function (uConnection) {
        startSpin('spinner-1');
        connectionsResource.getConnectionsResource().customPOST(uConnection).then(function ($object) {
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'success',
                msg: 'Instance Connection added'
            });
        }, function (response) {
            console.log(response);
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'danger',
                msg: 'Error: ' + response.status
            });
            return;
        });
    };
    $scope.getConnections = function (id) {
        var connections = [];
        if (id !== null) {
            connectionsResource.getConnections().then(function ($object) {
                rawConnections = $object;
                //connections = rawConnections;
                for (index = 0; index < rawConnections.length; ++index) {

                    if (rawConnections[index].instanceId == id) {
                        connections.push(rawConnections[index]);
                    }
                }
            })
            $scope.connections = connections;
            $scope.showAdminUpdateInstanceConnectinPanel = false;

        }
    };

    $scope.refreshConnections = function (id) {
        startSpin('spinner-1');
        var connections = [];
        if (id !== null) {
            connectionsResource.getConnections().then(function ($object) {
                rawConnections = $object;
                //connections = rawConnections;
                for (index = 0; index < rawConnections.length; ++index) {
                    if (rawConnections[index].instanceId == id) {
                        connections.push(rawConnections[index]);
                    }
                }
            })
            $scope.connections = connections;
            console.log($scope.connections);
            $scope.showAdminUpdateInstanceConnectinPanel = false;
        }
        stopSpin('spinner-1');
    };

    $scope.getConnectionTypeResource = function (type, id) {
        console.log(type);
        $scope.connectionTypeResource = connectionsResource.getConnectionsResource().customGET('config', {
            type: type
        }).$object;
        $scope.connectionTypeResource.instanceId = $scope.uInstance.id;
        console.log($scope.connectionTypeResource);

    };
    $scope.resetConnectionTypeResource = function () {
        $scope.connectionTypeResource = connectionsResource.getConnectionsResource().customGET('config', {
            type: 'MYSQL'
        }).$object;
        $scope.connectionTypeResource = angular.copy($scope.connectionTypeResource);
        $scope.connectionTypeResource.instanceId = $scope.uInstance.id;
        console.log($scope.connectionTypeResource)
    }
    $scope.addNewConnections = function () {
        if ($scope.cInstance.connections.length < 5) {
            $scope.cInstance.connections.push({
                "type": null,
                "name": null,
                "description": null,
                "hostname": null,
                "port": null,
                "user": null,
                "password": null
            });
        }
    };
    $scope.removeSubConnection = function (index) {
        $scope.cInstance.connections.splice(index, 1);
    };

    $scope.addNewCustomerKeys = function () {
        if ($scope.cInstance.customerKeys.length < 5) {
            $scope.cInstance.customerKeys.push({
                "name": "",
                "dataType": "TEXT",
                "size": 300,
                "ordinalPos": 0,
                "sdmColumn": null
            });
            for (var i = 1; i < $scope.cInstance.customerKeys.length; i++) {
                $scope.cInstance.customerKeys[i].ordinalPos = i;
            }
        }
    };

    $scope.removeSubCustomerkey = function (index) {
        $scope.cInstance.customerKeys.splice(index, 1);
    };
    $scope.customerOptions = [
        {name: 'Email', value: 'contact.email'},
        {name: 'UUID', value: 'uuid'},
        {name: 'Account Number', value: 'account_number'},
        {name: 'Advanced', value: 'adv'}
    ];

    $scope.customerKeySdm = [
        {name: 'Email', value: 'contact.email1'},
        {name: 'UUID', value: 'uuid1'},
        {name: 'Account Number', value: 'account_number1'}
    ];

    $scope.checkAppClient = function (index) {
        if (!$scope.appClientIdOverrideClicked)
            $scope.cInstance.appClientId = null;
    };

    $scope.changedCustomerOption = function (val) {
        switch (val) {
            case "contact.email":
                $scope.cInstance.customerKeys = [{
                    "name": "EMAIL",
                    "dataType": "TEXT",
                    "size": 300,
                    "ordinalPos": 0,
                    "sdmColumn": "contact.EMAIL"
                }];
                $scope.cInstance.connections = null;
                break;
            case "uuid":
                $scope.cInstance.customerKeys = [{
                    "name": "UUID",
                    "dataType": "TEXT",
                    "size": 36,
                    "ordinalPos": 0,
                    "sdmColumn": null
                }];
                $scope.cInstance.connections = null;
                break;
            case "account_number":
                $scope.cInstance.customerKeys = [{
                    "name": "ACCOUNT_NUMBER",
                    "dataType": "INTEGER",
                    "size": null,
                    "ordinalPos": 0,
                    "sdmColumn": null
                }];
                $scope.cInstance.connections = null;
                break;
            case "adv":
                $scope.cInstance.customerKeys = [{
                    "name": "",
                    "dataType": "TEXT",
                    "size": 300,
                    "ordinalPos": 0,
                    "sdmColumn": null
                }];
                $scope.cInstance.connections = [];
                $scope.cInstance.connections = [{
                    "type": "VERTICA",
                    "name": null,
                    "description": null,
                    "hostname": null,
                    "port": 5433,
                    "user": null,
                    "password": null,
                    "attributes": [{
                        "key": "DATABASECONNECTIONSCHEMA",
                        "value": null,
                        "ordinalPos": 0
                    }, {
                        "key": "DATABASENAME",
                        "value": null,
                        "ordinalPos": 1
                    }]
                }];
                break;
            default:
                break;
        }
    }

    $scope.connectionTypes = [
        {name: 'VERTICA', port: 5433},
        {name: 'SFTP', port: 22},
        {name: 'QUEUE', port: ''},
        {name: 'REST', port: 80},
        {name: 'CDMADMIN', port: 441},
        {name: 'CDMAPI', port: 441},
        {name: 'MYSQL', port: 3306},
        {name: 'LOCALFILESYSTEM', port: 21, hostname: 'localhost'}
    ];

    $scope.connectionTypesOne = [
        {name: 'VERTICA'},
        {name: 'SFTP'},
        {name: 'QUEUE'},
        {name: 'REST'},
        {name: 'CDMADMIN'},
        {name: 'CDMAPI'},
        {name: 'MYSQL'},
        {name: 'LOCALFILESYSTEM'}
    ];

    $scope.custDataTypes = [
        {name: 'TEXT'},
        {name: 'INTEGER'}

    ];

    $scope.changedConnectionType = function (connection) {
        for (var i = 0; i < $scope.connectionTypes.length; i++) {
            if ($scope.connectionTypes[i].name == connection.type) {
                connection.port = $scope.connectionTypes[i].port;
                connection.hostname = $scope.connectionTypes[i].hostname;
                break;
            }
        }
        switch (connection.type) {
            case "VERTICA":
                connection.attributes = [{
                    "key": "DATABASECONNECTIONSCHEMA",
                    "value": null,
                    "ordinalPos": 0
                }, {
                    "key": "DATABASENAME",
                    "value": null,
                    "ordinalPos": 1
                }];
                break;
            case "REST":
                connection.attributes = [{
                    "key": "PROTOCOL",
                    "value": 'http://',
                    "ordinalPos": 0
                }];
                break;
            case "CDMADMIN":
                connection.attributes = [{
                    "key": "PROTOCOL",
                    "value": 'http://',
                    "ordinalPos": 0
                }];
                break;
            case "CDMAPI":
                connection.attributes = [{
                    "key": "PROTOCOL",
                    "value": 'http://',
                    "ordinalPos": 0
                }];
                break;
            case "LOCALFILESYSTEM":
                connection.attributes = [{
                    "key": "TOPLEVELDIRECTORY",
                    "value": "/aLocalDirectory/",
                    "ordinalPos": 0
                }];
                break;
            default:
                connection.attributes = [];
                break;
        }
    };

    $scope.schemaChanged = function (val) {
        if (val) {
            $scope.cInstance.attributes = [{
                "key": "DATABASECONNECTIONSCHEMA",
                "value": val,
                "ordinalPos": 0

            }]
        } else {
            $scope.cInstance.attributes = null;
        }
    }


    $scope.createInstance = function (cInstance) {
        delete $scope.cInstance.route;
        delete $scope.cInstance.reqParams;
        delete $scope.cInstance.parentResource;
        delete $scope.cInstance.restangularCollection;
        console.log(cInstance);
        startSpin('spinner-1');
        instancesResource.getInstancesResource().post(cInstance).then(function ($object) {
            stopSpin('spinner-1');
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'success',
                msg: 'Instance: ' + (cInstance).name + ' successfully created and assigned id: ' + $object.id
            });
        }, function (response) {
            console.log("There was an error creating the instance");
            $scope.instanceAlerts = [];
            $scope.instanceAlerts.push({
                type: 'danger',
                msg: '[' + response.status + ']' + response.data
            });
            stopSpin('spinner-1');
            return;
        });
    };

});