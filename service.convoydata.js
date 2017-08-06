app.service('ConvoyDataService', ['$rootScope', function ($rootScope) {
    const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
    var inventory;

    this.getItems = function(){ return inventory; };

    this.loadConvoyData = function(){
		gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Convoy!B2:AB',
	    }).then(function(response) {
			var items = response.result.values;
			inventory = [];

			for(var i = 0; i < items.length; i++){
				var c = items[i];
				if(c[0].length > 0){
					inventory.push({
						'name' : c[0],
						'owner' : c[1],
						'type' : c[2],
						'rank' : c[3],
						'might' : c[5].match(/^-?[0-9]+$/) != null ? parseInt(c[5]) : 0,
						'hit' : c[6].match(/^-?[0-9]+$/) != null ? parseInt(c[6]) : 0,
						'crit' : c[7].match(/^-?[0-9]+$/) != null ? parseInt(c[7]) : 0,
						'range' : c[9],
						'effect' : c[10],
						'desc' : c[12],
						'value' : c[26] != undefined && c[26].match(/^-?[0-9]+$/) != null ? parseInt(c[26]) : 0,
					})
				}
			}

            $rootScope.$broadcast('convoy-load-finished'); //signal end of load
		});
	};	    
}]);