app.service('DataService', ['$rootScope', function ($rootScope) {
	const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
	const updateVal = (100 / 14) + 0.1;
	const boxWidth = 15;
	const gridWidth = 1;

	var progress = 0;
	var characters = null;
	var enemies = null;
	var rows = [];
	var cols = [];
	var map, characterData, enemyData, itemIndex, skillIndex, classIndex, statusIndex, weaponRankBonuses, racialIndex, coordMapping, terrainIndex, terrainLocs;
	
	this.getCharacters = function(){ return characters; };
	this.getMap = function(){ return map; };
	this.getRows = function(){ return rows; };
	this.getColumns = function(){ return cols; };
	this.getTerrainTypes = function(){ return terrainIndex; };
	this.getTerrainMappings = function(){ return terrainLocs; };
	this.getRacialInfo = function(){ return racialIndex; };

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
				'avo' : w[7],
				'eva' : w[8],
				'proc' : w[9],
				'ospd' : w[10],
				'dspd' : w[11],
				'range' : w[12],
				'net' : w[13],
				'effect' : w[14],
				'laguzEff' : w[15],
				'desc' : w[16],
				'HP' : w[17] != undefined ? w[17] : "",
				'Str' : w[18] != undefined ? w[18] : "",
				'Mag' : w[19] != undefined ? w[19] : "",
				'Skl' : w[20] != undefined ? w[20] : "",
				'Spd' : w[21] != undefined ? w[21] : "",
				'Lck' : w[22] != undefined ? w[22] : "",
				'Def' : w[23] != undefined ? w[23] : "",
				'Res' : w[24] != undefined ? w[24] : "",
				'icoOverride' : w[28] != undefined ? w[28] : ""
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
    	 fetchClassIndex();
      });
	};

	function fetchClassIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Class Data!B2:AR',
      }).then(function(response) {
		 var c = response.result.values;
		 classIndex = {};
		  
		 for(var i = 0; i < c.length; i++){
			var s = c[i];
			classIndex[s[0]] = {
				'name' : s[0],
				'tags' : s[3] != undefined ? s[3].split(",") : [],
				'desc' : s[42] != undefined ? s[42] : ""
			};
		 }

    	 updateProgressBar();
    	 fetchStatusIndex();
      });
	};

	function fetchStatusIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Status Effects!A2:C',
      }).then(function(response) {
		 var stat = response.result.values;
		 statusIndex = {};
		  
		 for(var i = 0; i < stat.length; i++){
			var s = stat[i];
			statusIndex[s[0]] = {
				'name' : s[0],
				'turns' : s[1],
				'effect' : s[2]
			};
		 }

    	 updateProgressBar();
    	 fetchWeaponRankBonuses();
      });
	};

	function fetchWeaponRankBonuses() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Weapon Rank Bonuses!A3:S',
      }).then(function(response) {
		 var bonuses = response.result.values;
		 weaponRankBonuses = {};
		  
		 for(var i = 0; i < bonuses.length; i++){
			var b = bonuses[i];
			weaponRankBonuses[b[0]] = {
				'class' : b[0],
				'E' : {
					'dmg' : b[1] != "-" ? parseInt(b[1]) : 0,
					'hit' : b[2] != "-" ? parseInt(b[2]) : 0,
					'crit' : b[3] != "-" && b[3].indexOf("crit") != -1 ? parseInt(b[3].match(/^[0-9]+/)) : 0,
				},
				'D' : {
					'dmg' : b[4] != "-" ? parseInt(b[4]) : 0,
					'hit' : b[5] != "-" ? parseInt(b[5]) : 0,
					'crit' : b[6] != "-" && b[6].indexOf("crit") != -1? parseInt(b[6].match(/^[0-9]+/)) : 0,
				},
				'C' : {
					'dmg' : b[7] != "-" ? parseInt(b[7]) : 0,
					'hit' : b[8] != "-" ? parseInt(b[8]) : 0,
					'crit' : b[9] != "-" && b[9].indexOf("crit") != -1 ? parseInt(b[9].match(/^[0-9]+/)) : 0,
				},
				'B' : {
					'dmg' : b[10] != "-" ? parseInt(b[10]) : 0,
					'hit' : b[11] != "-" ? parseInt(b[11]) : 0,
					'crit' : b[12] != "-" && b[12].indexOf("crit") != -1 ? parseInt(b[12].match(/^[0-9]+/)) : 0,
				},
				'A' : {
					'dmg' : b[13] != "-" ? parseInt(b[13]) : 0,
					'hit' : b[14] != "-" ? parseInt(b[14]) : 0,
					'crit' : b[15] != "-" && b[15].indexOf("crit") != -1 ? parseInt(b[15].match(/^[0-9]+/)) : 0,
				},
				'S' : {
					'dmg' : b[16] != "-" ? parseInt(b[16]) : 0,
					'hit' : b[17] != "-" ? parseInt(b[17]) : 0,
					'crit' : b[18] != "-" && b[18].indexOf("crit") != -1 ? parseInt(b[18].match(/^[0-9]+/)) : 0,
				}
			};
		 }

    	 updateProgressBar();
    	 fetchRaceIndex();
      });
	};

	function fetchRaceIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Racial Mechanics!A2:B',
      }).then(function(response) {
		 var r = response.result.values;
		 racialIndex = {};
		  
		 for(var i = 0; i < r.length; i++){
			var race = r[i];
			
			var name = race[0];
			if(name == "Ingwaz") name = "Angel";

			racialIndex[name] = {
				'name' : name,
				'desc' : name != "Beorc" ? race[1] : race[1].substring(0, race[1].indexOf("/")).trim(),
				'abilities' : {}
			};

			if(name == "Beorc"){
				racialIndex["Branded"] = {
					'name' : "Branded",
					'desc' : race[1].substring(race[1].indexOf("/") + 1, race[1].length).trim(),
					'abilities' : {}
				};
			}
		 }

    	 updateProgressBar();
		 fetchRacialSkillIndex();
      });
	};

	function fetchRacialSkillIndex() {
      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        majorDimension: "ROWS",
		range: 'Racial Abilities!A:G',
      }).then(function(response) {
		 var skills = response.result.values;
		 var skillBlock = "";
		 var laguzBlock = "";

		for(var i = 0; i < skills.length; i++){
			var s = skills[i];
			
			if(s.length == 0) continue;

			//New header section
			if(s.length == 1 
			   && !(skillBlock == "Beorc" && Object.keys(racialIndex.Beorc.abilities).length < 1)
			   && !(skillBlock == "Florkana" && Object.keys(racialIndex.Florkana.abilities).length < 2)){
				skillBlock = s[0];
				continue;
			}

			if(skillBlock == "Angel" && Object.keys(racialIndex.Angel.abilities).length == 6){ break; }

			switch(skillBlock){
				case "Beorc" :
					if(s[0].length > 0){
						racialIndex.Beorc.abilities[i] = {
							'desc' : s[0]
						};
					}
					break;
				case "Laguz" :
					if(s[0] == "-"){ laguzBlock = s[1]; racialIndex.Laguz.abilities[laguzBlock] = {}; }
					if(s[0].length == 1){
						racialIndex.Laguz.abilities[laguzBlock][s[1]] = {
							'rank' : s[0].charAt(s[0].length-1),
							'name' : s[1],
							'hpcost' : s[2],
							'might' : s[3],
							'hit' : s[4],
							'crit' : s[5],
							'desc' : s[6]
						};
					}
					break;
				case "Florkana" :
					if(s[0].length > 0){
						racialIndex.Florkana.abilities[i] = {
							'desc' : s[0]
						};
					}
					break;
				case "Ayzer" :
					if(s[0].length > 0 && s[0] != "Name"){
						racialIndex.Ayzer.abilities[s[0]] = {
							'name' : s[0],
							'waterCost' : s[1],
							'desc' : s[2]
						};
					}
					break;
				case "Kano" :
					if(s[0].length > 0 && s[0] != "Temperature"){
						racialIndex.Kano.abilities[s[0]] = {
							'temp' : s[0],
							'statChanges' : s[1],
							'hpPenalty' : s[3],
							'decrease' : s[4]
						};
					}
					break;
				case "Jera" :
					if(s[0].length > 0 && s[0] != "Enhancement Name"){
						racialIndex.Jera.abilities[s[0]] = {
							'name' : s[0],
							'req' : s[2],
							'desc' : s[4]
						};
					}
					break;
				case "Angel" :
					if(s[0].length > 0 && s[0] != "Adjacent Race"){
						racialIndex.Angel.abilities[s[0]] = {
							'supportRace' : s[0],
							'desc' : s[1],
							'thres' : s[5]
						};
					}
					break;
			}
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
			var rows = response.result.values;
			terrainIndex = {};

			for(var i = 0; i < rows.length; i++){
				var r = rows[i];
				terrainIndex[r[0]] = {
					'avo' : r[1] != "-" ? parseInt(r[1]) : 0,
					'def' : r[2] != "-" ? parseInt(r[2]) : 0,
					'heal' : r[3] != "-" ? parseInt(r[3].match(/^[0-9]+/)) : 0,
					'Foot' :  r[4],
					'Armor' : r[5],
					'Mage' : r[6],
					'Mounted' : r[7],
					'Flier' : r[8],
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
			range: 'Terrain Map!A:ZZ',
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
					'spriteUrl' : c[1],
					'class'  : getClass(c[2]),
					'race' : c[3],
					'affinity' : c[4],
					'affiliation' : c[5],
					'position' : c[6],
					'rescuing' : c[7],
					'currHp' : c[8],
					'maxHp'  : c[9],
					'Str' : c[10],
					'Mag' : c[11],
					'Skl' : c[12],
					'Spd' : c[13],
					'Lck' : c[14],
					'Def' : c[15],
					'Res' : c[16],
					'Mov' : c[17],
					'exp' : c[18],
					'gold' : c[19],
					'accessories' : {},
					'equippedWeapon' : c[24],
					'inventory' : {},
					'skills' : {},
					'HpBuff' : c[38],
					'StrBuff' : c[39],
					'MagBuff' : c[40],
					'SklBuff' : c[41],
					'SpdBuff' : c[42],
					'LckBuff' : c[43],
					'DefBuff' : c[44],
					'ResBuff' : c[45],
					'MovBuff' : c[46],
					'HpBoost' : c[47],
					'StrBoost' : c[48],
					'MagBoost' : c[49],
					'SklBoost' : c[50],
					'SpdBoost' : c[51],
					'LckBoost' : c[52],
					'DefBoost' : c[53],
					'ResBoost' : c[54],
					'MovBoost' : c[55],
					'weaponRanks' : {
						'w1' : {
							'class' : c[56],
							'exp'   : c[57],
							'rank' : calcRankLetter(c[57])
						},
						'w2' : {
							'class' : c[58],
							'exp'   : c[59],
							'rank' : calcRankLetter(c[59])
						},
						'w3' : {
							'class' : c[60],
							'exp'   : c[61],
							'rank' : calcRankLetter(c[61])
						},
						'w4' : {
							'class' : c[62],
							'exp'   : c[63],
							'rank' : calcRankLetter(c[63])
						}
					},
					'racialInfo' : [],
					'behavior' : c[82] != undefined ? c[82] : "",
					'desc' : c[83] != undefined ? c[83] : "",
					'portrait' : c[84] != undefined ? c[84] : ""
				};
				
				//Populate racial info
				switch(currObj.race){
					case "Kano":
						currObj.racialInfo.heatUnits = parseInt(c[64]);
						break;
					case "Jera" :
						for(var j = 64; j < 69; j++)
							if(c[j].length > 0 && c[j] != "Empty")
								currObj.racialInfo.push(c[j]);
						break;
					case "Ayzer":
						currObj.racialInfo.waterMeter = parseInt(c[64]);
						break;
				}

				//Skills
				for(var k = 30; k < 37; k++)
					currObj.skills["skl_" + (k-29)] = getSkill(c[k]);

				//Accessories
				for(var l = 21; l < 24; l++)
					currObj.accessories["acc_" + (l-20)] = getItem(c[l]);

				//Inventory
				var inv = c.slice(25, 30); //grab inventory items
				var eqpIndex = inv.indexOf(currObj.equippedWeapon);
				if(eqpIndex > -1){
					c.splice(eqpIndex + 25, 1); //remove item
					c.splice(29, 0, ""); //insert a blank at the end
				}

				currObj.equippedWeapon = getItem(currObj.equippedWeapon);

				for(var m = 25; m < 30; m++)
					currObj.inventory["itm_" + (m-24)] = getItem(c[m]);

				//Tags
				currObj.class.tags.push(currObj.race);
				if(currObj.race == "Angel") currObj.class.tags.push("Flying");

				currObj.class.tags = currObj.class.tags.concat(currObj.class.tags, c[20].split(","));
				currObj.class.tags.forEach(function(element, index){ 
					currObj.class.tags[index] = element.trim(); 
				});

				currObj.class.tags = Array.from(new Set(currObj.class.tags))

				//Status
				currObj.statusEffect = getStatusEffect(c[37]);

				//True stats
				currObj.TrueStr = calcTrueStat(currObj, "Str");
				currObj.TrueMag = calcTrueStat(currObj, "Mag");
				currObj.TrueSkl = calcTrueStat(currObj, "Skl");
				currObj.TrueSpd = calcTrueStat(currObj, "Spd");
				currObj.TrueLck = calcTrueStat(currObj, "Lck");
				currObj.TrueDef = calcTrueStat(currObj, "Def");
				currObj.TrueRes = calcTrueStat(currObj, "Res");
				currObj.TrueMov = calcTrueStat(currObj, "Mov");

				//Battle stats
				currObj.Atk = calcAttack(currObj);
				currObj.Hit = calcHit(currObj);
				currObj.Crit = calcCrit(currObj);
				currObj.Avo = calcAvo(currObj);
				currObj.Eva = calcEva(currObj);

				characters["char_" + i] = currObj;
			}
		}
		
		map = "IMG/map.png";
		updateProgressBar();
		//fetchMapUrl();
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
		 getMapDimensions();
      });
	};
	
	//******************\\
	// CHARACTER RANGES \\
	//******************\\

	function getMapDimensions(){
    	var map = document.getElementById('mapImg');
		var height = map.naturalHeight; //calculate the height of the map
        	
		height = height / (boxWidth + gridWidth);
		for(var i = 0; i < height; i++)
			rows.push(i+1);
			
		var width = map.naturalWidth; //calculate the width of the map
		width = width / (boxWidth + gridWidth);
		
		for(var i = 0; i < width; i++)
			cols.push(i+1);

		updateProgressBar();
		initializeTerrain();
	};

	function initializeTerrain(){
		terrainLocs = {};

		for(var r = 0; r < rows.length; r++)
				for(var c = 0; c < cols.length; c++)
					terrainLocs[cols[c] + "," + rows[r]] = getDefaultTerrainObj();
			
		//Update terrain types from input list
		for(var r = 0; r < coordMapping.length; r++){
			var row = coordMapping[r];
			for(var c = 0; c < cols.length && c < row.length; c++){
				if(row[c].length > 0) terrainLocs[cols[c] + "," + rows[r]].type = row[c];
			}
		}

		for(var c in characters)
			if(terrainLocs[characters[c].position] != undefined)
				terrainLocs[characters[c].position].occupiedAffiliation = c.indexOf("char_") > -1 ? "char" : characters[c].affiliation;

		updateProgressBar();
		//calculateCharacterRanges();
	};

	function getDefaultTerrainObj(){
		return {
			'type' : "Plains",
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
		return parseInt(range) || 0;
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

	function getClass(name){
		if(name == undefined || name.length == 0 || classIndex[name] == undefined)
			return {
				'name' : name != undefined ? name : "",
				'tags' : [],
				'desc' : ""
			}
		else return classIndex[name];
	};

	function getStatusEffect(name){
		if(name == undefined || name.length == 0 || statusIndex[name] == undefined)
			return {
				'name' : "No Status",
				'turns' : "",
				'effect' : "This unit's feeling pretty normal."
			}
		else return statusIndex[name];
	};

	//-------------------\\
	// STAT CALCULATIONS \\
	//-------------------\\

	function calcRankLetter(exp){
		exp = parseInt(exp);
		
		if(exp < 10) return "E";
		else if(exp < 30) return "D";
		else if(exp < 70) return "C";
		else if(exp < 150) return "B";
		else if(exp < 300) return "A";
		else return "S";
	};

	function getEquippedWeaponRank(char){
		var eqWpnCls = char.equippedWeapon.class;

		var wpnRank = "";
		if(eqWpnCls == "Laguz"){
			eqWpnCls = char.equippedWeapon.name.substring(0, char.equippedWeapon.name.indexOf("-")).trim();
			wpnRank = char.equippedWeapon.name.substring(char.equippedWeapon.name.indexOf("-")+1).trim();
		}else{
			if(eqWpnCls == char.weaponRanks.w1.class) wpnRank = char.weaponRanks.w1.rank;
			else if(eqWpnCls == char.weaponRanks.w2.class) wpnRank = char.weaponRanks.w2.rank;
			else if(eqWpnCls == char.weaponRanks.w3.class) wpnRank = char.weaponRanks.w3.rank;
			else if(eqWpnCls == char.weaponRanks.w4.class) wpnRank = char.weaponRanks.w4.rank;
		}

		if(wpnRank.length > 0) return weaponRankBonuses[eqWpnCls][wpnRank];
		else return {'dmg' : 0, 'hit' : 0, 'crit' : 0 };
	};

	function calcAttack(char){
		var eqWpn = char.equippedWeapon;
		
		var playerMight;
		if(eqWpn.type == "Physical") playerMight = char.TrueStr;
		else if(eqWpn.type == "Magical") playerMight = char.TrueMag;
		else playerMight = 0;

		var wpnMight = parseInt(eqWpn.might) || 0;
		var dmgBonus = getEquippedWeaponRank(char).dmg;

		return Math.floor(playerMight + wpnMight + dmgBonus);
	};

	function calcHit(char){
		var wpnHit =  parseInt(char.equippedWeapon.hit) || 0;
		var hitBonus = getEquippedWeaponRank(char).hit;

		return Math.floor((char.TrueSkl * 2.5) + (char.TrueLck * 1.5) + wpnHit + hitBonus);
	};

	function calcAvo(char){
		var wpnAvo =  parseInt(char.equippedWeapon.avo) || 0;
		return Math.floor((char.TrueSpd * 2.5) + (char.TrueLck * 1.5) + wpnAvo);
	};

	function calcCrit(char){
		var wpnCrit = parseInt(char.equippedWeapon.crit) || 0;
		var critBonus = getEquippedWeaponRank(char).crit;
		return Math.floor((char.TrueSkl * 2.5) + wpnCrit + critBonus);
	};

	function calcEva(char){
		var wpnEva =  parseInt(char.equippedWeapon.eva) || 0;
		return Math.floor((char.TrueLck * 2.5) + wpnEva);
	};

	function calcTrueStat(char, stat){
		var base = char[stat];
		var buff = char[stat + "Buff"];
		var boost = char[stat + "Boost"];
		
		if(stat == "Spd") stat = "OSpd";
		var wpn = char.equippedWeapon[stat];

		base = parseInt(base);
		buff = (buff.length > 0 ? parseInt(buff) : 0);
		boost = (boost.length > 0 ? parseInt(boost) : 0);
		wpn = (wpn != undefined ? parseInt(wpn) : 0);

		return base + buff + boost + wpn;
	};
}]);