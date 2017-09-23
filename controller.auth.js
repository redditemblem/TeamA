app.controller('AuthCtrl', ['$scope', '$location', '$interval', 'DataService', function ($scope, $location, $interval, DataService) {
    var id = fetch();
	var sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
    $scope.ready = false;
    var checkGapi = $interval(checkAuth, 250);
    $scope.loadingIcon = pickLoadingIcon();
    var bar = document.getElementById('progress'); 
	
	//Hide dialogs at start
	$scope.showShop = false;
	$scope.showConvoy = false;

    //Set div visibility
    var authorizeDiv = document.getElementById('authorize-div');
	var unavailableDiv = document.getElementById('unavailable-div');
    var loadingDiv = document.getElementById('loading-div');
    var bar = document.getElementById('progress');
	unavailableDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
	bar.style.value = '0px';

	//Global music variables
	$scope.playMusic = false;
	$scope.$root.toggleMusic = function(){ 
		var audio = document.getElementById("audioPlayer");
		if($scope.playMusic){
			$scope.playMusic = false;
			audio.pause();
		}
		else{
			$scope.playMusic = true;
			audio.play();
		}
	};

	function displayShopDialog(){ $scope.showShop = true; $scope.$apply(); };
	function displayConvoyDialog(){ $scope.showConvoy = true; $scope.$apply(); };

    //Continue to check gapi until it's loaded
    function checkAuth() {
    	if(gapi.client != undefined){
    		$scope.ready = true;
    		$interval.cancel(checkGapi);
    	}
    }

    //Initiate auth flow in response to user clicking authorize button.
    $scope.loadAPI = function(event, type) {
    	gapi.client.init({
    		'apiKey': id, 
    		'discoveryDocs': ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    	}).then(function(){
			if(type == 2) displayConvoyDialog();
			else if(type == 3) displayShopDialog();
			else testWebAppAvailability();
    	});
    };

	function testWebAppAvailability(){
	  gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "COLUMNS",
        range: 'Map Management!A1:A1',
      }).then(function(response) {
		 var toggle = response.result.values[0][0];
		 if(toggle == "Off"){
			authorizeDiv.style.display = 'none';
			unavailableDiv.style.display = 'inline';
		 }else{
			authorizeDiv.style.display = 'none';
    		loadingDiv.style.display = 'inline';
    		DataService.loadMapData();
		 }
    	});
	};
    
    function pickLoadingIcon(){
    	var rand = Math.floor((Math.random() * 9) + 1); //generate a number between 1 and 14
    	switch(rand){
	    	case 1: return "IMG/LOAD/Adriana.gif"; break;
	    	case 2: return "IMG/LOAD/Cabaletto.gif"; break;
	    	case 3: return "IMG/LOAD/Himaya.gif"; break;
	    	case 4: return "IMG/LOAD/Mars.gif"; break;
	    	case 5: return "IMG/LOAD/Miranda.gif"; break;
	    	case 6: return "IMG/LOAD/Sally.gif"; break;
	    	case 7: return "IMG/LOAD/Seed.gif"; break;
	    	case 8: return "IMG/LOAD/Suleiman.gif"; break;
	    	case 9: return "IMG/LOAD/Zain.gif"; break;
    	}
    };

    function fetch(){
    	var request = new XMLHttpRequest();
    	request.open('GET', 'LIB/text.txt', false);
    	request.send();
    	if (request.status == 200)
    		return request.responseText;
    };

    //Redirect user to the map page once data has been loaded
    function redirect(){
    	$location.path('/map').replace();
    	$scope.$apply();
	};
	
	var img = document.getElementById("mapImg");
	img.onload = function(){
		DataService.calculateRanges();
	};

	$scope.$on('loading-bar-updated', function(event, data, map) {
		bar.value = data;
		
		if(map != undefined && img.src == "") img.src = map;
		if(data >= 100) redirect();
	});
}]);