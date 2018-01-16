app.service('ShopDataService', ['$rootScope', function ($rootScope) {
    const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
    var inventory;

    this.getItems = function(){ return inventory; };

    this.loadShopData = function(){
        gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Shop!B2:AF',
	    }).then(function(response) {
			var items = response.result.values;
			inventory = [];

			for(var i = 1; i < items.length; i++){
				var c = items[i];
				if(c[0].length > 0){
					inventory.push({
						'name' : c[0],
						'stock' : c[1] == "-" ? 99 : (parseInt(c[1]) | 0),
						'cost' : parseInt(c[2].match(/^[0-9]+/)),
						'sale' : c[3] != "" ? parseInt(c[3].match(/^[0-9]+/)) : 0,
						'type' : c[4],
						'rank' : c[5],
						'might' : c[7],
						'mightVal' : parseInt(c[7]) | 0,
						'hit' : c[8],
						'hitVal' : parseInt(c[8]) | 0,
						'crit' : c[9],
						'critVal' : parseInt(c[9]) | 0,
						'avo' : c[10],
						'eva' : c[11],
						'proc' : c[12],
						'ospd' : c[13],
						'dspd' : c[14],
						'range' : c[16],
						'rangeVal' : parseInt(c[16].substring(c[16].lastIndexOf("-")).trim()) | 0,
						'effect' : c[17],
						'desc' : c[19] != undefined ? c[19] : ""
					})
				}
			}

            $rootScope.$broadcast('shop-load-finished'); //signal end of load
		});
	};	    
}]);