/*globals app */
app.controller("wizardStep2DataController", function (
    $scope
    , $sce
    , $upload
    , l10nFactory
    , wizardFactory
    , wizardService
    , sftpBrowser
    , feedsResource
    , Restangular
    , connectionsResource
    , scheduleService
    , pgpKeysResource
) {
    "use strict";

    // Import parent functions
    var isBlocking = $scope.$parent.isBlocking
        , addBlocker = $scope.$parent.addBlocker
        , removeBlocker = $scope.$parent.removeBlocker
    ;

    // Localized view text
    var L = l10nFactory.getStrings("wizardStep2DataController");

    // Maximum allowed byte size of an upload file
    var MAXIMUM_UPLOAD_FILE_SIZE = 100000000;

    /**
     * Reloads the PGP key list select-box.
     */
    function reloadPGPKeyList() {
        $scope.savedState.defaultKeySelection = L.pgpKeysLoading;
        $scope.savedState.pgpKeys = [];

        pgpKeysResource.getKeys().then(function(newKeys) {
            $scope.savedState.pgpKeys = newKeys;
            if ((Array.isArray(newKeys)) && (0 < newKeys.length)) {
                $scope.savedState.defaultKeySelection = L.unencryptedData;
            } else {
                $scope.savedState.defaultKeySelection = L.noPGPKeysFound;
            }
        });
    }

    function getDlModule(moduleType) {
        wizardService.setModuleType(moduleType);

        if (moduleType !== undefined) {
            $scope.jobConfigTemplate.dlModule.type = moduleType.type;

            switch (moduleType.type) {
                case "UPLOAD": {
                    $scope.showUploadDiv = true;
                    $scope.showSftpDiv = false;
                    $scope.jobConfigTemplate.dlModule.feed = null;
                    $scope.savedState.wizardJobFormStep2ValidationFlag = false;
                    resetSftp();
                    break;
                }
                case "SFTP": {
                    $scope.showSftpDiv = true;
                    $scope.showUploadDiv = false;
                    $scope.jobConfigTemplate.dlModule.feed = null;
                    $scope.jobConfigTemplate.dlModule.sftpConnection = null;
                    $scope.jobConfigTemplate.dlModule.remotePath = null;
                    $scope.jobConfigTemplate.dlModule.filePrefix = null;
                    $scope.jobConfigTemplate.dlModule.fileSuffix = null;
                    $scope.savedState.wizardJobFormStep2ValidationFlag = false;
                    //$scope.connectionType = "SFTP";
                    checkConnections(moduleType);
                    resetUpload();
                    break;
                }
                case "LOCALFILESYSTEM": {
                    $scope.showSftpDiv = true;
                    $scope.showUploadDiv = false;
                    $scope.jobConfigTemplate.dlModule.feed = null;
                    $scope.jobConfigTemplate.dlModule.sftpConnection = null;
                    $scope.jobConfigTemplate.dlModule.remotePath = null;
                    $scope.jobConfigTemplate.dlModule.filePrefix = null;
                    $scope.jobConfigTemplate.dlModule.fileSuffix = null;
                    $scope.savedState.wizardJobFormStep2ValidationFlag = false;
                    //$scope.connectionType = "LOCALFILESYSTEM";
                    checkConnections(moduleType);
                    resetUpload();
                    break;
                }
            }
        } else {
            $scope.showSftpDiv = false;
            $scope.showUploadDiv = false;
            resetUpload();
            resetSftp();
            $scope.jobConfigTemplate.dlModule.type = null;
            $scope.jobConfigTemplate.dlModule.feed = null;
            $scope.savedState.wizardJobFormStep2ValidationFlag = false;
        }
    }

    //region File Upload Functions

    function onFileSelect($files) {
        var selectedFile;

        $scope.savedState.selectedFile = null;
        $scope.progress = 0.0;
        $scope.showUploadProgressBar = false;
        $scope.showUploadSuccessPanel = false;
        $scope.savedState.wizardJobFormStep2ValidationFlag = false;
        $scope.jobConfigTemplate.dlModule.feed = null;
        wizardService.invalidateLaterSteps();

        if ($files.length !== 1) {
            $scope.alerts.push({
                type: "danger"
                , msg: L.invalidMultiFileSelection
            });
        } else {
            selectedFile = $files[0];

            // Restrict the maximum upload file size
            if (selectedFile.size > MAXIMUM_UPLOAD_FILE_SIZE) {
                $scope.alerts.push({
                    type: "danger"
                    , msg: l10nFactory.interpolateString(
                        L.invalidFileSize
                        , MAXIMUM_UPLOAD_FILE_SIZE
                    )
                });
                return;
            }

            $scope.savedState.selectedFile = selectedFile;
            addBlocker();
            feedsResource.postFeed($scope.savedState.fileFeedConfig)
                .then(function($object) {
                    addBlocker();
                    $scope.showUploadProgressBar = true;

                    // Upload File
                    $scope.upload = $upload.upload({
                            url: Restangular.one("feeds", $object.id)
                                .one("upload")
                                .getRestangularUrl()
                            , headers: {
                                Authorization: Restangular.defaultHeaders.Authorization
                                , "X-Requested-By": null
                            }
                            , file: selectedFile
                        })
                        .progress(function(evt) {
                            $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
                        })
                        .success(function() {
                            // file is uploaded successfully
                            $scope.jobConfigTemplate.dlModule.feed =
                                feedsResource.getFeed($object.id).$object;
                            $scope.showUploadSuccessPanel = true;
                            $scope.savedState.wizardJobFormStep2ValidationFlag = true;
                            wizardService.setFeed($object);
                        })
                        .error(function (data, status) {
                            $scope.alerts.push({
                                type: "danger"
                                , msg: "[" + status + "] " + data
                            });
                        })
                        .finally(function() {
                            removeBlocker();
                        })
                    ;
                }, function(response) {
                    $scope.alerts.push({
                        type: "danger"
                        , msg: "[" + response.status + "] " + response.data
                    });
                })
                .finally(function() {
                    removeBlocker();
                })
            ;
        }
    }

    function resetUpload() {
        $scope.showUploadProgressBar = false;
        $scope.showUploadSuccessPanel = false;
        $scope.progress = null;
        $scope.savedState.selectedFile = null;
    }

    //endregion

    //region SFTP Browser Functions

    function closeSftpBrowserAlert(index) {
        $scope.savedState.sftpBrowserAlerts.splice(index, 1);
    }

    function checkConnections(module) {

        $scope.disableConnections = true;
        for (var i = 0; i < $scope.savedState.connections.length; i++) {

            if($scope.savedState.connections[i].type === module.type) {
                $scope.disableConnections = false;
                break;
            }
        }
    }

    function showSftpBrowser() {
        var sftpConnection = $scope.jobConfigTemplate.dlModule.sftpConnection
            , isUserPath = $scope.savedState.remotePathCheckbox
            , browsePath = $scope.jobConfigTemplate.dlModule.remotePath || "/"
        ;

        if (isUserPath && (sftpConnection !== undefined)) {
            $scope.showSftpBrowserDiv = false;
            $scope.disableRemotePathInputGroup = false;
        } else if (!isUserPath && (sftpConnection !== undefined)) {
            $scope.showSftpBrowserDiv = true;
            $scope.disableRemotePathInputGroup = false;
            sftpBrowser.setRemotePath(browsePath);
            sftpBrowser.setPathRoot(true);
            addBlocker();
            sftpBrowser.retrieveTreeNode(
                    $scope.jobConfigTemplate.dlModule.sftpConnection.id
                    ,  sftpBrowser.getPath().remotePath
                )
                .then(function($object) {
                    $object.splice(0,0, sftpBrowser.getParentNode());
                    $scope.treeData = $object;
                }, function(response) {
                    $scope.savedState.sftpBrowserAlerts = [{
                        type: "danger"
                        , msg: "[" + response.status + "] " + response.data
                    }];
                }).finally(function() {
                    removeBlocker();
                })
            ;
        } else {
            $scope.showSftpBrowserDiv = false;
            $scope.disableRemotePathInputGroup = true;
            $scope.jobConfigTemplate.dlModule.remotePath = null;
        }
    }

    function resetSftp() {
        $scope.showSftpBrowserDiv = false;
        $scope.savedState.remotePathCheckbox = false;
        $scope.disableRemotePathInputGroup = true;
        $scope.showSftpRetrieveDiv = false;
    }

    function setPathAndDrillDown(node) {
        var pathArray;
        sftpBrowser.setCurrentSelection(node);

        if ((sftpBrowser.getPreviousSelection() !== null)
            && (sftpBrowser.getCurrentSelection().uuid === sftpBrowser.getPreviousSelection().uuid)
            && sftpBrowser.getCurrentSelection().directory
        ) {
            sftpBrowser.incrementDoubleClickCounter();
            if (sftpBrowser.getDoubleClickCounter() === 1) {
                // do we go up or down?
                if (sftpBrowser.getCurrentSelection().uuid === "dotdot") {
                    // build path
                    if (!sftpBrowser.getPath().isRoot) {
                        pathArray = sftpBrowser.getPath().remotePath.split("/");
                        pathArray.pop();
                        sftpBrowser.setRemotePath(pathArray.join("/"));
                        sftpBrowser.setPathRoot(pathArray.length === 1);

                        // set path
                        $scope.jobConfigTemplate.dlModule.remotePath =
                            sftpBrowser.getPath().remotePath;

                        // retrieve nodes
                        $scope.collapseSftpBrowser = true;
                        addBlocker();
                        sftpBrowser.retrieveTreeNode(
                                $scope.jobConfigTemplate.dlModule.sftpConnection.id
                                ,  sftpBrowser.getPath().remotePath
                            )
                            .then(function($object) {
                                $object.splice(0, 0, sftpBrowser.getParentNode());
                                $scope.treeData = $object;
                                $scope.collapseSftpBrowser = false;
                            }, function(response) {
                                $scope.savedState.sftpBrowserAlerts = [{
                                    type: "danger"
                                    , msg: "[" + response.status + "] " + response.data
                                }];
                                $scope.collapseSftpBrowser = false;
                                resetSftpBrowser();
                            })
                            .finally(function() {
                                removeBlocker();
                            })
                        ;
                    }

                    sftpBrowser.resetDoubleClickCounter();
                } else {
                    // build path
                    if (sftpBrowser.getPath().isRoot) {
                        sftpBrowser.setRemotePath(
                            "/" + sftpBrowser.getCurrentSelection().label
                        );
                        sftpBrowser.setPathRoot(false);
                    } else {
                        sftpBrowser.setRemotePath(
                            sftpBrowser.getPath().remotePath + "/"
                            + sftpBrowser.getCurrentSelection().label
                        );
                        sftpBrowser.setPathRoot(false);
                    }

                    // set path
                    $scope.jobConfigTemplate.dlModule.remotePath =
                        sftpBrowser.getPath().remotePath;

                    // retrieve nodes
                    $scope.collapseSftpBrowser = true;
                    addBlocker();
                    sftpBrowser.retrieveTreeNode(
                            $scope.jobConfigTemplate.dlModule.sftpConnection.id
                            ,  sftpBrowser.getPath().remotePath
                        )
                        .then(function($object) {
                            $object.splice(0,0, sftpBrowser.getParentNode());
                            $scope.treeData = $object;
                            $scope.collapseSftpBrowser = false;
                        }, function(response) {
                            $scope.savedState.sftpBrowserAlerts = [{
                                type: "danger"
                                , msg: "[" + response.status + "] " + response.data
                            }];
                            $scope.collapseSftpBrowser = false;
                            resetSftpBrowser();
                        }).finally(function() {
                            removeBlocker();
                        })
                    ;

                    sftpBrowser.resetDoubleClickCounter();
                }
            } else {
                if (sftpBrowser.getCurrentSelection().directory) {
                    if (sftpBrowser.getPath().isRoot) {
                        $scope.jobConfigTemplate.dlModule.remotePath =
                            "/" + sftpBrowser.getCurrentSelection().label;
                    } else {
                        $scope.jobConfigTemplate.dlModule.remotePath =
                            sftpBrowser.getPath().remotePath + "/"
                            + sftpBrowser.getCurrentSelection().label
                        ;
                    }
                }
            }
        } else {
            sftpBrowser.resetDoubleClickCounter();
            sftpBrowser.setPreviousSelection(sftpBrowser.getCurrentSelection());

            if (sftpBrowser.getCurrentSelection().directory) {
                if (sftpBrowser.getPath().isRoot) {
                    $scope.jobConfigTemplate.dlModule.remotePath =
                        "/" + sftpBrowser.getCurrentSelection().label;
                } else {
                    $scope.jobConfigTemplate.dlModule.remotePath =
                        sftpBrowser.getPath().remotePath + "/"
                        + sftpBrowser.getCurrentSelection().label;
                }
            }

        }

        if(node.file) {
            var extensionIndex = node.label.indexOf(".");
            $scope.jobConfigTemplate.dlModule.filePrefix = node.label.substr(0,extensionIndex);
            $scope.jobConfigTemplate.dlModule.fileSuffix = node.label.substr(extensionIndex,node.label.length);

            $scope.jobConfigTemplate.dlModule.remotePath = ($scope.jobConfigTemplate.dlModule.remotePath == null || $scope.jobConfigTemplate.dlModule.remotePath == "") ? "/" : $scope.jobConfigTemplate.dlModule.remotePath;
        }
    }

    function retrieveSFTPSample() {

        var connectionId = $scope.jobConfigTemplate.dlModule.sftpConnection.id
            , remotePath = $scope.jobConfigTemplate.dlModule.remotePath
            , filePattern = wizardFactory.getSftpFilePattern(
                $scope.jobConfigTemplate.dlModule.filePrefix
                , $scope.jobConfigTemplate.dlModule.fileSuffix
            )
        ;

        wizardService.invalidateLaterSteps();
        addBlocker();
        connectionsResource.getConnectionFetchFileResource(connectionId)
            .customGET(
                null
                , {remotePath: remotePath, filePattern:filePattern}
            ).then(function($object) {
                $scope.jobConfigTemplate.dlModule.feed =
                    feedsResource.getFeed($object.id).$object;
                $scope.savedState.wizardJobFormStep2ValidationFlag = true;
                $scope.showSftpRetrieveDiv = true;
                wizardService.setFeed($object);
            }, function(response) {
                $scope.alerts.push({
                    type: "danger"
                    , msg: "[" + response.status + "] " + response.data
                });
            })
            .finally(function() {
                removeBlocker();
            })
        ;
    }

    function resetSftpBrowser() {
        sftpBrowser.setRemotePath("/");
        sftpBrowser.setPathRoot(true);
        addBlocker();
        sftpBrowser.retrieveTreeNode(
                $scope.jobConfigTemplate.dlModule.sftpConnection.id
                ,  sftpBrowser.getPath().remotePath
            ).then(function($object) {
                $scope.savedState.sftpBrowserAlerts = [];
                $object.splice(0,0, sftpBrowser.getParentNode());
                $scope.treeData = $object;
            }, function(response) {
                $scope.savedState.sftpBrowserAlerts = [{
                    type: "danger"
                    , msg: "[" + response.status + "] " + response.data
                }];
            })
            .finally(function() {
                removeBlocker();
            })
        ;
    }

    //endregion

    function resetViewState(savedState) {
        // upload
        $scope.showUploadDiv = false;
        resetUpload();

        // sftp
        $scope.showSftpDiv = false;
        savedState.collapseSftpFileMaskTooltip = true;
        resetSftp();

        savedState.wizardJobFormStep2ValidationFlag = false;
    }

    function populateViewData(savedState) {
        // module type selection
        savedState.moduleTypes = wizardService.getModuleTypes();

        savedState.pgpKeys = [];
        savedState.defaultKeySelection = L.pgpKeysLoading;
        reloadPGPKeyList();

        savedState.sftpBrowserAlerts = [];

        savedState.fileFeedConfig = feedsResource.getFeedsResource()
            .customGET("config", {type: "FILE"}).$object;

        savedState.connections = connectionsResource.getConnections().$object;
    }

    function resumeViewState(savedState) {
        var hasFeedData = false;

        $scope.moduleType = wizardService.getModuleType();
        switch ($scope.moduleType.type) {
            case "UPLOAD": {
                hasFeedData = (
                    (undefined !== savedState.selectedFile)
                    && (null !== savedState.selectedFile)
                );
                $scope.showUploadDiv = true;
                $scope.showUploadProgressBar = hasFeedData;
                $scope.showUploadSuccessPanel = hasFeedData;
                $scope.progress = (hasFeedData ? 100.0 : 0.0);
                break;
            }
            case "SFTP": {
                hasFeedData = !jQuery.isEmptyObject(wizardService.getFeed());
                $scope.showSftpDiv = true;
                $scope.showSFTPProgressBar = hasFeedData;
                $scope.showSftpRetrieveDiv = hasFeedData;
                $scope.progress = (hasFeedData ? 100.0 : 0.0);
                showSftpBrowser();
                break;
            }
            default: {
                // First load of this view
                $scope.moduleType = null;   // Necessary to invalidate the form
                resetViewState(savedState);
                populateViewData(savedState);
                break;
            }
        }

        // Must always initialize the SFTP browser
        sftpBrowser.init();
    }

    //region View Constructor

    // Extend the localization object to the view
    $scope.L = L;
    $scope.interpolate = l10nFactory.interpolateString;
    $scope.sftpFileMaskTooltip = $sce.trustAsHtml(L.sftpFileMaskTooltip);

    // Function Delegates
    $scope.closeSftpBrowserAlert = closeSftpBrowserAlert;
    $scope.getDlModule = getDlModule;
    $scope.onFileSelect = onFileSelect;
    $scope.showSftpBrowser = showSftpBrowser;
    $scope.setPathAndDrillDown = setPathAndDrillDown;
    $scope.retrieveSFTPSample = retrieveSFTPSample;
    $scope.isBlocking = isBlocking;

    // Event Listeners
    $scope.$on("wizardService:cancelWizard", function() {
        scheduleService.resetSchedule();
        $scope.savedState.fileFeedConfig = undefined;
        $scope.showSftpBrowserDiv = false;
        $scope.savedState.remotePathCheckbox = false;
        $scope.disableRemotePathInputGroup = true;
    });

    // Hook the enabled state of the Next button to this view's form validity
    $scope.$watch(
        "wizardJobFormStep2.$valid"
        , function (isValid) {
            $scope.$parent.onFormValidChangeEvent(
                isValid && $scope.savedState.wizardJobFormStep2ValidationFlag
            );
        }
    );

    // Obtain or initialize the saved state object reference and resume it
    var savedState = wizardService.viewStates.wizardStep2DataController;
    if (undefined === savedState) {
        wizardService.viewStates.wizardStep2DataController = {};
        savedState = wizardService.viewStates.wizardStep2DataController;
    }
    $scope.savedState = savedState;
    resumeViewState(savedState);

    //endregion
});
