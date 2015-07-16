/* Directives */

angular.module('cdi.directives', [])
    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])
//angular.module('cdi.directives', [])
    .directive('pwCheck', [function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.pwCheck;
                elem.add(firstPassword).on('keyup', function () {
                    scope.$apply(function () {
                        var v = elem.val() === $(firstPassword).val();
                        ctrl.$setValidity('pwmatch', v);
                    });
                });
            }
        }
    }])
    .filter('utc', [function () {
        return function (date) {
            if (angular.isNumber(date)) {
                date = new Date(date);
            }
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        }
    }])
app.directive('autofillable', ['$timeout', function ($timeout) {
    return {
        scope: true,
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            scope.check = function(){
                var val = elem[0].value;
                if(ctrl.$viewValue !== val){
                    ctrl.$setViewValue(val)
                }
                $timeout(scope.check, 300);
            };
            scope.check();
        }
    }
}])

//angular.module('cdi.directives', [])
    .directive('dirEmailListCheck', [function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                //alert(attrs.dirEmailListCheck);
                //var emailList = attrs.dirEmailListCheck.split(';');

                if (attrs.dirEmailListCheckState != null) {
                    //alert(attrs.dirEmailListCheckState);

                } else {
                    elem.bind('blur', function () {
                        //alert(attrs.dirEmailListCheckState);
                        //alert("1 " + elem.val());

                        if (elem.val() == '') {
                            //alert("4 " + elem.val());
                            ctrl.$setValidity('dirEmailListCheck', true);
                            //attrs.dirEmailListCheckState = false;
                            return true;
                        }
                        else {
                            if (validEmailList(elem.val())) {
                                //if(elem.val() == '22222') {
                                //alert("2 " + elem.val());
                                ctrl.$setValidity('dirEmailListCheck', true);
                                //attrs.dirEmailListCheckState = true;
                                //attrs.$set('inValidSuccessEmail', false);
                                return true;
                            }
                            else {
                                //alert("3 " + elem.val());
                                ctrl.$setValidity('dirEmailListCheck', false);
                                //attrs.dirEmailListCheckState = false;
                                return false;
                            }
                        }
                    });
                }
            }
        }

    }]);


function validEmailList(emailList) {

    //alert('1: ' + emailList);
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    var emailListArray = emailList.split(";");

    var result = true;
    emailListArray.every(function (email) {
        if (!reg.test(email.trim())) {
            result = false;
            return result;
        }
        return result;
    });

    //alert('2: ' + result);
    return result;
};