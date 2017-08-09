app.controller('ConvoyCtrl', ['$scope', 'ConvoyDataService', function($scope, ConvoyDataService){
    $scope.items = [];
    var loadingListener;

    //Fetch convoy data
    $scope.fetchConvoy = function(){
      if($scope.refreshing == true) return;

      $scope.refreshing = true;
      loadingListener = $scope.$on('convoy-load-finished', function(event) {
        loadingListener();
        $scope.refreshing = false;
        $scope.items = ConvoyDataService.getItems();
        $scope.$apply(); //force update of items list
      });

      ConvoyDataService.loadConvoyData();
    };

    //Initialize items list, load it if it hasn't been already
    if(ConvoyDataService.getItems() == null) $scope.fetchConvoy();
    else $scope.items = ConvoyDataService.getItems();

    //Color Constants
    const ROW_COLORS = {
      'Sword' : '#ff8282',
      'Lance' : '#8290ff',
      'Axe' : '#5eba60',
      'Bow' : '#fccc7e',
      'Knife' : '#fafc7e',
      'Light' : '#fbffc9',
      'Anima' : '#fc7eaa',
      'Dark' : '#6c5372',
      'Staff' : '#ceebed'
    }

    //Filter settings
    var sortOrder = 'name';
    $scope.showSword = true;
    $scope.showLance = true;
    $scope.showAxe = true;
    $scope.showBow = true;
    $scope.showKnife = true;
    $scope.showLight = true;
    $scope.showAnima = true;
    $scope.showDark = true;
    $scope.showStaff = true;
    $scope.showOther = true;

    $scope.getItemSortOrder = function(){
      return sortOrder;
    };

    $scope.displayItemType = function(type){
      if(type == "None" || type == "Gear" || type == "Consumable" || type == "Item") return $scope.showOther;
      return $scope["show" + type] == true;
    };

    $scope.updateSortOrder = function(newOrder){ sortOrder = newOrder; };

    $scope.getRowColor = function(type){
      var color = ROW_COLORS[type];
      if(color != undefined) return color;
      else return 'lightgray';
    };

    $scope.allChecked = function(){
      return $scope.showSword && $scope.showLance && $scope.showAxe && $scope.showBow && $scope.showKnife
          && $scope.showLight && $scope.showAnima && $scope.showDark && $scope.showStaff && $scope.showOther;
    };

    $scope.setAllCheckboxes = function(){
        var val = !($scope.allChecked());
        $scope.showSword = val;
        $scope.showLance = val;
        $scope.showAxe = val;
        $scope.showBow = val;
        $scope.showKnife = val;
        $scope.showLight = val;
        $scope.showAnima = val;
        $scope.showDark = val;
        $scope.showStaff = val;
        $scope.showOther = val;
    };

    $scope.closeConvoy = function() {
      $scope.$parent.$parent.showConvoy = false;
    };
}]);