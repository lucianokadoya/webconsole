'use strict';

angular.module('meccanoAdminApp')
  .controller('DeviceListCtrl', function($scope, Registration, $state, $stateParams, Devices, $rootScope) {
      
    // Initialize variables
    $scope.pageNumber = 1;
    $scope.parametersFilter = $state.params;

    $scope.Devices = Devices;

    // Status devices for populate input options
    $scope.statusDevices = ['NORMAL', 'WARNING', 'FAIL', 'WAITING_APPROVE'];

    $scope.registeredDevices = {};



    /** Function to load devices by device service 
      * @param parameters {object}
      * @param status
      * @param device
      * @param group
      * @param page
      * @param size
      **/
    function getDevices (parameters){
      $scope.isLoading = true;
      $scope.Devices.loadDevices().get(parameters, function (res){

        // Total Items to pagination
        if (res.data){
          $scope.totalItems = res.page.totalElements;
          $scope.registeredDevices.data = res.data;
        } else {
          $scope.totalItems = 1;
          $scope.registeredDevices.data = [];
          $scope.registeredDevices.data.push(res);
        }

        $scope.isLoading = false;

      }, function (err){
        // Erase registeredDevices array if no device was found
        if (err.status === 404) {
          $scope.registeredDevices.data = [];
          $scope.isLoading = false;
        }
      });
    };

    getDevices($state.params);

    /**
      * Show Details in a lateral panel
      * @params device {object}
      */
    $scope.showDetails = function(device){
      $scope.Devices.selected = device;
    }

    /** 
      * Function to search devices by selected filter
      * @param parameters {object}
      * @param status
      * @param device
      * @param group
      * @param page
      * @param size
      */
    $scope.search = function(parameters){
      parameters.page = 1;

      $state.go($state.current, parameters, {reload: true});

    }

    console.log('DeviceListCtrl',  $scope.pageNumber );
    $scope.pageChanged = function (parameters) {

      parameters.page = $scope.pageNumber;
      getDevices(parameters);

    }



  })

.controller('DeviceRegisterCtrl', function($scope, Registration, $state, $stateParams) {
  $scope.registration = new Registration();

  $scope.save = function() {
    $scope.registration.$save().then(function(data) {
      $state.go('device.list', $stateParams);
    });
  };
  $scope.cancel = function() {
    $state.go('device.list', $stateParams);
  };
})

.controller('DeviceEditCtrl', function($scope, Devices, $state, $stateParams) {


  $scope.Device = Devices;
  console.log($state.params)
  if ($scope.Device.selected == null) {
    Devices.loadDevices().get({device: $state.params.deviceId}, function (res){
      $scope.Device.selected = res;
    });
  }

  $scope.save = function() {
    Devices.loadDevices().update({device: $state.params.deviceId}, $scope.Device.selected);
    $state.go('device.list', {}, {reload: true});
  };
  $scope.destroy = function() {
    $http.delete('api/device/' + $scope.device.device).then(function(data) {

      $state.go('device.list', $stateParams);
    });
  };
  $scope.cancel = function() {
    $state.go('device.list', $stateParams);
  };
})

.controller('DeviceDetailCtrl', function($scope, $http, $state, $stateParams, $rootScope, Devices) {

  $scope.labels = ["January"];
  // $scope.series = ['Series A', 'Series B'];
  $scope.data = [
    [65, 10],
    [28, -20]
  ];
  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };

  $scope.Devices = Devices;  

  $scope.destroy = function() {

    Devices.loadDevices().delete({device: $scope.Devices.selected.device});
    $scope.Devices.selected = null;
    $state.go('device.list', {}, {reload: true});
  };
  $scope.cancel = function() {
    $state.go('device.list', $stateParams);
  };

});
