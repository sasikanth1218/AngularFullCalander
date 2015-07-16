app.controller('dashboardController', function ($scope, $cookieStore, Restangular) {

    //init for Initialization
    init();

    function init() {
        $scope.objects = [
            {name:'John', age:25, gender:'boy'},
            {name:'Jessie', age:30, gender:'girl'}
        ];
        $scope.c_store = $cookieStore.get('user');
}
});
