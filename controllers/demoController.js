app.controller('demoController', function ($scope, $http, $location, Restangular, demoResource) {



    var cHygiene = demoResource.getDemoResource().customGET('config', {type: 'EMAIL'}).$object;

    // stub out data
    var alerts = [
        { type: 'danger', msg: 'This page is currently under construction. Check back soon for updates!' }
    ];

    var messages = [
        { type: 'info', msg: 'We have a standalone vulgarity process that can check for the presence of vulgar words. If you would like to see it in action try out the name cleanser' }
    ];

    var cleansedEmails = []
    var cleansedPhones = [ ]
    var cleansedNames = []
    var cleansedAddresses =  [];
    var cleansedGeo = [];

    //init for Initialization
    init();

    function init() {
        $scope.alerts = alerts;
        $scope.messages = messages;

        $scope.cHygiene = cHygiene;

        $scope.cleansedPhones = cleansedPhones;

        $scope.cleansedEmails = cleansedEmails;

        $scope.cleansedNames = cleansedNames;

        $scope.cleansedAddresses = cleansedAddresses;

        $scope.cleansedGeo = cleansedGeo;
    }


    $scope.removeResultEmail = function(index){
        $scope.cleansedEmails.splice(index, 1);
    }
    $scope.removeResultPhone = function(index){
        $scope.cleansedPhones.splice(index, 1);
    }
    $scope.removeResultName = function(index){
        $scope.cleansedNames.splice(index, 1);
    }
    $scope.removeResultAddress = function(index){
        $scope.cleansedAddresses.splice(index, 1);
    }
    $scope.removeResultGeo = function(index){
        $scope.cleansedGeo.splice(index, 1);
    }

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };


    $scope.hygieneEmail = function(cHygiene) {
        delete cHygiene.route;
        delete cHygiene.reqParams;
        delete cHygiene.parentResource;
        delete cHygiene.restangularCollection;


        demoResource.getDemoResourceEmail().customPOST(cHygiene).then(function ($object){
            $scope.cleansedEmails = [];
            $scope.cleansedEmails.push({originalEmail: $object.originalEmail,
                cleansedDomain: $object.cleansedDomain,
                cleansedEmail: $object.cleansedEmail,
                validEmail: $object.validEmail});

            $scope.alerts.push({type: 'success', msg: "It looks like this is working sooo well!"});

        }, function () {
            $scope.alerts.push({type: 'danger', msg: 'HOLD UP! There might be a problem'});
            console.log("There was an error running the hygiene email client");
        })
    };

    $scope.hygienePhone = function(cHygiene) {
        demoResource.getDemoResourcePhone().customPOST(cHygiene).then(function($object){
            $scope.cleansedPhones = [];
            $scope.cleansedPhones.push({originalPhoneNumber: $object.originalPhoneNumber,
                cleansedExtension: $object.cleansedExtension,
                cleansedPhoneNumber: $object.cleansedPhoneNumber,
                cleansedPhoneNumberWithoutFormatting: $object.cleansedPhoneNumberWithoutFormatting,
                validPhoneNumber: $object.validPhoneNumber});

            $scope.alerts.push({type: 'success', msg: "It looks like this is working sooo well!"});

        }, function () {
            $scope.alerts.push({type: 'danger', msg: 'HOLD UP! There might be a problem'});
            console.log("There was an error running the hygiene phone client");
        })
    };

    $scope.hygieneName = function(cHygiene){
        demoResource.getDemoResourceName().customPOST(cHygiene).then(function($object){
            $scope.cleansedNames = [];
            $scope.cleansedNames.push({cleansedCompanyName: $object.cleansedCompanyName,
                    cleansedFullName: $object.cleansedFullName,
                    cleansedFirstName: $object.cleansedFirstName,
                    cleansedLastName: $object.cleansedLastName,
                    cleansedMiddleName: $object.cleansedMiddleName,
                    cleansedPrefix: $object.cleansedPrefix,
                    cleansedSuffix: $object.cleansedSuffix,
                    company: $object.company,
                    vulgar: $object.vulgar}
            );

        }, function() {
            $scope.alerts.push({type: 'danger', msg: 'HOLD UP! There might be a problem'});
            console.log("There was an error running the hygiene name client");
        })
    };

    $scope.hygieneAddress = function(cHygiene){
        demoResource.getDemoResourceAddress().customPOST(cHygiene).then(function($object){
                $scope.cleansedAddresses = [];
                $scope.cleansedAddresses.push({cleansedAddress1: $object.cleansedAddress1,
                                            cleansedAddress2: $object.cleansedAddress2,
                                            cleansedAddressType: $object.cleansedAddressType,
                                            cleansedAddressTypeDesc: $object.cleansedAddressTypeDesc,
                                            cleansedCity: $object.cleansedCity,
                                            cleansedCompanyName: $object.cleansedCompanyName,
                                            cleansedCountry: $object.cleansedCountry,
                                            cleansedDeliveryPointCode: $object.cleansedDeliveryPointCode,
                                            cleansedDPVCodes: $object.cleansedDPVCodes,
                                            cleansedPostalCode: $object.cleansedPostalCode,
                                            cleansedPostalCode2: $object.cleansedPostalCode2,
                                            cleansedPostDirection: $object.cleansedPostDirection,
                                            cleansedPreDirection: $object.cleansedPreDirection,
                                            cleansedRegion: $object.cleansedRegion,
                                            cleansedResultCodes: $object.cleansedResultCodes,
                                            cleansedStatusCode: $object.cleansedStatusCode,
                                            cleansedStreetName: $object.cleansedStreetName,
                                            cleansedStreetNumber: $object.cleansedStreetNumber,
                                            cleansedSuffix: $object.cleansedSuffix,
                                            cleansedSuite: $object.cleansedSuite,
                                            cleansedSuiteNumber: $object.cleansedSuiteNumber,
                                            cleansedSuiteType: $object.cleansedSuiteType,
                                            deliverable: $object.deliverable}
                );


        })

    };

    $scope.hygieneGeo = function(cHygiene){
        demoResource.getDemoResourceGeoCode().customPOST(cHygiene).then(function($object){
            $scope.cleansedGeo = [];
            $scope.cleansedGeo.push({censusBlock: $object.censusBlock,
                                        censusTract: $object.censusTract,
                                        countyFips: $object.countyFips,
                                        countyName: $object.countyName,
                                        errorCode: $object.errorCode,
                                        latitude: $object.latitude,
                                        longitude: $object.longitude,
                                        placeCode: $object.placeCode,
                                        placeName: $object.placeName,
                                        resultCode: $object.resultCode,
                                        resultCodeDescription: $object.resultCodeDescription,
                                        statusCode: $object.statusCode,
                                        timeZone: $object.timeZone,
                                        timeZoneCode: $object.timeZoneCode})


            })
    };

});
