app.controller('AuthCtrl', ['$scope', '$location', '$interval', 'DataService', function ($scope, $location, $interval, DataService) {
    var id = fetch();
	var sheetId = '19OIsTc_rxylCoqq2JOIFwx3avsl-lQeqd4VD_NzrmBU';
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
    
    //Continue to check gapi until it's loaded
    function checkAuth() {
    	if(gapi.client != undefined){
    		$scope.ready = true;
    		$interval.cancel(checkGapi);
    	}
    }

    //Initiate auth flow in response to user clicking authorize button.
    $scope.loadAPI = function(event) {
    	gapi.client.init({
    		'apiKey': id, 
    		'discoveryDocs': ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    	}).then(function(){
			testWebAppAvailability();
    		
    	});
    };

	function testWebAppAvailability(){
	  gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "COLUMNS",
        range: 'Management!A1:A1',
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
    	var rand = Math.floor((Math.random() * 14) + 1); //generate a number between 1 and 14
    	switch(rand){
	    	case 1: return "IMG/cavalier.gif"; break;
	    	case 2: return "IMG/darkmage.gif"; break;
	    	case 3: return "IMG/diviner.gif"; break;
	    	case 4: return "IMG/fighter.gif"; break;
	    	case 5: return "IMG/kitsune.gif"; break;
	    	case 6: return "IMG/knight.gif"; break;
	    	case 7: return "IMG/ninja.gif"; break;
	    	case 8: return "IMG/samurai.gif"; break;
	    	case 9: return "IMG/spearfighter.gif"; break;
	    	case 10: return "IMG/thief.gif"; break;
	    	case 11: return "IMG/archer.gif"; break;
	    	case 12: return "IMG/skyknight.gif"; break;
	    	case 13: return "IMG/wolfskin.gif"; break;
	    	case 14: return "IMG/troubadour.gif"; break;
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