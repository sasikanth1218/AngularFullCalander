/*globals angular,cdiGlobals */

//Define an angular module for our app
var app = angular.module('cdi', [
    'ngRoute'
    , 'restangular'
    , 'ui.bootstrap'
    , 'ui.sortable'
    , 'xeditable'
    , 'angularFileUpload'
    , 'ngCookies'
    , 'cdi.services'
    , 'cdi.directives'
    , 'cdi.filters'
    , 'cdi.wizard'
    , 'angularSpinner'
    , 'treeControl'
]);

app.constant('VERSION', cdiGlobals.appVersion);
app.constant('BUILD', cdiGlobals.appBuild);
app.constant('APP_NAME', cdiGlobals.appName);
app.constant('AUTH_METHOD', cdiGlobals.authMethod);

app.filter('hasPermission', function(permissionsSvc) {
    "use strict";
    return function(input, invert) {
        var hasPermission = permissionsSvc.check(input);
        return (invert ? !hasPermission : hasPermission);
    };
});

//Define Routing for app
app.config(['$routeProvider',
    function($routeProvider) {
        "use strict";
        $routeProvider.
            when('/dashboard', {
                templateUrl: 'app/partials/dashboard.html',
                controller: 'dashboardController',
                data: {
                    label: 'Dashboard',
                    access_level: 1
                }
            }).
            when('/login', {
                templateUrl: 'app/partials/login.html',
                controller: 'loginController',
                data: {
                    label: 'Login',
                    access_level: 0
                }
            }).
            when('/jobs', {
                templateUrl: 'app/partials/jobs.html',
                controller: 'jobsController',
                data: {
                    label: 'Jobs',
                    access_level: 1
                }
            }).
            when('/jobs/:id', {
                templateUrl: 'app/partials/job.html',
                controller: 'jobController',
                data: {
                    label: 'Job',
                    access_level: 1
                }
            }).
            when('/jobs/:id/executions', {
                templateUrl: 'app/partials/jobExecutions.html',
                controller: 'jobExecutionsController',
                data: {
                    label: 'Job Executions',
                    access_level: 1
                }
            }).
            when('/jobs/:id/executions/:execId', {
                templateUrl: 'app/partials/execution.html',
                controller: 'executionController',
                data: {
                    label: 'Job Execution',
                    access_level: 1
                }
            }).
            when('/wizard', {
                templateUrl: 'app/partials/wizard.html',
                controller: 'wizardController',
                data: {
                    label: 'Wizard',
                    access_level: 1
                }
            }).
            when('/customJob', {
                templateUrl: 'app/partials/customJob.html',
                controller: 'customJobController',
                data: {
                    label: 'Custom Job',
                    access_level: 2
                }
            }).
            when('/calendar', {
                templateUrl: 'app/partials/calendar.html',
                controller: 'calendarController',
                data: {
                    label: 'Calendar',
                    access_level: 1
                }
            }).
            when('/executions', {
                templateUrl: 'app/partials/executions.html',
                controller: 'executionsController',
                data: {
                    label: 'Executions',
                    access_level: 1
                }
            }).
            when('/executions/:id', {
                templateUrl: 'app/partials/execution.html',
                controller: 'executionsController',
                data: {
                    label: 'Job',
                    access_level: 1
                }
            }).
            when('/chain', {
                templateUrl: 'app/partials/jobChain.html',
                controller: 'jobChainController',
                data: {
                    label: 'Chain',
                    access_level: 2
                }
            }).
            when('/manage/:tab', {
                templateUrl: 'app/partials/manage.html',
                controller: 'manageController',
                data: {
                    label: 'Manage',
                    access_level: 2
                }
            }).
            when('/admin/:tab', {
                templateUrl: 'app/partials/admin.html',
                controller: 'adminController',
                data: {
                    label: 'Admin',
                    access_level: 3
                }
            }).
            when('/demo', {
                templateUrl: 'app/partials/demo.html',
                controller: 'demoController',
                data: {
                    label: 'Demo',
                    access_level: 3
                }
            }).
            otherwise({
                redirectTo: '/login',
                data: {
                    label: 'Login',
                    access_level: 0
                }
            });
    }]);

// Configure to use hashbang
app.config(['$locationProvider', function ($locationProvider) {
    "use strict";
    $locationProvider.hashPrefix('!');
}]);

app.config(function(RestangularProvider) {
    "use strict";
    RestangularProvider.setBaseUrl(cdiGlobals.apiPath);
});

app.run(function(Restangular, $location, $q, $rootScope, usersResource) {
    "use strict";
    Restangular.setErrorInterceptor(
        function(resp) {
            // Handle errors
            switch(resp.status) {
                case 401:
                    //console.log(resp);
                    usersResource.logout();
                    $location.path('/login');
                    $rootScope.$broadcast('auth:loginRequired');
                    break;
                case 403:
                    usersResource.logout();
                    $location.path('/login');
                    $rootScope.$broadcast('auth:forbidden');
                    break;
                case 404:
                    // TODO: Add 404 Interceptor
                    $rootScope.$broadcast('page:notFound');
                    break;
                case 500:
                    // TODO: Add 500 Interceptor
                    $rootScope.$broadcast('server:error');
                    break;
            }
            return $q.reject(resp);
        }
    );
});

app.run(function(editableOptions) {
    "use strict";
    editableOptions.theme = 'bs3'; // bootstrap3 theme
});

app.run(function(
    $q
    , $rootScope
    , $location
    , $cookieStore
    , Restangular
    , usersResource
    , AUTH_METHOD
) {
    "use strict";

    $rootScope.$on('$routeChangeStart',
        function(evt, next, curr) {
            var ca, parts, token, user;

            // Ensure the user is logged-in
            if ($rootScope.user === undefined) {
                if ($cookieStore.get('user') !== undefined) {
                    $rootScope.user = $cookieStore.get('user');
                    Restangular.setDefaultHeaders($rootScope.user.dh);

                    // validate user can access
                    if (next.data.access_level > $rootScope.user.access_level) {
                        // Should we alternatively redirect to an unauth page?
                        $location.path('/login');
                    }
                } else {
                    if(AUTH_METHOD === 'SSO'){
                        ca = document.cookie;
                        if (ca.indexOf("CDIAuthToken") > -1) {
                            parts = ca.split('Token=');
                            token = parts[1].split(';')[0];

                            Restangular.setDefaultHeaders({
                                Authorization: 'Basic ' + token
                                , 'X-Requested-By': null
                            });

                            usersResource.authenticateToken(token).then(function ($object) {
                                user = usersResource.setAuthorities($object);
                                $rootScope.user = user;

                                if ($rootScope.user.firstName !== null && $rootScope.user.lastName !== null) {
                                    $rootScope.user.displayName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
                                } else {
                                    $rootScope.user.displayName = $rootScope.user.name;
                                }

                                $cookieStore.put('user', $object);

                                // validate user can access
                                if (next.data.access_level > $rootScope.user.access_level) {
                                    // Should we alternatively redirect to an unauth page?
                                    $location.path('/login');
                                }
                            });
                        }
                    } else {
                        // TODO: Test Cases for Cookie expiration (session cookie)
                        $rootScope.user = $cookieStore.get('user');
                        Restangular.setDefaultHeaders($rootScope.user.dh);

                        // validate user can access
                        if (next.data.access_level > $rootScope.user.access_level) {
                            // Should we alternatively redirect to an unauth page?
                            $location.path('/login');
                        }
                    }
                }
            } else {
                // validate user can access
                if (next.data.access_level > $rootScope.user.access_level) {
                    // Should we alternatively redirect to an unauth page?
                    $location.path('/login');
                }
            }

            ca = document.cookie;
            if (ca.indexOf("CDIAuthToken") > -1) {
                ca = document.cookie;
                parts = ca.split('Token=');
                token = parts[1].split(';')[0];

                Restangular.setDefaultHeaders({
                    Authorization: 'Basic ' + token
                    , 'X-Requested-By': null
                });

                usersResource.authenticateToken(token).then(function ($object) {
                    user = usersResource.setAuthorities($object);
                    $rootScope.user = user;

                    if ($rootScope.user.firstName !== null && $rootScope.user.lastName !== null) {
                        $rootScope.user.displayName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
                    } else {
                        $rootScope.user.displayName = $rootScope.user.name;
                    }

                    $cookieStore.put('user', $object);

                    // validate user can access
                    if (next.data.access_level > $rootScope.user.access_level) {
                        // Should we alternatively redirect to an unauth page?
                        $location.path('/login');
                    }
                    parts = ca.split('Token=');
                    token = parts[1].split(';')[0];
                });
            }

            // Cancel the new-job wizard whenever it is abandoned.
            if (curr && curr.$$route && (curr.$$route.controller === 'wizardController')) {
               curr.scope.cancelWizard();
            }
        }
    );
});
