app.service('DataService', ['$rootScope', function ($rootScope) {
	const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
	const updateVal = (100 / 7) + 0.1;
	const boxWidth = 15;
	const gridWidth = 1;

	var progress = 0;
	var characters = null;
	var enemies = null;
	var rows = [];
	var cols = [];
	var map, characterData, enemyData, itemIndex, skillIndex, racialSkillIndex, coordMapping, terrainIndex, terrainLocs;
	
	this.getCharacters = function(){ return characters; };
	this.getMap = function(){ return map; };
	this.getRows = function(){ return rows; };
	this.getColumns = function(){ return cols; };
	this.getTerrainTypes = function(){ return terrainIndex; };
	this.getTerrainMappings = function(){ return terrainLocs; };
	this.getRacialInfo = function(){ return racialSkillIndex; };

	this.loadMapData = function(){ fetchCharacterData(); };
	this.calculateRanges = function(){ getMapDimensions(); };
	
	//\\//\\//\\//\\//\\//
	// DATA AJAX CALLS  //
	//\\//\\//\\//\\//\\//

    function fetchCharacterData() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "COLUMNS",
        range: 'Character Tracker!B:ZZ',
      }).then(function(response) {
    	 characterData = response.result.values;
    	 updateProgressBar();
    	 fetchCharacterImages();
      });
	};
	
	function fetchCharacterImages() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Character Tracker!B2:ZZ2',
		valueRenderOption: 'FORMULA',
      }).then(function(response) {
		 var images = response.result.values[0];
		  
		 for(var i = 0; i < images.length && characterData.length; i++)
			characterData[i].splice(1,1, processImageURL(images[i]));

    	 updateProgressBar();
    	 fetchWeaponIndex();
      });
	};

	function fetchWeaponIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Item Index!B2:ZZ',
      }).then(function(response) {
		 var items = response.result.values;
		  itemIndex = {};

		  for(var i = 0; i < items.length; i++){
			var w = items[i];
			itemIndex[w[0]] = {
				'name' : w[0],
				'class' : w[1],
				'rank' : w[2],
				'type' : w[3],
				'might' : w[4],
				'hit' : w[5],
				'crit' : w[6],
				'net' : w[7],
				'range' : w[8],
				'effect' : w[9],
				'laguzEff' : w[10],
				'desc' : w[11],
				'HP' : w[12] != undefined ? w[12] : "",
				'Str' : w[13] != undefined ? w[13] : "",
				'Mag' : w[14] != undefined ? w[14] : "",
				'Skl' : w[15] != undefined ? w[15] : "",
				'OSpd' : w[16] != undefined ? w[16] : "",
				'DSpd' : w[17] != undefined ? w[17] : "",
				'Lck' : w[18] != undefined ? w[18] : "",
				'Def' : w[19] != undefined ? w[19] : "",
				'Res' : w[20] != undefined ? w[20] : "",
				'icoOverride' : w[26] != undefined ? w[26] : ""
			}
		  }

    	 updateProgressBar();
    	 fetchSkillIndex();
      });
	};
	
	function fetchSkillIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Skills!B2:G',
      }).then(function(response) {
		 var skills = response.result.values;
		 skillIndex = {};
		  
		 for(var i = 0; i < skills.length; i++){
			var s = skills[i];
			skillIndex[s[0]] = {
				'name' : s[0],
				'slot' : s[1],
				'classes' : s[2],
				'finalEff' : s[3] != undefined ? s[3] : "",
				'notes' : s[4] != undefined ? s[4] : ""
			};
		 }

    	 updateProgressBar();
    	 fetchRacialSkillIndex();
      });
	};

	function fetchRacialSkillIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Racial Abilities!A:F',
      }).then(function(response) {
		 var skills = response.result.values;
		 racialSkillIndex = {};
		 var skillBlock = "";

		for(var i = 0; i < skills.length; i++){
			var s = skills[i];
			
			if(s.length == 0) continue;

			//New header section
			if(s.length == 1){
				skillBlock = s[0];
				racialSkillIndex[skillBlock] = {};
				continue;
			}

			switch(skillBlock){
				case "Laguz" :
					if(s[0].length == 1){
						racialSkillIndex[skillBlock][s[1]] = {
							'rank' : s[0],
							'name' : s[1],
							'hpcost' : s[2],
							'might' : s[3],
							'hit' : s[4],
							'desc' : s[5]
						};
					}
					break;
				case "Jera" :
					if(s[0].length > 0){
						racialSkillIndex[skillBlock][s[0]] = {
							'name' : s[0],
							'req' : s[2],
							'desc' : s[4]
						};
					}
					break;
				case "Ayzer" :
					if(s[0].length > 0){
						racialSkillIndex[skillBlock][s[0]] = {
							'name' : s[0],
							'waterCost' : s[1],
							'desc' : s[2]
						};
					}
					break;
			}
		 }

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
					'spriteUrl' : c[1],
					'class'  : c[2],
					'race' : c[3],
					'affinity' : c[4],
					'affiliation' : c[5],
					'position' : c[6],
					'currHp' : c[7],
					'maxHp'  : c[8],
					'Str' : c[9],
					'Mag' : c[10],
					'Skl' : c[11],
					'Spd' : c[12],
					'Lck' : c[13],
					'Def' : c[14],
					'Res' : c[15],
					'Mov' : c[16],
					'exp' : c[17],
					'gold' : c[18],
					'accessories' : {},
					'equippedWeapon' : c[23],
					'inventory' : {},
					'skills' : {},
					'statusEffect' : c[36],
					'HpBuff' : c[37],
					'StrBuff' : c[38],
					'MagBuff' : c[39],
					'SklBuff' : c[40],
					'SpdBuff' : c[41],
					'LckBuff' : c[42],
					'DefBuff' : c[43],
					'ResBuff' : c[44],
					'MovBuff' : c[45],
					'HpBoost' : c[46],
					'StrBoost' : c[47],
					'MagBoost' : c[48],
					'SklBoost' : c[49],
					'SpdBoost' : c[50],
					'LckBoost' : c[51],
					'DefBoost' : c[52],
					'ResBoost' : c[53],
					'MovBoost' : c[54],
					'weaponRanks' : {
						'w1' : {
							'class' : c[55],
							'exp'   : c[56]
						},
						'w2' : {
							'class' : c[57],
							'exp'   : c[58]
						},
						'w3' : {
							'class' : c[59],
							'exp'   : c[60]
						},
						'w4' : {
							'class' : c[61],
							'exp'   : c[62]
						}
					},
					'racialInfo' : {},
					'desc' : c[79]
				};
				
				//Populate racial info
				switch(currObj.race){
					case "Jera" :
						for(var j = 63; j < 68; j++)
							currObj.racialInfo[j - 62] = getRacialAbility(c[j], currObj.race);
						break;
					case "Ayzer":
						currObj.racialInfo.waterMeter = parseInt(c[63]);
						break;
				}

				//Skills
				for(var k = 29; k < 36; k++)
					currObj.skills["skl_" + (k-28)] = getSkill(c[k]);

				//Accessories
				for(var l = 20; l < 23; l++)
					currObj.accessories["acc_" + (l-19)] = getItem(c[l]);

				//Inventory
				var inv = c.slice(24, 29); //grab inventory items
				var eqpIndex = inv.indexOf(currObj.equippedWeapon);
				if(eqpIndex > -1){
					c.splice(eqpIndex + 24, 1); //remove item
					c.splice(28, 0, ""); //insert a blank at the end
				}

				currObj.equippedWeapon = getItem(currObj.equippedWeapon);

				for(var m = 24; m < 29; m++)
					currObj.inventory["itm_" + (m-23)] = getItem(c[m]);

				characters["char_" + i] = currObj;
			}
		}
		updateProgressBar();
		map = "abc";
	};
	
	function convertToHex(str) {
		var hex = '';
		for(var i=0;i<str.length;i++) {
			hex += ''+str.charCodeAt(i).toString(16);
		}
		return hex;
	}
    
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
		/*for(var r = 1; r < coordMapping.length; r++){
			var index = coordMapping[r][0].replace( /\s/g, ""); //remove spaces
			if(terrainLocs[index] != undefined)
				terrainLocs[index].type = coordMapping[r][1];
		}

		for(var c in characters)
			if(terrainLocs[characters[c].position] != undefined)
				terrainLocs[characters[c].position].occupiedAffiliation = c.indexOf("char_") > -1 ? "char" : characters[c].affiliation;
		*/

		updateProgressBar();
		//calculateCharacterRanges();
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
			progress = progress += updateVal; //13 calls
    		$rootScope.$broadcast('loading-bar-updated', progress, map);
		}
    };
    
    function processImageURL(str){
    	return str.substring(str.indexOf("\"")+1, str.lastIndexOf("\""));
    };

	function getItem(name){
		var originalName = name;
		if(name != undefined && name.length > 0){
			if(name.indexOf("(") != - 1)
				name = name.substring(0, name.indexOf("("));
			name = name.trim();
		}

		if(name == undefined || name.length == 0 || itemIndex[name] == undefined)
			return {
				'name' : name != undefined ? name : "",
				'class' : "",
				'rank' : "",
				'type' : "",
				'might' : "",
				'hit' : "",
				'crit' : "",
				'net' : "",
				'range' : "",
				'effect' : "Couldn't locate this item.",
				'laguzEff' : "",
				'desc' : "",
				'HP' : "",
				'Str' : "",
				'Mag' : "",
				'Skl' : "",
				'OSpd' : "",
				'DSpd' : "",
				'Lck' : "",
				'Def' : "",
				'Res' : "",
				'icoOverride' : ""
		}
		
		var copy = Object.assign({}, itemIndex[name]);
		copy.name = originalName;
		return copy;
	};

	function getSkill(name){
		name = name.trim();
		if(name == undefined || name.length == 0 || skillIndex[name] == undefined)
			return {
				'name' : name != undefined ? name : "",
				'slot' : "",
				'classes' : "",
				'finalEff' : "",
				'notes' : "This skill could not be located."
			}
		else return skillIndex[name];
	};

	function getRacialAbility(name, race){
		name = name.trim();
		if(name == undefined || name.length == 0 || racialSkillIndex[race][name] == undefined)
			return {
				'name' : name != undefined ? name : ""
			}
		else return racialSkillIndex[race][name];
	};
}]);