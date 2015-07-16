/**
 * Provides various static methods for interacting with the PGP/GPG Key store.
 *
 * @param Restangular {object} The Restangular provider.
 * @param $upload {object} File upload service provider.
 * @returns {object}
 */
function pgpKeysResource(Restangular, $upload) {
    "use strict";

    // Localized view text
    // This is a place-holder until we have a l10nService that supports:
    // var L = l10nService.getStrings("pgpKeysResource");
    var L = {
        /**
         * Occurs whenever the pgpkeys resources is null when new key metadata
         * is being POSTed
         */
        nullResourceOnAdd: "The pgpkeys resource is not available for new key metadata.",

        /**
         * Occurs whenever the pgpkeys resources is null when key metadata is
         * being PUT
         */
        nullResourceOnUpdate: "The pgpkeys resource is not available to update key metadata.",

        /**
         * Occurs when a null ID is passed to the delete method.
         */
        nullKeyIDOnDelete: "An identifier must be supplied when attempting to delete a key.",

        /**
         * Occurs whenever a process attempts to save a key without a name.
         */
        requireKeyName: "Please specify a name for this PGP/GPG key.",

        /**
         * Occurs whenever a process or user has submitted a null PGP/GPG Key ID
         */
        nullKey: "A null PGP/GPG Key ID cannot be accepted.",

        /**
         * Occurs whenever a key request results in a null promise
         */
        keyGetFailed: "Unable to retrieve the selected key"
    };
    Object.freeze(L);

    // Maximum allowable size of a PGP/GPG key file (in bytes)
    var MAXIMUM_KEY_FILE_SIZE = 50000;

    // Base route for this resource
    var RESOURCE_ID = "pgpkeys";

    // Dedicated Restangular instance pointed at the pgpkeys resource
    var _keysResource = Restangular.all(RESOURCE_ID);

    // Cache of the configuration template for this resource
    var _configCache = null;

    return {
        /**
         * Gets the entire collection of cached PGP/GPG Keys.  Returns null when
         * this resource is null.
         *
         * @returns {Promise}
         */
        getKeys: function() {
            return ((null === _keysResource) ? null : _keysResource.getList());
        },

        /**
         * Gets a single PGP/GPG Key by its unique identifier.  Returns null
         * when this resource is null.
         *
         * @param keyID {number}
         * @returns {Promise}
         */
        getKey: function(keyID) {
            var pgpKey = Restangular.one(RESOURCE_ID, keyID);
            return (null === pgpKey ? null : pgpKey.get());
        },

        /**
         * Gets the maximum file size of a PGP/GPG key file, in bytes.
         *
         * @returns {number}
         */
        getMaxKeyFileSize: function() {
            return MAXIMUM_KEY_FILE_SIZE;
        },

        /**
         * Gets an empty configuration object for key metadata (it has members
         * but no values).  Returns null when this resource is null.  When
         * building configurations based on this object, you should copy() it,
         * first because the initial result is cached and returned thereafter.
         *
         * @returns {object}
         */
        getConfig: function() {
            if ((null === _configCache) && (null !== _keysResource)) {
                _configCache = _keysResource.customGET("config").$object;
            }

            return _configCache;
        },

        /**
         * Creates a new PGP/GPG Key in the store
         *
         * @param pgpConfig {object} A completed object based on the template
         *  returned by getConfig()
         * @throws L.nullResourceOnAdd when this resource is null
         * @throws L.requireKeyName when pgpConfig.name is missing
         * @returns {HttpPromise}
         */
        addKeyMetadata: function(pgpConfig) {
            // The resource must exist
            if (null === _keysResource) {
                throw L.nullResourceOnAdd;
            }

            // A name must be set
            if (!pgpConfig.name || (1 > pgpConfig.name.length)) {
                throw L.requireKeyName;
            }

            return _keysResource.post(pgpConfig);
        },

        /**
         * Initiates an upload of a new PGP/GPG Key file for an identified key
         * and returns the asynchronous upload Promise.
         *
         * @param pgpKeyID {number} The identifier of the key to which this file
         *  will be attached.
         * @param keyFile {object} A file object
         * @returns {Promise}
         */
        addKeyFile: function(pgpKeyID, keyFile) {
            return $upload.upload({
                url: Restangular.one(RESOURCE_ID, pgpKeyID)
                    .one("upload").getRestangularUrl()
                , headers: {
                    Authorization: Restangular.defaultHeaders.Authorization
                    , "X-Requested-By": null
                }
                , file: keyFile
            });
        },

        /**
         * Initiates deletion of an identified PGP/GPG key, returning the
         * Promise.
         *
         * @param keyID {number} The key identifier
         * @returns {Promise}
         */
        deleteKey: function(keyID) {
            // The ID must be supplied
            if ((null === keyID) || (undefined === keyID)) {
                throw L.nullKeyIDOnDelete;
            }

            return Restangular.one(RESOURCE_ID, keyID).remove();
        },

        /**
         * Update existing PGP/GPG Key metadata, using call-back function
         * handles for the success/fail conditions.
         *
         * @param keyID {number} The key identifier
         * @param pgpConfig {object} A completed object based on the template
         *  returned by getConfig()
         * @param successFunction {function} Handle to a function (or an
         *  anonymous function) to be called when the update succeeds.
         * @param errorFunction {function} Handle to a function (or an
         *  anonymous function) to be called when the update fails.  This
         *  function will be passed the httpResult object.
         * @throws L.nullResourceOnUpdate when this resource is null
         * @throws L.requireKeyName when pgpConfig.name is missing
         * @throws httpError {object} when the GET request (required before a
         *  PUT can occur) encounters an HTTP error.
         */
        updateKey: function(keyID, pgpConfig, successFunction, errorFunction) {
            var getPromise;

            // The resource must exist
            if (null === _keysResource) {
                throw L.nullResourceOnUpdate;
            }

            // A name must be set
            if (!pgpConfig.name || (1 > pgpConfig.name.length)) {
                throw L.requireKeyName;
            }

            // There must be a key to update
            if ((null === keyID) || (undefined === keyID)) {
                throw L.nullKey;
            }

            // Request the key (remembering that this is a deferred query unless
            // the answer is null, which is immediate).
            getPromise = this.getKey(keyID);

            if (null === getPromise) {
                throw L.keyGetFailed;
            } else {
                getPromise.then(
                    function(updateKey) {
                        updateKey.name = pgpConfig.name;
                        updateKey.description = pgpConfig.description;

                        // Update the password only if provided so as to not
                        // delete the existing password.
                        if (pgpConfig.passwd && (0 < pgpConfig.passwd.length)) {
                            updateKey.passwd = pgpConfig.passwd;
                        }

                        updateKey.put().then(successFunction, errorFunction);
                    }, function(httpError) {
                        throw httpError;
                    }
                );
            }
        }
    };
}
