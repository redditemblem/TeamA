app.controller('AuthCtrl', ['$scope', '$location', '$interval', 'DataService', 'MusicService', function ($scope, $location, $interval, DataService, MusicService) {
    var id = fetch();
	var sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
    $scope.ready = false;
    var checkGapi = $interval(checkAuth, 250);
    $scope.loadingIcon = pickLoadingIcon();
    var bar = document.getElementById('progress'); 

    //Set div visibility
    var authorizeDiv = document.getElementById('authorize-div');
	var unavailableDiv = document.getElementById('unavailable-div');
    var loadingDiv = document.getElementById('loading-div');
    var bar = document.getElementById('progress');
	unavailableDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
	bar.style.value = '0px';

	//Load chapter music
	MusicService.initalizePlayer();
	$scope.toggleMusic = function(){ MusicService.toggleMusic(); };
	$scope.musicPlaying = function(){ return MusicService.musicPlaying(); };

	//Dialogs
	$scope.showShop = false;
	$scope.showConvoy = false;
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
			if(type == 3) displayConvoyDialog();
			else if(type == 4) displayShopDialog();
			else testWebAppAvailability(type);
    	});
    };

	function testWebAppAvailability(type){
		gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "COLUMNS",
			range: (type == 2 ? 'Gaiden ' : '') + 'Map Management!A1:A1',
      }).then(function(response) {
		 var toggle = response.result.values[0][0];
		 if(toggle == "Off"){
			authorizeDiv.style.display = 'none';
			unavailableDiv.style.display = 'inline';
		 }else{
			authorizeDiv.style.display = 'none';
    		loadingDiv.style.display = 'inline';
    		DataService.loadMapData(type);
		 }
    	});
	};
    
    function pickLoadingIcon(){
    	var rand = Math.floor((Math.random() * 17) + 1); //generate a number
    	switch(rand){
	    	case 1: return "IMG/LOAD/Cabaletto.gif"; break;
			case 2: return "IMG/LOAD/Himaya.gif"; break;
	    	case 3: return "IMG/LOAD/Mars.gif"; break;
	    	case 4: return "IMG/LOAD/Miranda.gif"; break;
	    	case 5: return "IMG/LOAD/Sally.gif"; break;
	    	case 6: return "IMG/LOAD/Seed.gif"; break;
	    	case 7: return "IMG/LOAD/Suleiman.gif"; break;
			case 8: return "IMG/LOAD/Zain.gif"; break;
			case 9: return "IMG/LOAD/Jetsetter.gif"; break;
			case 10: return "IMG/LOAD/Ayer.gif"; break;
			case 11: return "IMG/LOAD/Cirocco.gif"; break;
			case 12: return "IMG/LOAD/Relgia.gif"; break;
			case 13: return "IMG/LOAD/Daniel.gif"; break;
			case 14: return "IMG/LOAD/Gracie.gif"; break;
			case 15: return "IMG/LOAD/Nyrandisa.gif"; break;
			case 16: return "IMG/LOAD/Kiera.gif"; break;
			case 17: return "IMG/LOAD/Convoy.gif"; break;
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