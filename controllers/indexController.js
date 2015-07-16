/*globals app,user */
app.controller("indexController", function (
    $scope
    , $location
    , $rootScope
    , $cookieStore
    , Restangular
    , usersResource
    , AUTH_METHOD
) {
    "use strict";

    /**
     * Indicates whether the present path is the login view.
     *
     * @returns {boolean} true = at login path; false, otherwise
     */
    function isLoginPath() {
        return ($location.path() === "/login");
    }

    $(document).ready(function() {
        $('.collapse').on('show.bs.collapse', function() {
            $(this).prev().find(".fa-plus").removeClass("fa-plus").addClass("fa-minus");
        });
        $('.collapse').on('hide.bs.collapse', function() {
            $(this).prev().find(".fa-minus").removeClass("fa-minus").addClass("fa-plus");
        });

    });

    /**
     * Changes the view.
     *
     * @param newPath {string} The new view path to show.
     */
    function changeRoute(newPath) {
        $location.path(newPath);
    }

    /**
     * Logs out the current user and displays the login view.
     */
    function logoutUser() {
        usersResource.logout();
        $location.path("/login");
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

    //region View scope initialization
    $scope.islogin = isLoginPath;
    $scope.changeRoute = changeRoute;
    $scope.logout = logoutUser;
    $scope.isSSOSession = isSSOSession;
    $scope.isSuperAdmin = isSuperAdmin;
    $scope.hideSAFeatures = hideSAFeatures;
    //endregion
});
