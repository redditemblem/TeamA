app.service('DataService', ['$rootScope', function ($rootScope) {
	const sheetId = '1cMNIbAI401ZGosao0iSkAxn2H0HxypMAoQEepHW2hGw';
	const updateVal = (100 / 18) + 0.1;
	const boxWidth = 15;
	const gridWidth = 1;

	var progress = 0;
	var characters = null;
	var enemies = null;
	var rows = [];
	var cols = [];
	var map, characterData, enemyData, itemIndex, skillIndex, classIndex, statusIndex, weaponRankBonuses, supportBonuses, characterSupports, racialIndex, coordMapping, effectsMapping, terrainIndex, terrainLocs;
	
	this.getCharacters = function(){ return characters; };
	this.getMap = function(){ return map; };
	this.getRows = function(){ return rows; };
	this.getColumns = function(){ return cols; };
	this.getTerrainTypes = function(){ return terrainIndex; };
	this.getTerrainMappings = function(){ return terrainLocs; };
	this.getRacialInfo = function(){ return racialIndex; };
	this.getWeaponRankBonuses = function(){ return weaponRankBonuses; }
	this.getSupportBonuses = function(){ return supportBonuses; }
	this.getCharacterSupports = function(){ return characterSupports; }

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
				'type' : w[3] != "-" ? w[3] : "",
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
				'icoOverride' : w[28] != undefined ? w[28] : "",
				'equipped' : false
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
		range: 'Class Data!B2:AW',
      }).then(function(response) {
		 var c = response.result.values;
		 classIndex = {};
		  
		 for(var i = 0; i < c.length; i++){
			var s = c[i];
			if(s.length >= 39){
				classIndex[s[0]] = {
					'name' : s[0],
					'tags' : s[2].length > 0 ? s[2].split(",") : [],
					'desc' : s[42] != undefined ? s[42] : "",
					'terrainType' : s[47] != undefined ? s[47] : ""
				};
			}
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
    	 fetchSupportBonuses();
      });
	};

	function fetchSupportBonuses() {
		gapi.client.sheets.spreadsheets.values.get({
		  spreadsheetId: sheetId,
		  majorDimension: "ROWS",
		  range: 'Supports!A2:B',
		}).then(function(response) {
		   var support = response.result.values;
		   supportBonuses = {};
			
		   for(var i = 0; i < support.length; i++){
			  var s = support[i];
			  
			  if(s.length == 0 || s[0].length == 0) continue;
			  if(s[0] == "Boosts") break;

			  var aff = s[0].substring(0, s[0].lastIndexOf(" ")).trim();
			  var rank = s[0].substring(s[0].lastIndexOf(" ")).trim();

			  if(supportBonuses[aff] == undefined) supportBonuses[aff] = {};
			  supportBonuses[aff][rank] = {
				'affinity' : aff,
				'rank' : rank,
				'desc' : s[1] != undefined ? s[1] : ""
			  }
		   }
  
		   updateProgressBar();
		   fetchCharSupportRanks();
		});
	  };

	function fetchCharSupportRanks() {
		gapi.client.sheets.spreadsheets.values.get({
		  spreadsheetId: "1LSRqgJ5vPZ3FDQyKtuyPmBM99izYOw7tsjYnBS6hTAg",
		  majorDimension: "ROWS",
		  range: 'Support Ranks!A1:ZZ',
		}).then(function(response) {
		   var support = response.result.values;
		   characterSupports = {};
		
		   var header = support.shift();
		   for(var i = 0; i < support.length; i++){
			  var s = support[i];
			  
			  if(s.length == 0 || s[0].length == 0) continue;
			  characterSupports[s[0]] = {};

			  for(var j = 1; j < s.length; j++){
				if(header[j] == s[0] || s[j] == undefined || s[j] == "") continue; //skip same character
				characterSupports[s[0]][header[j]] = {
					'name' : header[j],
					'rank' : s[j]
				}
			  }
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
				skillBlock = (s[0] == "Beorc (or Branded)" ? "Beorc" : s[0]);
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
			range: 'Terrain Chart!A2:Q',
		}).then(function(response) {
			var rows = response.result.values;
			terrainIndex = {};

			for(var i = 0; i < rows.length; i++){
				var r = rows[i];
				terrainIndex[r[0]] = {
					'avo' : parseInt(r[1]) | 0,
					'def' : parseInt(r[2]) | 0,
					'heal' : r[3].match(/^(-)[0-9]+/) != null ? parseInt(r[3].match(/^(-)[0-9]+/)[0]) : 0,
					'Infantry' :  r[4],
					'Armor' : r[5],
					'Mage' : r[6],
					'Thief' : r[7],
					'Pirate' : r[8],
					'Mounted' : r[9],
					'Flier' : r[10],
					'effect' : r[11],
					'florkanaBonus' : r[12],
					'florkanaStack' : r[13],
					'florkanaUproot' : r[14],
					'isStructure' : r[16] == "Man-made Structure",
					'isForest' : r[16] == "Forest",
					'isMountain' : r[16] == "Mountain",
					'isLava' : r[16] == "Lava",
					'isAquatic' : r[16] == "Aquatic"
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
			fetchEffectsChart();
		});
	};

	function fetchEffectsChart(){
	    gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			majorDimension: "ROWS",
			range: 'Effects Map!A:ZZ',
	    }).then(function(response) {
			effectsMapping = response.result.values;
			if(effectsMapping == undefined) effectsMapping = [];

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
					'hasMoved' : c[7],
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

				//Laguz functions
				if(currObj.race == "Laguz"){
					switch(currObj.class.name){
						case "Canine" :
						case "Chief" :  currObj.laguzType = "Fang"; break;
						case "Small Cat" : 
						case "Big Cat" : currObj.laguzType = "Claw"; break;
						case "Equine" : currObj.laguzType = "Hoof"; break;
						case "Avian" : currObj.laguzType = "Talon"; break;
						case "Elephant" : currObj.laguzType = "Tusk"; break;
						case "Dragon" : currObj.laguzType = "Breath"; break;
						case "Heron" : 
						case "Great Heron" : currObj.laguzType = "Song"; break;
					}

					if(currObj.name == "Miranda")
						currObj.laguzType = "Fang";
				}

				//Populate racial info
				switch(currObj.race){
					case "Laguz" :
						if(currObj.laguzType == "Song"){ 
							for(var j = 64; j < 81; j++)
								if(c[j].length > 0)
									currObj.racialInfo.push(c[j]);
						}
						break;
					case "Kano":
						currObj.racialInfo.heatUnits = parseInt(c[64]);
						break;
					case "Jera" :
						for(var j = 64; j < 69; j++)
							if(c[j].length > 0 && c[j] != "Empty")
								currObj.racialInfo.push(c[j]);
						break;
					case "Florkana" :
						for(var j = 64; j < 67; j++)
							if(c[j].length > 0)
								currObj.racialInfo.push(c[j]);
						break;
					case "Ayzer":
						currObj.racialInfo.waterMeter = parseInt(c[64]);
						break;
					case "Angel" :
						currObj.racialInfo = {
							"Beorc/Branded": c[64],
							"Laguz" : c[65],
							"Florkana" : c[66],
							"Kano" : c[67],
							"Ayzer" : c[68],
							"Jera" : c[69]
						}
						break;
				}

				//Skills
				for(var k = 30; k < 37; k++)
					currObj.skills["skl_" + (k-29)] = getSkill(c[k]);

				//Accessories
				for(var l = 21; l < 24; l++)
					currObj.accessories["acc_" + (l-20)] = getItem(c[l]);

				//Inventory
				currObj.equippedWeapon = getItem(currObj.equippedWeapon);

				for(var m = 25; m < 30; m++)
					currObj.inventory["itm_" + (m-24)] = getItem(c[m]);

				//Replace equipped item with ghost
				var inv = c.slice(25, 30); //grab inventory items
				var eqpIndex = inv.indexOf(currObj.equippedWeapon.name);
				if(currObj.equippedWeapon.name.length > 0 && eqpIndex > -1){
					var key = "itm_" + (eqpIndex+1);
					currObj.inventory[key] = getDefaultWeaponObj(currObj.equippedWeapon.name);
					currObj.inventory[key].class = currObj.equippedWeapon.class;
					currObj.inventory[key].icoOverride = currObj.equippedWeapon.icoOverride;
					currObj.inventory[key].equipped = true;
				}

				//Tags
				currObj.class.tags.push(currObj.race);
				if(currObj.race == "Angel") currObj.class.tags.push("Flying");

				if(c[20].length > 0)
					currObj.class.tags = currObj.class.tags.concat(currObj.class.tags, c[20].split(","));

				currObj.class.tags.forEach(function(element, index){ currObj.class.tags[index] = element.trim(); });
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

				//Subtract buffs/boosts from stat values
				currObj.Str = revertStat(currObj, "Str");
				currObj.Mag = revertStat(currObj, "Mag");
				currObj.Skl = revertStat(currObj, "Skl");
				currObj.Spd = revertStat(currObj, "Spd");
				currObj.Lck = revertStat(currObj, "Lck");
				currObj.Def = revertStat(currObj, "Def");
				currObj.Res = revertStat(currObj, "Res");
				currObj.Mov = revertStat(currObj, "Mov");

				//Battle stats
				currObj.Atk = calcAttack(currObj);
				currObj.Hit = calcHit(currObj);
				currObj.Crit = calcCrit(currObj);
				currObj.Avo = calcAvo(currObj);
				currObj.Eva = calcEva(currObj);

				characters["char_" + i] = currObj;
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
        range: 'Map Management!A2:A2',
      }).then(function(response) {
		 map = response.result.values[0][0];
		 
		 updateProgressBar();
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
			rows.push((i+1)+"");
			
		var width = map.naturalWidth; //calculate the width of the map
		width = width / (boxWidth + gridWidth);
		
		for(var i = 0; i < width; i++)
			cols.push((i+1)+"");

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

		//Update terrain types from input list
		for(var r = 0; r < effectsMapping.length; r++){
			var row = effectsMapping[r];
			for(var c = 0; c < cols.length && c < row.length; c++){
				if(row[c].length > 0){
					var coord = cols[c] + "," + rows[r];
					switch(row[c]){
						case "I" : 
						case "II" : 
						case "III" :
						case "IV" : 
						case "VII" :
						case "VIII" :
						case "IX" : 
						case "X" : 
						case "XIII" : setEnhancementTiles(c, r, null, null); terrainLocs[coord].enhancement = row[c]; break;
						case "V" : setEnhancementTiles(c, r, "bonusHealVal", -20); terrainLocs[coord].enhancement = row[c]; break;
						case "VI" : setEnhancementTiles(c, r, "bonusHealVal", 20); terrainLocs[coord].enhancement = row[c]; break;
						case "XI" : setEnhancementTiles(c, r, "noMovCost", true); terrainLocs[coord].enhancement = row[c]; break;
						case "XII" : setEnhancementTiles(c, r, "bonusMovCost", true); terrainLocs[coord].enhancement = row[c]; break;
						case "Fire" : terrainLocs[coord].onFire = true; terrainLocs[coord].bonusHealVal = -20; break;
					}
				}
			}
		}

		for(var c in characters)
			if(terrainLocs[characters[c].position] != undefined)
				terrainLocs[characters[c].position].occupiedAffiliation = characters[c].affiliation;

		updateProgressBar();
		calculateCharacterRanges();
	};

	function setEnhancementTiles(c, r, key, val){
		terrainLocs[cols[c]+","+rows[r]][key] = val;
		terrainLocs[cols[c]+","+rows[r]].isEnhanced = true;
		
		if(terrainLocs[cols[c]+","+rows[r-1]] != undefined){
			terrainLocs[cols[c]+","+rows[r-1]][key] = val;
			terrainLocs[cols[c]+","+rows[r-1]].isEnhanced = true;
		}
		if(terrainLocs[cols[c]+","+rows[r+1]] != undefined){
			terrainLocs[cols[c]+","+rows[r+1]][key] = val;
			terrainLocs[cols[c]+","+rows[r+1]].isEnhanced = true;
		}

		if(terrainLocs[cols[c-1]+","+rows[r]] != undefined){
			terrainLocs[cols[c-1]+","+rows[r]][key] = val;
			terrainLocs[cols[c-1]+","+rows[r]].isEnhanced = true;
		}
		if(terrainLocs[cols[c+1]+","+rows[r]] != undefined){
			terrainLocs[cols[c+1]+","+rows[r]][key] = val;
			terrainLocs[cols[c+1]+","+rows[r]].isEnhanced = true;
		}

		if(terrainLocs[cols[c-1]+","+rows[r-1]] != undefined){
			terrainLocs[cols[c-1]+","+rows[r-1]][key] = val;
			terrainLocs[cols[c-1]+","+rows[r-1]].isEnhanced = true;
		}
		if(terrainLocs[cols[c-1]+","+rows[r+1]] != undefined){
			terrainLocs[cols[c-1]+","+rows[r+1]][key] = val;
			terrainLocs[cols[c-1]+","+rows[r+1]].isEnhanced = true;
		}

		if(terrainLocs[cols[c+1]+","+rows[r-1]] != undefined){
			terrainLocs[cols[c+1]+","+rows[r-1]][key] = val;
			terrainLocs[cols[c+1]+","+rows[r-1]].isEnhanced = true;
		}
		if(terrainLocs[cols[c+1]+","+rows[r+1]] != undefined){
			terrainLocs[cols[c+1]+","+rows[r+1]][key] = val;
			terrainLocs[cols[c+1]+","+rows[r+1]].isEnhanced = true;
		}
	};

	function getDefaultTerrainObj(){
		return {
			'type' : "Plains",
			'movCount' : 0,
			'atkCount' : 0,
			'healCount' : 0,
			'occupiedAffiliation' : '',
			'enhancement' : "",
			'isEnhanced' : false,
			'noMovCost' : false,
			'bonusMovCost' : false,
			'onFire' : false,
			'bonusHealVal' : 0
		}
	};

    function calculateCharacterRanges() {
		for(var c in characters){
			var char = characters[c];
			var list = [];
			var atkList = [];
			var healList = [];
		
			var pos = char.position;
			if (pos.length > 0 && pos.indexOf(",") != -1 && pos != "Not Deployed" && pos != "Defeated") {
				var horz = cols.indexOf(pos.substring(0,pos.indexOf(",")));
				var vert = rows.indexOf(pos.substring(pos.indexOf(",")+1));
				var range = parseInt(char.Mov);

				var maxAtkRange = 0;
				var maxHealRange = 0;
				for (var i in char.inventory) {
					var item = char.inventory[i];
					var r = formatItemRange(item.range);
					if (isAttackingItem(item.class) && r > maxAtkRange && r <= 10) maxAtkRange = r;
					else if (!isAttackingItem(item.class) && r > maxHealRange && r <= 10) maxHealRange = r;
				}

				var eR = formatItemRange(char.equippedWeapon.range);
				if (isAttackingItem(char.equippedWeapon.class) && eR > maxAtkRange && r <= 10) maxAtkRange = eR;
				else if (!isAttackingItem(char.equippedWeapon.class) && eR > maxHealRange && r <= 10) maxHealRange = eR;

				for(var s in char.skills){
					var skl = char.skills[s];
					switch(skl.name){
						case "Radiance" : if(maxHealRange > 0) maxHealRange += 1; break;
					}
				}

				var params = {
					'atkRange' : maxAtkRange,
					'healRange' : maxHealRange,
					'race' : char.race,
					'terrainClass' : char.race == "Angel" ? "Flier" : char.class.terrainType,
					'affiliation' : char.affiliation
				};

				recurseRange(horz, vert, range, params, list, "_");
				
				list.forEach(function(e){
					horz = cols.indexOf(e.substring(0,e.indexOf(",")));
					vert = rows.indexOf(e.substring(e.indexOf(",")+1));

					recurseItemRange(horz, vert, params.atkRange, list, atkList, "_");
					recurseItemRange(horz, vert, params.healRange, list, healList, "_");
				});

				char.range = list;
				char.atkRange = atkList;
				char.healRange = healList;
			} else {
				char.range = [];
				char.atkRange = [];
				char.healRange = [];
			}
		}

		//Final progress update
		updateProgressBar();
	};

    function recurseRange(horzPos, vertPos, range, params, list, trace){
		//Don't calculate cost for starting tile
		var coord = cols[horzPos]+","+rows[vertPos];
		var tile = terrainLocs[coord];

		//Mov mode calcs
		if(trace.length > 1){
			var classCost = terrainIndex[tile.type][params.terrainClass];
			if(classCost == undefined) return;

			classCost = parseFloat(classCost) || 99;

			//Racial movement params
			switch(params.race){
				case "Beorc" : if(terrainIndex[tile.type].isStructure  && classCost < 99) classCost = 1; break;
				case "Laguz" : if(classCost > 1 && classCost < 99) classCost = (classCost / 2); break;
				case "Florkana" : if(terrainIndex[tile.type].isForest  && classCost < 99) classCost = 1; break;
				case "Kano" : if(terrainIndex[tile.type].isLava && classCost < 99) classCost = 1; 
							  if(terrainIndex[tile.type].isMountain) classCost = 3; 
							  break;
				case "Ayzer" : if(terrainIndex[tile.type].isAquatic && classCost < 99) classCost = 1; break;
				case "Jera" : if(terrainIndex[tile.type].isEnhanced && classCost < 99) classCost = (classCost / 2); break;
			}
			
			if(classCost < 99){
				if(tile.noMovCost) classCost = 0;
				else if(tile.bonusMovCost && params.race == "Jera") classCost = 2;
				else if(tile.bonusMovCost) classCost = 4;
			}

            //Determine traversal cost
			if(  classCost == 99
			 || (tile.occupiedAffiliation.length > 0 && tile.occupiedAffiliation != params.affiliation)
			 || (classCost > range)
			){
				return;
			}
			else range -= classCost;
		}

		if(list.indexOf(coord) == -1) list.push(coord);
		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+","+rows[vertPos]+"_") == -1)
			recurseRange(horzPos-1, vertPos, range, params, list, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+","+rows[vertPos]+"_") == -1)
			recurseRange(horzPos+1, vertPos, range, params, list, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+","+rows[vertPos-1]+"_") == -1)
			recurseRange(horzPos, vertPos-1, range, params, list, trace);

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+","+rows[vertPos+1]+"_") == -1)
			recurseRange(horzPos, vertPos+1, range, params, list, trace);
    };
    
    function recurseItemRange(horzPos, vertPos, range, list, itemList, trace){
		if(trace.length > 1){
			var coord = cols[horzPos]+","+rows[vertPos];
			var tile = terrainLocs[coord];

			var classCost = terrainIndex[terrainLocs[coord].type].Flier;
			if(classCost == undefined || classCost == "-") return;
			else range -= 1;

			if(itemList.indexOf(coord) == -1) itemList.push(coord);
		}

		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+","+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos-1]+","+rows[vertPos]) == -1)
			recurseItemRange(horzPos-1, vertPos, range, list, itemList, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+","+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos+1]+","+rows[vertPos]) == -1)
			recurseItemRange(horzPos+1, vertPos, range, list, itemList, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+rows[vertPos-1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos-1]) == -1)
			recurseItemRange(horzPos, vertPos-1, range, list, itemList, trace)

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+rows[vertPos+1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos+1]) == -1)
			recurseItemRange(horzPos, vertPos+1, range, list, itemList, trace)
	}

    function formatItemRange(range) {
        if (range.indexOf("-") != -1 && range.length > 1)
            range = range.substring(range.indexOf("-") + 1, range.length);
        range = range.trim();
        return parseInt(range) | 0;
    };

    function isAttackingItem(wpnClass) {
		return wpnClass != "Staff" && wpnClass != "Gear" && wpnClass != "Consumable" && wpnClass != "Item";
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
			return getDefaultWeaponObj(name);
		
		var copy = Object.assign({}, itemIndex[name]);
		copy.name = originalName;
		return copy;
	};

	function getDefaultWeaponObj(name){
		return {
			'name' : name != undefined ? name : "",
			'class' : "Mystery",
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
			'icoOverride' : "",
			'equipped' : false
		}
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
				'desc' : "",
				'terrainType' : ""
			}
		else return JSON.parse(JSON.stringify(classIndex[name]));
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
		const laguzCls = ["Fang", "Claw", "Hoof", "Tusk", "Talon", "Breath", "Song"];
		var origWpnCls = char.equippedWeapon.class;
		var wpnRank = "";

		var eqWpnCls = "";
		if(laguzCls.indexOf(origWpnCls) != -1) eqWpnCls = "Laguz";
		else eqWpnCls = origWpnCls;

		if(eqWpnCls == char.weaponRanks.w1.class) wpnRank = char.weaponRanks.w1.rank;
		else if(eqWpnCls == char.weaponRanks.w2.class) wpnRank = char.weaponRanks.w2.rank;
		else if(eqWpnCls == char.weaponRanks.w3.class) wpnRank = char.weaponRanks.w3.rank;
		else if(eqWpnCls == char.weaponRanks.w4.class) wpnRank = char.weaponRanks.w4.rank;

		if(wpnRank.length > 0) return weaponRankBonuses[origWpnCls][wpnRank];
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
		var base = parseInt(char[stat]) || 0;
		
		if(stat == "Spd") stat = "OSpd";
		var wpn = char.equippedWeapon[stat];
		wpn = (wpn != undefined ? parseInt(wpn) : 0);

		return base + wpn;
	};

	function revertStat(char, stat){
		var base = char[stat];
		var buff = char[stat + "Buff"];
		var boost = char[stat + "Boost"];

		base = parseInt(base);
		buff = (buff.length > 0 ? parseInt(buff) : 0);
		boost = (boost.length > 0 ? parseInt(boost) : 0);

		return base - buff - boost;
	};
}]);