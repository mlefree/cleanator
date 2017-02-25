angular.module('myAngularApp.views.user', [])
    .config(function ($stateProvider) {

        $stateProvider

            .state('config', {
                url: '/config',
                abstract: true,
                templateUrl: 'views/user/configTabs.html'
            })

            .state('config.couple', {
                url: '/couple',
                cache: false,
                views: {
                    'config-couple': {
                        templateUrl: 'views/user/userAll.html',
                        controller: 'UsersCtrl'
                    }
                }
            })
            .state('config.cal', {
                url: '/cal',
                views: {
                    'config-cal': {
                        templateUrl: 'views/user/userCalendar.html',
                        controller: 'UsersCtrl'
                    }
                }
            });
    })

    //.controller('UsersCtrl', function ($scope, $timeout, $routeParams, $location, $q, srvData, srvConfig) {
    .controller('UsersCtrl', function ($scope, $log, $timeout, $q, $ionicModal, srvDataContainer, srvData) {
        'use strict';

        //$scope.userId = userId;
        //TODO $scope.userId = $routeParams.userId;
        //$scope.userToConfig = {};
        //$scope.userErrMessage = "";
        //$scope.userRequiredTasksNb = 0;
        //$scope.userRequiredTasksTime = 0;
        //$scope.userAllTasksNb = 0;
        //$scope.userAllTasksTime = 0;
        $scope.userIndicators = {};
        $scope.userSaved = false;

        $scope.userInitSpinnerStopped = false;
        $scope.afterNavigationInitSpinnerShow = function () {
            $timeout(function () {

                if (srvDataContainer.getAppFirstInitLevel() === 0) {
                    //One First sync needed just after login
                    $scope.navDataSync(srvDataContainer)
                        .then(function (msg) {
                            // Followed by a real binding
                            $scope.userDataSync()
                                .finally(function () {
                                    // save all userS
                                    if ($scope.userA) $scope.userSave($scope.userA);
                                    if ($scope.userB) $scope.userSave($scope.userB);
                                    $scope.userSaved = false;
                                })
                                .catch(function (err) {
                                    $log.error(err);
                                });
                        })
                        .catch(function (err) {
                            $log.error(err);
                        });
                }
                else {
                    $scope.userDataSync()
                        .then(function () {
                            //indicators
                            //$scope.userUpdateIndicleanator();
                            $scope.userIndicators = srvDataContainer.computeIndicators();
                        }).catch(function (err) {
                        $log.error(err);
                    });
                }

            }, 1000);
        };

        // Synchronise DB
        $scope.userDataSync = function () {
            var self = this;
            var deferred = $q.defer();
            $scope.navDataSync(srvDataContainer)
                .then(function (msg) {
                    $scope.userStopSpinnerWithMessage(msg);
                    deferred.resolve();
                })
                .catch(function (err) {
                    $log.error(err);
                });

            return deferred.promise;
        };

        $scope.userStopSpinnerWithMessage = function (msg) {
            var text = msg || "";
            if (text) $scope.navAddErrorMessage(text);
            $scope.userInitSpinnerStopped = true;
        };

        $scope.userSaveEnable = {};

        $scope.userSave = function (user) {
            if (!user || !user._id) return;
            var uid = user._id;

            if (typeof $scope.userSaveEnable[uid] !== "undefined" && $scope.userSaveEnable[uid] === false) {
                console.log("already saving");
                return;
            }
            $scope.userSaveEnable[uid] = false;

            // synthetise timeInMnPerWeekTodo
            $scope.userUpdateTimePerWeek(user);

            // store & save user data
            srvData.User.set(user)
                .then(function (userSaved) {
                    if (!$scope.userSaved) console.log("user saved");
                    $scope.userSaved = true;
                    $scope.userSaveEnable[uid] = true;
                    //indicators
                    $scope.userIndicators = srvDataContainer.computeIndicators();
                })
                .catch(function (err) {
                    $log.error(err);
                    $scope.userSaveEnable[uid] = true;
                });
        };

        $scope.userAHasSameTimeEachDay = false;

        $scope.userBHasSameTimeEachDay = false;

        $scope.setUserASameTimeEachDay = function (val) {
            //var value = val ? val : !$scope.userAHasSameTimeEachDay;
            //$scope.userAHasSameTimeEachDay = true;
            $scope.userUpdateTimePerWeek($scope.userA, true);
        };

        $scope.setUserBSameTimeEachDay = function (val) {
            //var value = val ? val : !$scope.userBHasSameTimeEachDay;
            //$scope.userBHasSameTimeEachDay = true;
            $scope.userUpdateTimePerWeek($scope.userB, true);
        };

        $scope.userUpdateTimePerWeek = function (user, forceSameValue) {
            if (!user) return;

            var defaultValuePerDay = Math.round(user[$scope.userCols.timeInMnPerWeekTodo] / 7);

            // same value each days
            var shouldPutSameValueInEachDays = false;
            if ($scope.userA && $scope.userA._id == user._id && $scope.userAHasSameTimeEachDay) shouldPutSameValueInEachDays = true;
            else if ($scope.userB && $scope.userB._id == user._id && $scope.userBHasSameTimeEachDay) shouldPutSameValueInEachDays = true;

            // synthetise timeInMnPerWeekTodo
            var mond = user[$scope.userCols.timeInMnPerMond] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerMond]) : defaultValuePerDay;
            var tues = user[$scope.userCols.timeInMnPerTues] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerTues]) : defaultValuePerDay;
            var wedn = user[$scope.userCols.timeInMnPerWedn] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerWedn]) : defaultValuePerDay;
            var thur = user[$scope.userCols.timeInMnPerThur] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerThur]) : defaultValuePerDay;
            var frid = user[$scope.userCols.timeInMnPerFrid] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerFrid]) : defaultValuePerDay;
            var satu = user[$scope.userCols.timeInMnPerSatu] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerSatu]) : defaultValuePerDay;
            var sund = user[$scope.userCols.timeInMnPerSund] >= 0 ? Math.round(user[$scope.userCols.timeInMnPerSund]) : defaultValuePerDay;
            var weekSum = mond + tues + wedn + thur + frid + satu + sund;

            if (shouldPutSameValueInEachDays || (forceSameValue === true)) {
                tues = wedn = thur = frid = satu = sund = mond;
                weekSum = mond + tues + wedn + thur + frid + satu + sund;
            }

            if (weekSum != user[$scope.userCols.timeInMnPerWeekTodo])
                user[$scope.userCols.timeInMnPerWeekTodo] = weekSum;

            user[$scope.userCols.timeInMnPerMond] = mond;
            user[$scope.userCols.timeInMnPerTues] = tues;
            user[$scope.userCols.timeInMnPerWedn] = wedn;
            user[$scope.userCols.timeInMnPerThur] = thur;
            user[$scope.userCols.timeInMnPerFrid] = frid;
            user[$scope.userCols.timeInMnPerSatu] = satu;
            user[$scope.userCols.timeInMnPerSund] = sund;

            //var hasSameTimeEachDay = (mond == tues && tues == wedn && wedn == thur && thur == frid && frid == satu && satu == sund);
            //if ($scope.userA && $scope.userA._id == user._id) $scope.userAHasSameTimeEachDay = hasSameTimeEachDay;
            //else if ($scope.userB && $scope.userB._id == user._id) $scope.userBHasSameTimeEachDay = hasSameTimeEachDay;

        };

        $scope.userUpdateIndicleanator = function () {
            $scope.userRequiredTasksNb = 0;
            $scope.userRequiredTasksTime = 0;
            $scope.userAllTasksNb = 0;
            $scope.userAllTasksTime = 0;
            if (!$scope.chores) return;

            // compute indicator for one week

            for (var i = 0; i < $scope.chores.length; i++) {
                var chore = $scope.chores[i];
                if (!chore.desactivate) {
                    var nbPerWeek = Math.round(7 / chore[$scope.choreCols.frequencyDays]);
                    nbPerWeek = (nbPerWeek === 0) ? 1 : nbPerWeek;
                    var timePerWeek = Math.round(nbPerWeek * chore[$scope.choreCols.timeInMn]);
                    $scope.userAllTasksNb += nbPerWeek;
                    $scope.userAllTasksTime += timePerWeek;
                    if (chore[$scope.choreCols.priority] < 3) {
                        //priority : Required estimation
                        $scope.userRequiredTasksNb += nbPerWeek;
                        $scope.userRequiredTasksTime += timePerWeek;
                    }
                }
            }
        };


        $scope.userGetIsCordovaOnline = function () {
            $scope.userIsCordovaOnline = srvDataContainer.isCordovaOnline;
            return $scope.userIsCordovaOnline;
        };
        $scope.userSetIsCordovaOnline = function (bool) {
            srvDataContainer.isCordovaOnline = bool;
        };
        $scope.userGetIsCordovaOnline();

        //------------------
        // Modals
        $ionicModal.fromTemplateUrl('views/user/modals.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function () {
            if ($scope.modal) $scope.modal.show();
        };

        $scope.closeModal = function (logout) {
            if ($scope.modal) $scope.modal.hide();
            if (logout) {
                srvDataContainer
                    .logout()
                    .then(function () {
                        if ($scope.navRedirect) $scope.navRedirect(srvDataContainer);
                    });
            }
        };

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            if ($scope.modal) $scope.modal.remove();
        });

        // Execute action on hide modal
        $scope.$on('modal.hidden', function () {
            // Execute action
        });

        // Execute action on remove modal
        $scope.$on('modal.removed', function () {
            // Execute action
        });

        //------------------
        // Initialization
        if ($scope.navRedirect) $scope.navRedirect(srvDataContainer);

    });
