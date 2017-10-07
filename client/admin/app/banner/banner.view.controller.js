'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:BannerListCtrl
 * @description
 * # BannerListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('BannerViewCtrl', ['$scope', '$stateParams', '$location', '$filter', 'LoopBackAuth', 'ModalService', 'Banner',
			function ($scope, $stateParams, $location, $filter, LoopBackAuth, ModalService, Banner) {	

	/**
     *  view baaner 
    **/ 
	$scope.model = [];

	Banner
    .findById({    	
    	id: $stateParams.id    	
    })
    .$promise
    .then(
    function (res) {      
    	$scope.model = res;
    },
    function (err) {                            
        console.log('err', err);
        alert(err.data.error.message);
    });		

    /**
	 *  save changed  
	**/
	$scope.save = function () {
	
		Banner
        .upsert($scope.model)
        .$promise
        .then(
        function (res) {               
	        $location.nextAfterLogin = $location.path();
            $location.path('/banner/list');			
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });

	};


    /** 
     *  Datetimepicker Bindable functions
    **/
    $scope.endDateBeforeRender = endDateBeforeRender
    $scope.endDateOnSetTime = endDateOnSetTime
    $scope.startDateBeforeRender = startDateBeforeRender
    $scope.startDateOnSetTime = startDateOnSetTime

    $scope.$watch('model.start', function (newValue) {
        $scope.model.start = $filter('date')(newValue, 'yyyy-MM-dd HH:mm'); // Or whatever format your real model should use
    });

    $scope.$watch('model.end', function (newValue) {
        $scope.model.end = $filter('date')(newValue, 'yyyy-MM-dd HH:mm'); // Or whatever format your real model should use
    });
    
    function startDateOnSetTime () {
      $scope.$broadcast('start-date-changed');
    }

    function endDateOnSetTime () {
      $scope.$broadcast('end-date-changed');
    }

    function startDateBeforeRender ($dates) {
      if ($scope.model.end) {
        var activeDate = moment($scope.model.end);

        $dates.filter(function (date) {
          return date.localDateValue() >= activeDate.valueOf()
        }).forEach(function (date) {
          date.selectable = false;
        })
      }
    }

    function endDateBeforeRender ($view, $dates) {
      if ($scope.model.start) {
        var activeDate = moment($scope.model.start).subtract(1, $view).add(1, 'minute');

        $dates.filter(function (date) {
          return date.localDateValue() <= activeDate.valueOf()
        }).forEach(function (date) {
          date.selectable = false;
        })
      }
    }

}]);
