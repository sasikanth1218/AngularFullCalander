/*globals app */

app.controller('manageController', function (
    $rootScope
    , $scope
    , $routeParams
    , $timeout
    , $upload
    , $window
    , usersResource
    , pgpKeysResource
    , usSpinnerService
    , AUTH_METHOD
) {
    'use strict';
    var tabs = [];

    //tabs.push({ heading: 'Configure', name: 'configure', icon: 'fa-retweet', partial: 'app/partials/manage/configure.html', active: true, disabled: false});
    if (!hideSAFeatures()) {
        tabs.push({ heading: 'Users'
            , name: 'users'
            , icon: 'fa-users'
            , partial: 'app/partials/manage/users.html'
            , active: false
            , disabled: false
        });
    }
    tabs.push({ heading: 'PGP/GPG Keys'
        , name: 'pgpkeys'
        , icon: 'fa-key'
        , partial: 'app/partials/manage/pgpkeys.html'
        , active: false
        , disabled: false
    });

    var alerts = [];

    // Base path for partial HTML templates
    var TPL_BASE = "app/partials/templates";

    // Identifier of the busy spinner
    var SPINNER_KEY = "busySpinner";

    //region Users Member Variables
    var userTypes = [
        { type: "USER" }
        , { type: "ADMIN" }
    ];

    var userAccordionCreate = [
        { isOpen: true }
    ];

    var userAccordionUpdate = [
        { isOpen: false }
    ];

    var messages = [
        { type: 'info', msg: 'Current Tab: ' }
    ];

    var users = usersResource.getUsers().$object;

    //TODO: Change User Type
    var cUser = usersResource.getUsersResource().customGET(
        'config', { type: 'ADMIN' }
    ).$object;

    var userAlerts = [];

    var userConfig = {
        firstName: null
        , lastName: null
        , email: null
        , passwd: null
        , enabled: true
    };
    //endregion

    /**
     * Adds a new alert message to the view
     *
     * @param alertText {string} The new alert message
     * @param alertType {string} (OPTIONAL) The alert type; can be any of the
     *  types allowed by Bootstrap (info, success, danger, etc.)
     */
    function addAlert(alertText, alertType) {
        var alertConfig = { msg: alertText };
        if (alertType) {
            alertConfig.type = alertType;
        }
        $scope.alerts.push(alertConfig);
        window.scrollTo(0, 0);
    }

    /**
     * Adds a new alert based on an HTTP Promise result
     *
     * @param httpResult {object} The HTTP result
     */
    function addHTTPAlert(httpResult) {
        addAlert("[" + httpResult.status + "] " + httpResult.data, "danger");
    }

    function closeAlert(index) {
        $scope.alerts.splice(index, 1);
    }

    /**
     * Starts the identified spinner object to show a busy state
     *
     * @param spinnerKey {string} Identifier of the spinner to show
     */
    function startSpinner(spinnerKey) {
        usSpinnerService.spin(spinnerKey);
    }

    /**
     * Removes the identified spinner object from view
     *
     * @param spinnerKey {string} Identifier of the spinner to hide
     */
    function stopSpinner(spinnerKey) {
        usSpinnerService.stop(spinnerKey);
    }

    /**
     * Indicates whether the authentication method is Single Sign-On.
     *
     * @returns {boolean} true = SSO; false, otherwise
     */
    function isSSOSession() {
        return ("SSO" === AUTH_METHOD);
    }

    /**
     * Indicates whether the current user is a Super Administrator.
     *
     * @returns {isSa|*} true = yes; false, otherwise
     */
    function isSuperAdmin() {
        return (
            ("undefined" !== typeof $rootScope.user)
                ? $rootScope.user.isSa
                : (("undefined" !== typeof user) ? user.isSa : false)
        );
    }

    /**
     * Indicates whether the view must hide Super Administrator features.  The
     * rule applies when the user is NOT a Super Administrator and SSO
     * authentication is in use.
     *
     * This satisfied requirement:
     * "Remove User Logout and Manage > Users menu options when auth = SSO and
     * user is not a super admin"
     *
     * @returns {boolean} true = hide SA features; false, otherwise
     */
    function hideSAFeatures() {
        return (!isSuperAdmin() && isSSOSession());
    }

    //region PGP Functions and Methods

    /**
     * Indicates whether an asynchronous operation must be treated as blocking
     *
     * @returns {boolean}
     */
    function isBlocking() {
        return 0 < $scope.blockingOperations.count;
    }

    /**
     * Resets the active PGP/GPG key configuration template.
     */
    function resetPGPConfig() {
        $scope.pgpConfig = angular.copy(pgpKeysResource.getConfig());
        $scope.selectedFile = null;
    }

    /**
     * Reloads the PGP key list select-box.
     */
    function reloadPGPKeyList() {
        var defaultOption = angular.element("#lstPrivateKeysDefault");
        defaultOption.html("Please wait for key data to load...");
        $scope.pgpKeys = [];

        pgpKeysResource.getKeys().then(function(newKeys) {
            var defaultOption = angular.element("#lstPrivateKeysDefault");
            $scope.pgpKeys = newKeys;
            if ((Array.isArray(newKeys)) && (0 < newKeys.length)) {
                defaultOption.html("Select a key to edit...");
            } else {
                defaultOption.html("Please add a new key");
            }
        });
    }

    /**
     * Switches the visible DIV on the PGP/GPG view and optionally places the
     * cursor into an identified form element.
     *
     * @param showDivID {string} The DIV ID to show
     * @param focusElementID {string} (OPTIONAL) The element to focus
     */
    function switchPGPView(showDivID, focusElementID) {
        var selectDiv = angular.element("#pgpSelectKey")
            , addDiv = angular.element("#pgpAddKey")
            , editDiv = angular.element("#pgpEditKey")
            , showDiv = angular.element("#" + showDivID)
            , focusElement = focusElementID
                ? angular.element("#" + focusElementID)
                : null
            ;

        selectDiv.hide();
        addDiv.hide();
        editDiv.hide();

        if (showDiv) {
            showDiv.show();

            if (focusElement) {
                $timeout(function () {
                    focusElement.focus();
                }, 200);
            }
        } else {
            throw "Internal HTML Error: DIV Element #" + showDivID + "is unknown.";
        }
    }

    function onAddKeyBtnClickEvent() {
        resetPGPConfig();
        switchPGPView('pgpAddKey', 'txtKeyName');
    }

    function onKeyFileSelect(selectedFiles) {
        var selectedFile = null
            , maxFileSize = pgpKeysResource.getMaxKeyFileSize()
            , fileCount = (
                Array.isArray(selectedFiles)
                    ? selectedFiles.length
                    : 0
            )
            ;

        if (1 < fileCount) {
            $scope.addAlert("Please select only one file.");
        } else {
            selectedFile = selectedFiles[0];

            // Restrict the maximum upload file size
            if (maxFileSize < selectedFile.size) {
                selectedFile = null;
                $scope.addAlert(
                    "PGP/GPG key files may not be larger than "
                    + maxFileSize
                    + " bytes.  Please try again with a smaller file."
                );
            }
        }

        $scope.selectedFile = selectedFile;
    }

    function onNewKeySaveBtnClickEvent() {
        $scope.showUploadProgressBar = true;
        $scope.uploadProgress = 50.0;

        pgpKeysResource.addKeyMetadata($scope.pgpConfig)
            .then(function($object) {
                var pgpKeyID = $object.id;
                pgpKeysResource.addKeyFile(pgpKeyID, $scope.selectedFile)
                    .progress(function(event) {
                        $scope.uploadProgress =
                            parseInt(event.loaded * 100 / event.total);
                    })
                    .success(function() {
                        $scope.showUploadProgressBar = false;
                        reloadPGPKeyList();
                        switchPGPView('pgpSelectKey');
                    })
                    .error(function(httpMessage, httpStatus) {
                        $scope.showUploadProgressBar = false;
                        $scope.addAlert(
                            "[" + httpStatus + "] " + httpMessage
                        );
                        pgpKeysResource.deleteKey(pgpKeyID);
                    })
                ;
            }
            , function(errorResponse) {
                $scope.showUploadProgressBar = false;
                addHTTPAlert(errorResponse);
            })
        ;
    }

    function onDeleteKeyBtnClickEvent() {
        var keyID = $scope.pgpConfig.id;

        // The ID must be supplied
        if ((null === keyID) || (undefined === keyID)) {
            $scope.addAlert("Please select a key.");
            return;
        }

        if ($window.confirm(
                "WARNING:  Never delete a key upon which existing jobs rely"
                + " because you cannot edit those jobs to select a different"
                + " key!  Instead, you should edit this key to schedule its"
                + " replacement.  Are you sure you must delete this key?"
            )
        ) {
            if ($window.confirm(
                    "DANGER:  There is no undo for this action!  If you delete"
                    + " a key that any jobs are expecting to use, then you will"
                    + " permanently break those jobs.  You can still cancel"
                    + " this action and edit the key to schedule its"
                    + " replacement.  Are you absolutely certain that deleting"
                    + " this key is better than editing it?"
                )) {
                pgpKeysResource.deleteKey(keyID)
                    .then(function() {
                        resetPGPConfig();
                        reloadPGPKeyList();
                    }, function(httpResult) {
                        addHTTPAlert(httpResult);
                    })
                ;
            }
        }
    }

    function onEditKeyBtnClickEvent() {
        var keyID = $scope.pgpConfig.id;

        // The ID must be supplied
        if ((null === keyID) || (undefined === keyID)) {
            $scope.addAlert("Please select a key.");
            return;
        }

        pgpKeysResource.getKey(keyID).then(function(keyObject) {
            $scope.pgpConfig = keyObject;
            switchPGPView('pgpEditKey', 'txtKeyEditName');
        }, function(httpResult) {
            addHTTPAlert(httpResult);
        });
    }

    function onEditKeySaveBtnClickEvent() {
        $scope.blockingOperations.count++;
        startSpinner(SPINNER_KEY);

        pgpKeysResource.updateKey(
            $scope.pgpConfig.id
            , $scope.pgpConfig
            , function () {
                reloadPGPKeyList();
                switchPGPView('pgpSelectKey');
                stopSpinner(SPINNER_KEY);
                $scope.blockingOperations.count--;
                addAlert("Key updated", "success");
            }
            , function (httpResult) {
                stopSpinner(SPINNER_KEY);
                $scope.blockingOperations.count--;
                addHTTPAlert(httpResult);
            }
        );
    }

    //endregion

    function init() {
        var tabCount = tabs.length
            , tabIndex
            , tab
        ;

        // Set of HTML templates used by this controller
        $scope.htmlTemplates = {
            pgpSelectKeyForm: TPL_BASE + "/pgpSelectKeyForm.html"
            , pgpAddKeyForm: TPL_BASE + "/pgpAddKeyForm.html"
            , pgpEditKeyForm: TPL_BASE + "/pgpEditKeyForm.html"
        };

        $scope.tabs = [];
        for (tabIndex = 0; tabIndex < tabCount; tabIndex++) {
            tab = tabs[tabIndex];
            if (tab.name === $routeParams.tab) {
                tab.active = true;
                $scope.tabs.push(tab);
            } else {
                $scope.tabs.push(tab);
            }
        }

        $scope.alerts = alerts;
        $scope.addAlert = addAlert;
        $scope.closeAlert = closeAlert;

        //region PGP scope Members and Delegates

        resetPGPConfig();
        reloadPGPKeyList();

        // Track whether an asynchronous operation should be treated as blocking
        $scope.blockingOperations = { count: 0 };
        $scope.selectedFile = null;
        $scope.showUploadProgressBar = false;

        $scope.switchPGPView = switchPGPView;
        $scope.onAddKeyBtnClickEvent = onAddKeyBtnClickEvent;
        $scope.onKeyFileSelect = onKeyFileSelect;
        $scope.onNewKeySaveBtnClickEvent = onNewKeySaveBtnClickEvent;
        $scope.onDeleteKeyBtnClickEvent = onDeleteKeyBtnClickEvent;
        $scope.onEditKeyBtnClickEvent = onEditKeyBtnClickEvent;
        $scope.onEditKeySaveBtnClickEvent = onEditKeySaveBtnClickEvent;
        $scope.isBlocking = isBlocking;

        //endregion

        //region Users Delegates
        $scope.messages = messages;
        $scope.userAlerts = userAlerts;
        $scope.users = users;
        $scope.cUser = cUser;
        $scope.userTypes = userTypes;
        $scope.userAccordionCreate = userAccordionCreate;
        $scope.userAccordionUpdate = userAccordionUpdate;
        //endregion
    }
    init();

    //region Users Methods
    $scope.closeUserAlert = function(index) {
        $scope.userAlerts.splice(index, 1);
    };

    $scope.createUser = function(cUser) {
        delete cUser.route;
        delete cUser.reqParams;
        delete cUser.parentResource;
        delete cUser.restangularCollection;

        usersResource.getUsersResource().post(cUser).then(function ($object) {
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'success'
                , msg: 'User: ' + cUser.name
                    + ' successfully created and assigned id: ' + $object.id
            });
        }, function() {
            $scope.userAlerts = [];
            $scope.userAlerts.push({
                type: 'danger', msg: 'Unable to create the user.'
            });
        });
    };

    $scope.refreshUsers = function() {
        $scope.users = usersResource.getUsers().$object;
    };

    $scope.getAccount = function(id) {
        $scope.uUser = usersResource.getUser(id).$object;
    };

    $scope.updateUser = function(uUser) {
        userConfig.firstName = uUser.firstName;
        userConfig.lastName = uUser.lastName;
        userConfig.email = uUser.email;
        userConfig.passwd = uUser.passwd;
        userConfig.enabled = uUser.enabled;

        usersResource.getUserResource(uUser.id).customPUT(userConfig).then(
            function ($object) {
                $scope.userAlerts = [];
                $scope.userAlerts.push({
                    type: 'success'
                    , msg: 'User: ' + (userConfig.name || uUser.name)
                        + ' successfully updated'
                });
            }, function() {
                $scope.userAlerts = [];
                $scope.userAlerts.push({
                    type: 'danger'
                    , msg: 'Unable to update the user.'
                });
            }
        );
    };

    $scope.clearPassword = function() {
        delete $scope.uUser.passwd;
    };

    //endregion
});
