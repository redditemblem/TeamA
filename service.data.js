app.service('DataService', ['$rootScope', function ($rootScope) {
	var sheetId = '19OIsTc_rxylCoqq2JOIFwx3avsl-lQeqd4VD_NzrmBU';
	var progress = 0;
	var characters = null;
	var enemies = null;
	var rows = [];
	var cols = [];
	var map, characterData, enemyData, itemIndex, skillIndex, statusIndex, traitIndex, supportIndex, supportBonuses, coordMapping, terrainIndex, terrainLocs;
	
	this.getCharacters = function(){ return characters; };
	this.getMap = function(){ return map; };
	this.getSupportIndex = function(){ return supportIndex; };
	this.getSupportBonuses = function(){ return supportBonuses; };
	this.getRows = function(){ return rows; };
	this.getColumns = function(){ return cols; };
	this.getTerrainTypes = function(){ return terrainIndex; };
	this.getTerrainMappings = function(){ return terrainLocs; };

	this.loadMapData = function(){ fetchCharacterData(); };
	this.calculateRanges = function(){ getMapDimensions(); };
	
	//\\//\\//\\//\\//\\//
	// DATA AJAX CALLS  //
	//\\//\\//\\//\\//\\//

    function fetchCharacterData() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "COLUMNS",
        range: 'Player Stats!B:ZZ',
      }).then(function(response) {
    	 characterData = response.result.values;
		 characterData.splice(characterData.length-2, 2);
    	 updateProgressBar();
    	 fetchCharacterImages();
      });
    };
    
    function fetchCharacterImages() {
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          majorDimension: "ROWS",
          valueRenderOption: "FORMULA",
          range: 'Player Stats!B3:ZZ3',
        }).then(function(response) {
      	 var images = response.result.values[0];
      	 for(var i = 0; i < images.length; i++)
		   if(characterData[i][0] != "")
      		 characterData[i][2] = processImageURL(images[i]);
      	 updateProgressBar();
      	 fetchEnemyData();
        });
      };
      
    function fetchEnemyData(){
    	gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            range: 'Enemy Stats!B:ZZ',
          }).then(function(response) {
        	 enemyData = response.result.values;
        	 updateProgressBar();
        	 fetchEnemyImages();
          });
    };
    
    function fetchEnemyImages() {
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          majorDimension: "ROWS",
          valueRenderOption: "FORMULA",
          range: 'Enemy Stats!B3:ZZ3',
        }).then(function(response) {
      	 var images = response.result.values[0];
      	 for(var i = 0; i < images.length; i++)
      		enemyData[i][2] = processImageURL(images[i]);
      	 updateProgressBar();
      	 fetchSkillData();
        });
      };
    
    function fetchSkillData(){
    	gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Skills!A:C',
        }).then(function(response) {
        	skillIndex = response.result.values;
        	updateProgressBar();
        	fetchItemData();
        });
    };
    
    function fetchItemData(){
    	gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Weapon Index!A:K',
          }).then(function(response) {
        	 itemIndex = response.result.values;
        	 updateProgressBar();
        	 fetchStatusData();
          });
    };

	function fetchStatusData(){
    	gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Status Effects!A:D',
          }).then(function(response) {
        	 statusIndex = response.result.values;
        	 updateProgressBar();
        	 fetchTraitData();
          });
    };

	function fetchTraitData(){
		gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Traits!A:C',
          }).then(function(response) {
        	 traitIndex = response.result.values;
        	 updateProgressBar();
        	 fetchSupportRanks();
          });
	};

	function fetchSupportRanks(){
		gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Support Data!A:P',
          }).then(function(response) {
        	 var data = response.result.values;
			 var colHeader = data[0];
			 data.splice(0,1);
			 supportIndex = {};

			 //Process support matrix
			 for(var row in data){
				 var temp = {};
				 for(var i = 1; i < data[row].length; i++){
					temp[colHeader[i]] = data[row][i];
				 }
				 supportIndex[data[row][0]] = temp;
			 }

        	 updateProgressBar();
        	 fetchSupportBonuses();
          });
	};
    
	function fetchSupportBonuses(){
		gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Support Bonuses!A:L',
          }).then(function(response) {
        	 var data = response.result.values;
			 var colHeader = data[0];
			 data.splice(0,1);
			 supportBonuses = {};

			 //Process support matrix
			 for(var row in data){
				 var temp = {};
				 for(var i = 1; i < data[row].length; i++){
					temp[colHeader[i]] = data[row][i];
				 }
				 supportBonuses[data[row][0]] = temp;
			 }

        	 updateProgressBar();
        	 fetchTerrainIndex();
		});
	};

	function fetchTerrainIndex(){
		gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Terrain Chart!A2:K',
		}).then(function(response) {
			var rw = response.result.values;
			terrainIndex = {};

			for(var i = 1; i < rw.length; i++){
				var r = rw[i];
				terrainIndex[r[0]] = {
					'avo' : r[1] != "-" ? parseInt(r[1]) : 0,
					'def' : r[2] != "-" ? parseInt(r[2]) : 0,
					'Foot' :  r[3],
					'Armour' : r[4],
					'Mounted' : r[5],
					'Barbarian' :  r[6],
					'Mage' :  r[7],
					'Fliers' : r[8],
					'effect' : r[9]
				}
			}

			updateProgressBar();
			fetchTerrainChart();
		});
	};

	function fetchTerrainChart(){
	    gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Terrain Mapping!A:B',
	    }).then(function(response) {
			coordMapping = response.result.values;

			updateProgressBar();
			processCharacters();
		});
	};

    function processCharacters(){
		characters = {};
    	for(var i = 0; i < characterData.length; i++){
    		var c = characterData[i];
			if(c[0] != ""){ //if character has a name
				var currObj = {
					'name'   : c[0],
					'player' : c[1],
					'spriteUrl' : c[2],
					'class'  : c[3],
					'maxHp'  : c[4],
					'currHp' : c[5],
					'Str' : c[6],
					'Mag' : c[7],
					'Skl' : c[8],
					'Spd' : c[9],
					'Lck' : c[10],
					'Def' : c[11],
					'Res' : c[12],
					'Con' : c[13],
					'Mov' : c[14],
					'lvl' : c[15],
					'exp' : c[16],
					'skills' : {},
					'inventory' : {},
					'trait' : getTrait(c[28]),
					'wallet' : {
						'Harts' : c[30],
						'Chips' : c[31],
						'Doles' : c[32],
						'Vults' : c[33],
						'Maars' : c[34],
						'Buckskins' : c[35],
					},
					'statusEffect' : getStatusEffect(c[37]),
					'turnsLeft' : c[38],
					'moved'     : c[39],
					'position'  : c[40],
					'weaponRanks' : {
						'w1' : {
						'class' : c[46],
						'rank'  : (c[42] != "-" ? c[42].charAt(0) : ""),
						'exp'   : c[47]
						},
						'w2' : {
						'class' : c[48],
						'rank'  : (c[43] != "-" ? c[43].charAt(0) : ""),
						'exp'   : c[49]
						},
						'w3' : {
						'class' : c[50],
						'rank'  : (c[44] != "-" ? c[44].charAt(0) : ""),
						'exp'   : c[51]
						}
					},
					'baseHp'  : c[69],
					'baseStr' : c[70],
					'baseMag' : c[71],
					'baseSkl' : c[72],
					'baseSpd' : c[73],
					'baseLck' : c[74],
					'baseDef' : c[75],
					'baseRes' : c[76],
					'baseCon' : c[77],
					'baseMov' : c[78]
				};
				
				//Match skills
				for(var j = 17; j < 23; j++)
					currObj.skills["skl_" + (j-16)] = getSkill(c[j]);

				//Match inventory
				for(var k = 23; k < 28; k++)
					currObj.inventory["itm_" + (k-22)] = getItem(c[k]);

				characters["char_" + i] = currObj;
			}
		}
    	updateProgressBar();
		processEnemies();
    };
    
    function processEnemies(){
    	for(var i = 0; i < enemyData.length; i++){
    		var e = enemyData[i];
			if(e[0] != ""){ //if character has a name
				var currObj = {
				'name'   : e[0],
				'affiliation' : e[1],
				'spriteUrl' : e[2],
				'class'  : e[3],
				'maxHp'  : e[4],
				'currHp' : e[5],
				'Str' : e[6],
				'Mag' : e[7],
				'Skl' : e[8],
				'Spd' : e[9],
				'Lck' : e[10],
				'Def' : e[11],
				'Res' : e[12],
				'Con' : e[13],
				'Mov' : e[14],
				'gold' : e[15],
				'lvl' : e[16],
				'exp' : e[17],
				'skills' : {},
				'inventory' : {},
				'trait' : getTrait(e[29]),
				'statusEffect' : getStatusEffect(e[31]),
				'turnsLeft' : e[32],
				'position'  : e[34],
				'weaponRanks' : {
					'w1' : {
						'class' : e[40],
						'rank'  : (e[36] != "-" ? e[36].charAt(0) : ""),
						'exp'   : e[41]
					},
					'w2' : {
						'class' : e[42],
						'rank'  : (e[37] != "-" ? e[37].charAt(0) : ""),
						'exp'   : e[43]
					},
					'w3' : {
						'class' : e[44],
						'rank'  : (e[38] != "-" ? e[38].charAt(0) : ""),
						'exp'   : e[45]
					}
				},
				'baseHp'  : e[63],
				'baseStr' : e[64],
				'baseMag' : e[65],
				'baseSkl' : e[66],
				'baseSpd' : e[67],
				'baseLck' : e[68],
				'baseDef' : e[69],
				'baseRes' : e[70],
				'baseCon' : e[71],
				'baseMov' : e[72]
				};

				//Match skills
				for(var j = 18; j < 24; j++)
					currObj.skills["skl_" + (j-17)] = getSkill(e[j]);
				
				//Match inventory
				for(var k = 24; k < 29; k++)
					currObj.inventory["itm_" + (k-23)] = getItem(e[k]);

				characters["enmy_" + i] = currObj;
			}
    	}

		updateProgressBar();
		fetchMapUrl();
	};
	
	function fetchMapUrl() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "COLUMNS",
		valueRenderOption: "FORMULA",
        range: 'Management!A2:A2',
      }).then(function(response) {
		 map = response.result.values[0][0];
		 if(map != "") map = map.substring(8, map.length-2);
    	 updateProgressBar();
    	 
      });
	};
	
	//******************\\
	// CHARACTER RANGES \\
	//******************\\

	const boxWidth = 30;
	const gridWidth = 1;

	function getMapDimensions(){
    	var map = document.getElementById('mapImg');
		var height = map.naturalHeight; //calculate the height of the map
        	
		height -= (boxWidth * 2);
		height = height / (boxWidth + gridWidth);
		for(var i = 0; i < height; i++)
			rows.push(i+1);
			
		var width = map.naturalWidth; //calculate the width of the map
		width -= (boxWidth * 3);
		width = width / (boxWidth + gridWidth);
		
		for(var i = 0; i < width; i++)
			cols.push(i+1);

		initializeTerrain();
	};

	function initializeTerrain(){
		terrainLocs = {};

		for(var r = 0; r < rows.length; r++)
				for(var c = 0; c < cols.length; c++)
					terrainLocs[cols[c] + "," + rows[r]] = getDefaultTerrainObj();
			
		//Update terrain types from input list
		for(var r = 1; r < coordMapping.length; r++){
			var index = coordMapping[r][0].replace( /\s/g, ""); //remove spaces
			if(terrainLocs[index] != undefined)
				terrainLocs[index].type = coordMapping[r][1];
		}

		for(var c in characters)
			if(terrainLocs[characters[c].position] != undefined)
				terrainLocs[characters[c].position].occupiedAffiliation = c.indexOf("char_") > -1 ? "char" : characters[c].affiliation;

		calculateCharacterRanges();
	};

	function getDefaultTerrainObj(){
		return {
			'type' : "Plain",
			'movCount' : 0,
			'atkCount' : 0,
			'healCount' : 0,
			'occupiedAffiliation' : ''
		}
	};

	function calculateCharacterRanges(){
		for(var c in characters){
			var char = characters[c];
			var list = [];
			var atkList = [];
			var healList = [];
			
			if(char.position.length > 0){
				var horz = parseInt(char.position.substring(0, char.position.indexOf(",")));
				var vert = parseInt(char.position.substring(char.position.indexOf(",")+1, char.position.length));
				var range = parseInt(char.mov);

				var maxAtkRange = 0;
				var maxHealRange = 0;

				for(var i in char.inventory){
					var item = char.inventory[i];
					var r = formatItemRange(item.range);
					if(isAttackingItem(item.class) && r > maxAtkRange && r <= 5) maxAtkRange = r;
					else if(!isAttackingItem(item.class) && r > maxHealRange && r <= 5) maxHealRange = r;
				}
				if(maxAtkRange > maxHealRange) maxHealRange = 0;

				var affliliation = c.indexOf("char_") > -1 ? "char" : "enemy";

				recurseRange(0, horz, vert, range, maxAtkRange, maxHealRange, char.class.movType, affliliation, list, atkList, healList, "_");
				char.range = list;
				char.atkRange = atkList;
				char.healRange = healList;
			}else{			
				char.range = [];
				char.atkRange = [];
				char.healRange = [];
			}
		}

		//Finish load
		updateProgressBar();
	};

	function recurseRange(mode, horzPos, vertPos, range, atkRange, healRange, terrainType, affiliation, list, atkList, healList, trace){
		var coord = rows[horzPos] + cols[vertPos];
		var tile = terrainLocs[coord];

		//Mov mode calcs
		if(trace.length > 1 && mode == 0){
			var classCost = terrainIndex[tile.type][terrainType];

			//Unit cannot traverse tile if it has no cost or it is occupied by an enemy unit
            if(   classCost == undefined
               || classCost == "-"
               || (tile.occupiedAffiliation.length > 0 && tile.occupiedAffiliation != affiliation)
			){
				if(atkRange > 0){ range = atkRange; mode = 1; }
				else if(healRange > 0){ range = healRange; mode = 2; }
				else return;
			}
			else range -= parseFloat(classCost);
		}

		//Attack/heal mode calcs
		if(mode > 0){
			var classCost = terrainIndex[terrainLocs[coord].type].Fliers;
			if(classCost == undefined || classCost == "-") return;
			range -= parseFloat(classCost);
		}

		if(mode == 0 && list.indexOf(coord) == -1) list.push(coord);
		else if(mode == 1 && atkList.indexOf(coord) == -1) atkList.push(coord);
		else if(healList.indexOf(coord) == -1) healList.push(coord);
		
		trace += coord + "_";

		if(range <= 0){ //base case
			if(mode == 0 && atkRange > 0){ range = atkRange; mode = 1; }
			else if(mode != 2 && healRange > 0){ 
				if(mode == 0) range = healRange;
				else range = healRange - atkRange;
				mode = 2; 
			}
			else return;
		} 

		if(horzPos > 0 && trace.indexOf("_"+rows[horzPos-1]+cols[vertPos]+"_") == -1 &&
			(mode == 0 || (list.indexOf("_"+rows[horzPos-1] + cols[vertPos]+"_") == -1 && 
				(mode == 1 || atkList.indexOf("_"+rows[horzPos-1] + cols[vertPos]+"_") == -1))))
			recurseRange(mode, horzPos-1, vertPos, range, atkRange, healRange, terrainType, affiliation, list, atkList, healList, trace);

		if(horzPos < rows.length - 1 && trace.indexOf("_"+rows[horzPos+1] + cols[vertPos]+"_") == -1 &&
			(mode == 0 || (list.indexOf("_"+rows[horzPos+1] + cols[vertPos]+"_") == -1 && 
				(mode == 1 || atkList.indexOf("_"+rows[horzPos+1] + cols[vertPos]+"_") == -1))))
			recurseRange(mode, horzPos+1, vertPos, range, atkRange, healRange, terrainType, affiliation, list, atkList, healList, trace);

		if(vertPos > 0 && trace.indexOf("_"+rows[horzPos] + cols[vertPos-1]+"_") == -1 &&
			(mode == 0 || (list.indexOf("_"+rows[horzPos] + cols[vertPos-1]+"_") == -1 && 
				(mode == 1 || atkList.indexOf("_"+rows[horzPos] + cols[vertPos-1]+"_") == -1))))
			recurseRange(mode, horzPos, vertPos-1, range, atkRange, healRange, terrainType, affiliation, list, atkList, healList, trace);

		if(vertPos < cols.length - 1 && trace.indexOf("_"+rows[horzPos] + cols[vertPos+1]+"_") == -1 &&
			(mode == 0 || (list.indexOf("_"+rows[horzPos] + cols[vertPos+1]+"_") == -1 && 
				(mode == 1 || atkList.indexOf("_"+rows[horzPos] + cols[vertPos+1]+"_") == -1))))
			recurseRange(mode, horzPos, vertPos+1, range, atkRange, healRange, terrainType, affiliation, list, atkList, healList, trace);
	};

	function formatItemRange(range){
		if(range.indexOf("~") != -1 && range.length > 1)
			range = range.substring(range.indexOf("~")+1, range.length);
		range = range.trim();
		return range.match(/^[0-9]+$/) != null ? parseInt(range) : 0;
	};

	function isAttackingItem(wpnClass){
		return wpnClass != "Staff" && wpnClass != "Consumable";
	};
    
    //\\//\\//\\//\\//\\//
	// HELPER FUNCTIONS //
	//\\//\\//\\//\\//\\//
    
    function updateProgressBar(){
		if(progress < 100){
			progress = progress + 5.9; //13 calls
    		$rootScope.$broadcast('loading-bar-updated', progress, map);
		}
    };
    
    function processImageURL(str){
    	return str.substring(8, str.lastIndexOf(",")-1);
    };

	function getItem(name){
		var inv = findItem(name);
		return {
			'name' : name,
			'class' : inv[1],
			'rank' : inv[2],
			'uses' : inv[3],
			'might' : inv[4],
			'hit' : inv[5],
			'crit' : inv[6],
			'critMltpr' : inv[7],
			'range' : inv[8],
			'value' : inv[9],
			'desc' : (inv[10] != undefined ? inv[10] : "")
		};
	};

	function getSkill(name){
		var skl = findSkill(name);
		return {
			'name' : skl[0],
			'type' : skl[1],
			'desc' : skl[2]
		};
	};

	function getStatusEffect(name){
		var s = findStatus(name);
		return {
			'name' : s[0],
			'icon' : '',
			'desc' : s[2],
			'class' : (s[3] != undefined ? s[3] : '')
		}
	};

	function getTrait(name){
		var t = findTrait(name);
		return {
			'name' : t[0],
			'pro' : t[1],
			'con' : t[2]
		}
	};

	//\\//\\//\\//\\//\\//
	// SEARCH FUNCTIONS //
	//\\//\\//\\//\\//\\//
    
    function findSkill(name){
    	if(name == undefined || name.length == 0)
    		return ["None", "N/A", "-"];
    	
    	for(var i = 0; i < skillIndex.length; i++){
    		if(skillIndex[i][0] == name)
    			return skillIndex[i];
    	}
    	
    	return [name, "-", "This skill could not be located. Is its name spelled correctly?"];
    };
    
    function findItem(name){
    	if(name == undefined || name.length == 0)
    		return ["", "None", "-", "0", "0", "0", "0", "0", "0", "0", ""];
    	
		if(name.indexOf("(") != -1){ 
			name = name.substring(0, name.indexOf("(")); 
			name = name.trim(); 
		}

    	for(var i = 0; i < itemIndex.length; i++){
    		if(itemIndex[i][0] == name)
    			return itemIndex[i];
    	}
    	
    	return [name, "Mystery", "E", "0", "0", "0", "0", "0", "0", "0", "This item could not be located. Is its name spelled correctly?"];
    };

	function findStatus(name){
		if(name == undefined || name.length == 0 || name == "None")
			return ["None", "", "No status.", ""];
		
		var status = null;
		for(var i = 0; i < statusIndex.length; i++)
			if(statusIndex[i][0] == name)
				return statusIndex[i];

		return [name, "", "This status could not be found.", ""];
	}

	function findTrait(name){
		if(name == undefined || name.length == 0 || name == "None")
			return ["None", "No positive", "No negative"];

		for(var i = 0; i < traitIndex.length; i++)
			if(traitIndex[i][0] == name)
				return traitIndex[i];

		return [name, "This trait could not be found.", ""]
	};

}]);