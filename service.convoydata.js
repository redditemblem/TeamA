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
						'might' : c[5],
						'mightVal' : parseInt(c[5]) | 0,
						'hit' : c[6],
						'hitVal' : parseInt(c[6]) | 0,
						'crit' : c[7],
						'critVal' : parseInt(c[7]) | 0,
						'avo' : c[8],
						'eva' : c[9],
						'proc' : c[10],
						'ospd' : c[11],
						'dspd' : c[12],
						'range' : c[14],
						'rangeVal' : parseInt(c[14].substring(c[14].lastIndexOf("-")).trim()) | 0,
						'effect' : c[15],
						'desc' : c[17] != undefined ? c[17] : ""
					})
				}
			}

            $rootScope.$broadcast('convoy-load-finished'); //signal end of load
		});
	};	    
}]);