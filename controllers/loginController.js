/*globals app */
app.controller("loginController", function (
    $scope
    , Restangular
    , $rootScope
    , $cookieStore
    , $location
    , usersResource
    , l10nFactory
) {
    "use strict";

    // Localized view text
    var L = l10nFactory.getStrings("loginController");

    // TODO:  This user reference really must be refactored into a singleton provider; leaving it hanging like this is dangerous and fragile
    // The "global" user object; deleting or moving this to a different scope
    // will break the app!
    var user;

    //region Functions

    function addAlert(type, msg) {
        $scope.alerts.push({type: type, msg: msg});
    }

    function closeAlert(index) {
        $scope.alerts.splice(index, 1);
    }

    function login() {
        $scope.alerts = [];

        usersResource.authenticate($scope.user.name, $scope.user.password)
            .then(function($object) {
                var authToken = usersResource.encode(
                        $scope.user.name
                        , $scope.user.password
                    )
                ;

                Restangular.setDefaultHeaders({
                    Authorization: "Basic " + authToken
                    , "X-Requested-By": null
                });

                user = usersResource.setAuthorities($object);
                if ((user.firstName !== null) && (user.lastName !== null)) {
                    user.displayName = user.firstName + " " + user.lastName;
                } else {
                    user.displayName = user.name;
                }

                $rootScope.user = user;
                $cookieStore.put("user", $object);

                if (user.isSa) {
                    $location.path("/admin/nodes");
                } else {
                    $location.path("/jobs");
                }
            }, function error() {
                $scope.addAlert("danger", L.badCredentials);
            }
        );
    }

    /**
     * Changes the view language.
     *
     * @param languageID {string} A language identifier known to l10nFactory
     */
    function changeLanguage(languageID) {
        l10nFactory.setLanguageID(languageID);
        L = l10nFactory.getStrings("loginController");
    }

    //endregion

    // Initialize the view's scope
    $scope.alerts = [];
    $scope.currentYear = new Date().getFullYear();
    $scope.user = {
        name: null
        , password: null
    };
    $scope.languages = l10nFactory.getLanguages();
    $scope.languageID = l10nFactory.getLanguageID();

    // Extend the localization object to the view
    $scope.L = L;

    // Function delegates
    $scope.addAlert = addAlert;
    $scope.closeAlert = closeAlert;
    $scope.login = login;
    $scope.changeLanguage = changeLanguage;
    $scope.interpolate = l10nFactory.interpolateString;
});
