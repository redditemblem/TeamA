app.service('ShopDataService', ['$rootScope', function ($rootScope) {
    const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
    var inventory;

    this.getItems = function(){ return inventory; };

    this.loadShopData = function(){
        gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Shop!B2:P',
	    }).then(function(response) {
			var items = response.result.values;
			inventory = [];

			for(var i = 1; i < items.length; i++){
				var c = items[i];
				if(c[0].length > 0){
					inventory.push({
						'name' : c[0],
						'stock' : c[1] != "-" ? parseInt(c[1]) : 0,
						'cost' : parseInt(c[2].match(/^[0-9]+/)),
						'sale' : c[3] != "" ? parseInt(c[3].match(/^[0-9]+/)) : 0,
						'type' : c[4],
						'rank' : c[5],
						'might' : c[7],
						'mightVal' : c[7].match(/^[0-9]+$/) != null ? parseInt(c[7].match(/^[0-9]+$/)) : 0,
						'hit' : c[8],
						'hitVal' : c[8].match(/^[0-9]+$/) != null ? parseInt(c[8].match(/^[0-9]+$/)) : 0,
						'crit' : c[9],
						'critVal' : c[9].match(/^[0-9]+$/) != null ? parseInt(c[9].match(/^[0-9]+$/)) : 0,
						'range' : c[11],
						'rangeVal' : c[11].match(/[0-9]+$/) != null ? parseInt(c[11].match(/[0-9]+$/)) : 0,
						'effect' : c[12],
						'desc' : c[14] != undefined ? c[14] : ""
					})
				}
			}

            $rootScope.$broadcast('shop-load-finished'); //signal end of load
		});
	};	    
}]);