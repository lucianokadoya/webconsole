'use strict';

angular.module('meccanoAdminApp')
  .controller('DeviceListCtrl', function($scope, Registration, $state, $stateParams, Devices) {

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
      * @param version
      * @param page
      * @param size
      **/
    function getDevices (parameters){
      // Start load gif
      $scope.isLoading = true;

      $scope.Devices.loadDevices().get(parameters, function (res){

        // Total Items to pagination
        $scope.totalItems = res.page.totalElements;
        $scope.registeredDevices.data = res.data;

        // Stop load gif
        $scope.isLoading = false;
      }, function (err){
        // Erase registeredDevices array if no device was found
        if (err.status === 404) {
          $scope.registeredDevices.data = [];
          $scope.isLoading = false;
        }
      });
    }

    // Load devices by the parameters from url
    getDevices($state.params);

    /**
      * Show Details in a lateral panel
      * @param device {object}
      */
    $scope.showDetails = function(device){
      $scope.Devices.selected = device;

      $scope.Devices.devices().activity({device: device.device}, function (res){
        $scope.Devices.selected.activity = {};
        $scope.Devices.selected.activity.data = [[]];
        $scope.Devices.selected.activity.labels = [];
        if (res.data.length !== 0){
          res.data.reverse();
          angular.forEach(res.data, function (item){
            $scope.Devices.selected.activity.labels.push(item.hour + 'h');
            $scope.Devices.selected.activity.data[0].push(item.updates);
          });
        } else {
          $scope.Devices.selected.activity.data = [[0]];
          $scope.Devices.selected.activity.labels = [0];
        }
      });
    };

    /**
      * Function to search devices by selected filter
      * @param parameters {object}
      * @param status
      * @param device
      * @param group
      * @param version
      * @param page
      * @param size
      */
    $scope.search = function(parameters){
      parameters.page = 1;
      $state.go($state.current, parameters, {reload: true});
    };

    $scope.pageChanged = function (parameters) {
      parameters.page = $scope.pageNumber;
      getDevices(parameters);
    };
  })

.controller('DeviceRegisterCtrl', function($scope, $state, $stateParams, Devices) {

  $scope.Devices = Devices;
  $scope.errors = {};

  $scope.save = function(form) {
    Devices.devices().post($scope.Device.selected).$promise
      .then(function() {
        $state.go('device.list', {}, {
          reload: true
        });
      }).catch(function(err) {
        err = err.data;
        // Update validity of form fields that match the sequelize errors
        if (err.name) {
          angular.forEach(err.errors,function(error) {
            form[error.path].$setValidity('serverError', false);
            $scope.errors[error.path] = error.message;
          });
        }
      });
  };
  $scope.cancel = function() {
    $state.go('device.list');
  };
})

.controller('DeviceEditCtrl', function($scope, Devices, $state, $stateParams, $http) {

  $scope.Device = Devices;

  $scope.inputDisabled = true;
  if ($scope.Device.selected === null || $scope.Device.selected === undefined) {
    Devices.loadDevices().get({device: $state.params.deviceId}, function (res){
      $scope.Device.selected = res;
    });
  }

  $scope.save = function() {
    Devices.devices().update({device: $state.params.deviceId}, $scope.Device.selected);
    $state.go('device.list', {}, {reload: true});
  };
  $scope.destroy = function() {
    $http.delete('api/device/' + $scope.device.device).then(function() {
      $state.go('device.list', $stateParams,{reload: true});
    });
  };
  $scope.cancel = function() {
    $state.go('device.list', $stateParams);
  };
})

.controller('DeviceDetailCtrl', function($scope, $http, $state, $stateParams, $rootScope, Devices, $uibModal, Messages,Auth, Modal,alertsPanel) {
  $scope.series = ['Updates'];

  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };

  $scope.Devices = Devices;

  // Open Modal to confirm the de
  $scope.destroy = function (device) {
    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'app/device/delete.confirm.html',
      controller: 'DeleteDeviceCtrl',
      size: 'xs',
      resolve: {
        device: function () {
          return device;
        }
      }
    });

    modalInstance.result.then(function () {
      $state.go($state.current, {}, {reload: true});
      $scope.Devices.selected = null;
    }, function () {

    });
  };

  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };

  $scope.sendCommand = Modal.confirm.command(function(message) {
      Messages.save({
        device : $scope.Devices.selected.device,
        message:message,
        sender: Auth.getCurrentUser().email,
        delivery_type: 'TRANSIENT'
      },function() {
          alertsPanel.addSuccess('Command sent with success.');
      });
    });


})
.controller('DeleteDeviceCtrl', function ($scope, $uibModalInstance, device, Devices, $timeout){

  // Device info to confirm delete
  $scope.device = device;

  // Delete Device
  $scope.destroy = function() {
    Devices.devices().delete({device: device.device});

    $timeout(function(){
      $uibModalInstance.close();
    }, 500);
  };

  // Close modal without do nothing
  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

});
