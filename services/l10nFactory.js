/*globals cdiGlobals */

/**
 * Provides localization capability to an Angular application.
 *
 * @param $http {object} The Angular HTTP object
 * @returns {object}
 */
function l10nFactory($http) {
    "use strict";

    // Private member variables
    var _languageID = "en-us"   // User-selected language identifier
        , apiPathParts = cdiGlobals.apiPath.split("/").filter(function(e) { return 0 < e.length; })                // Assumption:  apiPath will always end with "/api/vN"
        , _basePath = "/" + apiPathParts.slice(0, apiPathParts.length - 2).concat(["app", "languages"]).join("/")  // Base server path for the lang files
        , _availableLangs = []  // Languages available on the server
        , _globalStrings = {}   // Cached copy of global strings
        , _l10nStrings = {}     // Cached copy of translated strings
        , _servedStrings = {}   // String collections that have been served
    ;

    //region Private Functions

    /**
     * Merges the global and module strings, returning a distinct copy.
     *
     * @param moduleName {string} Name of the specific module to merge with the
     *  global strings.
     * @returns {object} The combined l10n strings for the present language and
     *  given module.
     * @private
     */
    function _mergeStrings(moduleName) {
        var mergedStrings = {}
            , moduleStrings = _l10nStrings[moduleName]
            , allStrings = _l10nStrings.all
            , keyName
        ;

        // Start with any "all" strings, which weakly apply to every module
        if (allStrings) {
            for (keyName in allStrings) {
                if (allStrings.hasOwnProperty(keyName)) {
                    mergedStrings[keyName] = allStrings[keyName];
                }
            }
        }

        // Add the module strings, if the module exists; module strings
        // overwrite "all" strings so that the "nearest" value prevails.
        if (moduleStrings) {
            for (keyName in moduleStrings) {
                if (moduleStrings.hasOwnProperty(keyName)) {
                    mergedStrings[keyName] = moduleStrings[keyName];
                }
            }
        }

        // Finally, globals always overwrite everything else
        for (keyName in _globalStrings) {
            if (_globalStrings.hasOwnProperty(keyName)) {
                mergedStrings[keyName] = _globalStrings[keyName];
            }
        }

        return mergedStrings;
    }

    /**
     * Updates a given module's cached strings.
     *
     * @param moduleName {string} The name of the module to update
     * @param moduleRef {object} Reference to the module string collection
     * @private
     */
    function _updateStrings(moduleName, moduleRef) {
        var newModuleSet = _mergeStrings(moduleName), keyName;
        for (keyName in newModuleSet) {
            if (newModuleSet.hasOwnProperty(keyName)) {
                moduleRef[keyName] = newModuleSet[keyName];
            }
        }
        moduleRef._languageID = _languageID;
    }

    /**
     * Loads language-specific strings from the server.
     *
     * @returns {HttpPromise}
     * @private
     */
    function _loadLocaleStrings() {
        _l10nStrings = {};
        return $http.get(_basePath + "/" + _languageID + ".json")
            .then(function (httpResult) {
                _l10nStrings = httpResult.data;
            }, function (httpResult) {
                throw "Unable to get strings for language, " + _languageID
                    + ", due to HTTP error " + httpResult.status + ": "
                    + httpResult.data;
            }
        );
    }

    /**
     * Loads global strings from the server.
     *
     * @returns {HttpPromise}
     * @private
     */
    function _loadGlobalStrings() {
        _globalStrings = {};
        return $http.get(_basePath + "/global.json")
            .then(function (httpResult) {
                _globalStrings = httpResult.data;
            }, function (httpResult) {
                throw "Unable to get global strings due to HTTP error "
                    + httpResult.status + ": " + httpResult.data;
            }
        );
    }

    /**
     * Loads the list of available languages from the server.
     *
     * @returns {HttpPromise}
     * @private
     */
    function _loadAvailableLanguages() {
        // Delete any existing languages while preserving the object handle
        while (_availableLangs.length) {
            _availableLangs.pop();
        }

        return $http.get(_basePath + "/available.json")
            .then(function (httpResult) {
                var languageSet = httpResult.data
                    , languageCount = languageSet.length
                    , languageIndex
                ;

                for (languageIndex = 0;
                     languageIndex < languageCount;
                     languageIndex++
                ) {
                    _availableLangs.push(languageSet[languageIndex]);
                }
            }, function (httpResult) {
                // Even in the event of total catastrophic failure, there must
                // always be at least one language.
                _availableLangs.push({
                    id: "en-us"
                    , name: "English (United States)"
                });

                throw "Unable to get available languages due to HTTP error "
                    + httpResult.status + ": " + httpResult.data;
            }
        );
    }

    /**
     * Indicates whether the given language object has any strings.
     *
     * @param languageObject {object} The language object to test
     * @returns {boolean} true = strings exist; false otherwise
     * @private
     */
    function _hasStrings(languageObject) {
        var keyName;

        if (languageObject) {
            for (keyName in languageObject) {
                if (languageObject.hasOwnProperty(keyName)) {
                    return true;
                }
            }
        }

        return false;
    }

    //endregion

    //region Public Functions

    /**
     * Gets an array of objects representing the languages that are supported
     * with /languages/id.json files on the server.  Each element will have:
     *   id:  The internal language identifier
     *   name:  The natural display name for each language
     *
     * @returns {{id: string, name: string}[]}
     */
    function getLanguages() {
        return _availableLangs;
    }

    /**
     * Gets the present language identifier.
     *
     * @returns {string}
     */
    function getLanguageID() {
        return _languageID;
    }

    /**
     * Sets the language ID.  A matching language file must reside on the server
     * in the /languages/ directory.
     *
     * @param languageID {string} A language ID in form langauge-country, like
     *  en-us (English as written in the U.S.A.), en-gb (English as written in
     *  Great Britain), en-au (English as written in Australia), jp-jp (Japanese
     *  as written in Japan), and such.
     */
    function setLanguageID(languageID) {
        var newLanguage;

        // No null IDs
        if ((null === languageID) || (undefined === languageID)) {
            throw "A language identifier must be specified";
        }

        // Every language ID must be lower-case and contain a -
        newLanguage = languageID.toString().toLocaleLowerCase();
        if (0 > newLanguage.indexOf("-")) {
            throw "Language identifiers must contain a hyphen (-)";
        }

        // No path manipulation
        if (   (0 <= newLanguage.indexOf("/"))
            || (0 <= newLanguage.indexOf("&#47"))
        ) {
            throw "Path manipulation is not allowed in language identifiers";
        }

        // Flush cached language strings if the language is changing (do not
        // flush the global strings as they are language independent).
        if (0 !== newLanguage.localeCompare(_languageID)) {
            _l10nStrings = {};
        }

        _languageID = newLanguage;
    }

    /**
     * Interpolates additional argument values by position into a format
     * template containing {#} placeholders.  For example:
     * interpolateString("Hello, {0}!", "world"); // Hello, world!
     *
     * @param formatTPL {string} The format template
     * @see http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
     * @returns {string}
     */
    function interpolateString(formatTPL) {
        var args = Array.prototype.slice.call(arguments, 1);

        // Nothing to do with missing data except send it back as a string
        if ((null === formatTPL) || (undefined === formatTPL)) {
            return formatTPL + (args.length ? ":" + args.join(",") : "");
        }

        return formatTPL.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
            ;
        });
    }

    /**
     * Gets the combined set of global and locale-specific strings for a given
     * module name.
     *
     * @param moduleName {string} The name of a collection of locale-specific
     * strings, usually the internal name of the view controller.
     * @returns {object}
     */
    function getStrings(moduleName) {
        var cachedStrings;

        // A module name must be provided
        if (!moduleName) {
            throw "Cannot get strings for an unspecified module";
        }

        // Return only cached object references
        if (!_hasStrings(_servedStrings[moduleName])) {
            _servedStrings[moduleName] = {};
        }
        cachedStrings = _servedStrings[moduleName];

        // Update the cache only as needed
        if (!_hasStrings(cachedStrings)
            || (0 !== cachedStrings._languageID.localeCompare(_languageID))
        ) {
            if (_hasStrings(_l10nStrings) && _hasStrings(_globalStrings)) {
                _updateStrings(moduleName, cachedStrings);
            } else {
                _loadLocaleStrings().then(function () {
                    _updateStrings(moduleName, cachedStrings);
                });
            }
        }

        return cachedStrings;
    }

    //endregion

    //region Constructor

    // Always get the available languages and global strings, right away
    _loadAvailableLanguages();
    _loadGlobalStrings();

    //endregion

    // Provide the public API for this factory
    return {
        getLanguages: getLanguages
        , getLanguageID: getLanguageID
        , setLanguageID: setLanguageID
        , getStrings: getStrings
        , interpolateString: interpolateString
    };
}
