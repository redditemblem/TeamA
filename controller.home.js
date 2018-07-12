app.controller('HomeCtrl', ['$scope', '$location', '$interval', 'DataService', 'MusicService', function ($scope, $location, $interval, DataService, MusicService) {
	$scope.rows = ["1"];
	$scope.columns = ["1"];
	const boxWidth = 15;
	const gridWidth = 1;
	var numDefeat = 0;
	$scope.showGrid = 2;
	var refreshListener;
	var supportBonuses;

	$scope.battleStatsList = [
	                ["Atk", "60px"],
	                ["Hit", "82px"],
	                ["Crit", "104px"],
	                ["Avo", "126px"],
	                ["Eva", "148px"]
	               ];
	$scope.statsList = [
	                ["Str", "Strength. Affects damage the unit deals with physical attacks.",    "100px", "70px"],
	                ["Mag", "Magic. Affects damage the unit deals with magical attacks.",        "122px", "92px"],
	                ["Skl", "Skill. Affects hit rate and the frequency of critical hits.",       "144px", "113px"],
	                ["Spd", "Speed. Affects Avo. Unit strikes twice if 5 higher than opponent.", "166px", "136px"],
	                ["Lck", "Luck. Has various effects. Lowers risk of enemy criticals.",        "188px", "158px"],
	                ["Def", "Defense. Reduces damage from physical attacks.",                    "210px", "180px"],
	                ["Res", "Resistance. Reduces damage from physical attacks.",                 "232px", "202px"],
					["Mov", "Movement. Affects how many blocks a unit can move in a turn.",      "254px", "210px"]
				   ];
	
	//Interval timers
	var dragNDrop = $interval(initializeListeners, 250, 20);
	
	//Music functions
	$scope.toggleMusic = function(){ MusicService.toggleMusic(); };
	$scope.musicPlaying = function(){ return MusicService.musicPlaying(); };
	$scope.setTrack = function(n){ MusicService.setTrack($scope.selectedTrack); };
	$scope.musicTracks = MusicService.getTrackList();
	$scope.selectedTrack = $scope.musicTracks[0];
    
    //Positioning constants
    const weaponVerticalPos = ["35px", "65px", "95px", "125px", "155px", "185px", "215px", "245px"];
	const weaponRankHorzPos = ["290px", "340px", "290px", "340px"];
	const weaponRankVertPos = ["200px", "200px", "225px", "225px"];
    const weaponDescVerticalPos = ["25px", "45px", "65px", "85px", "105px", "125px", "145px", "165px"];
    const skillVerticalPos = ["33px", "61px", "89px", "117px", "145px", "173px", "201px"];
    const skillDescVerticalPos = ["5px", "15px", "22px", "29px", "36px", "43px", "50px", "57px", "63px"];
    
    //Constants
    const STAT_DEFAULT_COLOR = "#ffffff";
    const STAT_BUFF_COLOR = "#42adf4";
	const STAT_DEBUFF_COLOR = "#960000";
	
	const NAMETAG_BLUE = "#153af3";
	const NAMETAG_RED = "#c00c13";
	const NAMETAG_GREEN = "#33bb33";
	const NAMETAG_PERIWINKLE = "#9988dd";
	const NAMETAG_DEFAULT = "#d89906";
	const NAMETAG_WHITE = "#f9f9f4";

	$scope.jeraEnhancementColors = ["red", "yellow", "blue", "magenta", "orange", "lime", "purple", "darkred", "#515100", "navy", "black", "white", "lightgray"];
    
    //Reroutes the user if they haven't logged into the app
    //Loads data from the DataService if they have
	if(DataService.getCharacters() == null)
		$location.path('/');
	else{
		$scope.charaData = DataService.getCharacters();
		$scope.mapUrl = DataService.getMap();
		$scope.rows = DataService.getRows();
		$scope.columns = DataService.getColumns();
		$scope.terrainTypes = DataService.getTerrainTypes();
		$scope.terrainLocs = DataService.getTerrainMappings();
		$scope.races = DataService.getRacialInfo();
		$scope.weaponRankBonuses = DataService.getWeaponRankBonuses();
		supportBonuses = DataService.getSupportBonuses();
		$scope.characterSupports = {}; //DataService.getCharacterSupports();
	}

	$scope.redirectToHomePage = function() {
		$location.path('/');
  	};

	$scope.refreshData = function(){
		if($scope.refreshing == true) return; //If already refreshing, don't make a second call
		$scope.refreshing = true;
		
		refreshListener = $scope.$on('loading-bar-updated', function(event, data) {
			if(data >= 100){
				refreshListener(); //cancel listener
				$scope.refreshing = false;
				$scope.charaData = DataService.getCharacters();
				$scope.mapUrl = DataService.getMap();
				$scope.rows = DataService.getRows();
				$scope.columns = DataService.getColumns();
				$scope.terrainTypes = DataService.getTerrainTypes();
				$scope.terrainLocs = DataService.getTerrainMappings();
				$scope.races = DataService.getRacialInfo();
				$scope.$apply();
			}
		});

		MapDataService.loadMapData(mapType);
	};

	$scope.launchConvoyDialog = function() { $scope.showShop = false; $scope.showConvoy = !$scope.showConvoy; };
	$scope.launchShopDialog = function(){ $scope.showConvoy = false; $scope.showShop = !$scope.showShop; };

	$scope.getObjectKeyCount = function(obj){
		return Object.keys(obj).length;
	}
    
    //*************************\\
    // FUNCTIONS FOR MAP TILE  \\
    // GLOW BOXES              \\
    //*************************\\
    
    //Returns the vertical position of a glowBox element
    $scope.determineGlowY = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
    };
    
    //Returns the horizontal position of a glowBox element
    $scope.determineGlowX = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineGlowColor = function(loc){
		if($scope.terrainLocs == undefined) return '';
		var terrainInfo = $scope.terrainLocs[loc];

		if(terrainInfo.movCount > 0) return 'rgba(0, 0, 255, 0.5)';
        else if(terrainInfo.atkCount > 0) return 'rgba(255, 0, 0, 0.5)';
        else if(terrainInfo.healCount > 0) return 'rgba(0, 255, 0, 0.5)';
		else return '';
	};

	$scope.toggleGrid = function(){
		if($scope.showGrid == 3) $scope.showGrid = 0;
		else $scope.showGrid++;	
	};
    
    //*************************\\
    // FUNCTIONS FOR MAP       \\
    // CHARACTERS/SPRITES      \\
    //*************************\\
    
    //Toggles character/enemy information box
    $scope.displayData = function(char){
    	var bool = $scope[char + "_displayBox"];
    	if(bool == undefined || bool == false){
    		positionCharBox(char);
			toggleCharRange(char, 1);
    		$scope[char + "_displayBox"] = true;
    	}else{
			toggleCharRange(char, -1);
    		$scope[char + "_displayBox"] = false;
    	}
    };

    $scope.removeData = function(char){
		toggleCharRange(char, -1);
    	$scope[char + "_displayBox"] = false;
    };
    
    $scope.checkCharToggle = function(char){
    	return $scope[char + "_displayBox"] == true;
    };

	//Add/remove character's range highlighted cells
	function toggleCharRange(char, val){
		var movRangeList = $scope.charaData[char].range;
		var atkRangeList = $scope.charaData[char].atkRange;
		var healRangeList = $scope.charaData[char].healRange;

		for(var i = 0; i < movRangeList.length; i++)
			$scope.terrainLocs[movRangeList[i]].movCount += val;
		for(var j = 0; j < atkRangeList.length; j++)
			$scope.terrainLocs[atkRangeList[j]].atkCount += val;
		for(var k = 0; k < healRangeList.length; k++)
			$scope.terrainLocs[healRangeList[k]].healCount += val;
	};
    
    $scope.isPaired = function(char){
		return locatePairedUnit($scope.charaData[char]).length > 0;
    };
    
    //Switches char info box to show the stats of the paired unit
    //Triggered when char info box "Switch to Paired Unit" button is clicked
     $scope.findPairUpChar = function(char){
    	var clickedChar = $scope.charaData[char];
    	var pairedUnit = locatePairedUnit(clickedChar);
    	
    	//Toggle visibility
    	$scope[char + "_displayBox"] = false;
    	$scope[pairedUnit + "_displayBox"] = true;

    	var currBox = document.getElementById(char + '_box');
    	var pairBox = document.getElementById(pairedUnit + '_box');
    
		pairBox.style.top = currBox.offsetTop + 'px';
		pairBox.style.left = currBox.offsetLeft + 'px';
		
		toggleCharRange(char, -1); //remove original char's data
		toggleCharRange(pairedUnit, 1); //display new char's data
    };
    
    function locatePairedUnit(char){
		if($scope.validPosition(char.position)){
			//Front unit
			for(var p in $scope.charaData)
				if($scope.charaData[p].position == char.name)
					return p;
			return "";
		}else{
			//Back unit
			for(var p in $scope.charaData)
				if($scope.charaData[p].name == char.position)
					return p;
			return "";
		}
    };
    
    //Parses an enemy's name to see if it contains a number at the end.
    //If it does, it returns that number
    $scope.getEnemyNum = function(name){
    	if(name.lastIndexOf(" ") == -1 || name == undefined)
    		return "";
    	name = name.substring(name.lastIndexOf(" "), name.length);
		name = name.trim();
		
    	if(name.match(/^[0-9]+$/) != null) return "IMG/NUM/num_" + name + ".png";
    	else return "";
    };
    
    $scope.validPosition = function(pos){
    	return pos == 'Not Deployed' || pos == 'Defeated' || pos.indexOf(",") != -1;
	};
    
    //Using a character's coordinates, calculates their horizontal
    //position on the map
    $scope.determineCharX = function(index, pos){
		if(index == 0) numDefeat = 0; 
		if(pos == "Defeated" || pos == "Not Deployed")
			return (((numDefeat % 30) * 16) + 16) + "px";

    	pos = pos.substring(0,pos.indexOf(","));
    	pos = parseInt(pos);
    	return (((pos-1) * (boxWidth + gridWidth)) + gridWidth) + "px";
    };
    
	//Using a character's coordinates, calculates their vertical
	//position on the map
	$scope.determineCharY = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed"){
			numDefeat +=1;
			return ((Math.floor((numDefeat-1)/30) * (gridWidth + boxWidth)) + ($scope.rows.length * (gridWidth + boxWidth)) + 16) +"px";
		}

		pos = pos.substring(pos.indexOf(",")+1).trim();
    	pos = parseInt(pos);
    	return ((pos-1) * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineCharZ = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed") return "0";

		pos = pos.substring(pos.indexOf(",")+1).trim(); //grab first number
		return pos;

	};

	$scope.getHPPercent = function(currHp, maxHp){
		return Math.min((currHp/maxHp)*13, 13) + "px";
	};

	$scope.determineHPBackgroundColor = function(currHp, maxHp){
		currHp = parseInt(currHp) || 0;
		maxHp = parseInt(maxHp) || 1;

		if(currHp > maxHp) return "#c430ff";
		else if((currHp/maxHp) > 0.5) return "#00e003";
		else if((currHp/maxHp) > 0.25) return "#ffe100";
		else return "red";
	};

	var friendlyRangeOn = false;
	var hostileRangeOn = false;

	$scope.toggleAffiliationRange = function(isFriendly){
		if(isFriendly) friendlyRangeOn = !friendlyRangeOn;
		else hostileRangeOn = !hostileRangeOn;

		for(var c in $scope.charaData){
			var char = $scope.charaData[c];
			var aff = $scope.determineAffiliationGrouping(char.affiliation);

			if(isFriendly == true && aff % 2 == 0)
				markAffilitationRange(isFriendly, char.range, char.atkRange, char.healRange);
			else if(isFriendly == false && aff % 2 == 1)
				markAffilitationRange(isFriendly, char.range, char.atkRange, char.healRange);
		}
	};

	function markAffilitationRange(isFriendly, range, atkRange, healRange){
		range.concat(atkRange, healRange).forEach(function(i){
			if(isFriendly == true) $scope.terrainLocs[i].friendlyRange = friendlyRangeOn;
			else $scope.terrainLocs[i].hostileRange = hostileRangeOn;
		});
	};

	$scope.affiliationTerrainIsOn = function(coord){
		var tile = $scope.terrainLocs[coord];
		return tile.friendlyRange == true || tile.hostileRange == true;
	};

	$scope.displayAffiliationBorder = function(col, row, addCol, addRow){
		var tile = $scope.terrainLocs[col+','+row];
		var adjacent = $scope.terrainLocs[(parseInt(col)+addCol)+','+(parseInt(row)+addRow)];

		if(adjacent == undefined) return tile.friendlyRange || tile.hostileRange;
		else return (tile.friendlyRange || tile.hostileRange) && !adjacent.friendlyRange && !adjacent.hostileRange;
	};

	$scope.determineAffiliationGrouping = function(aff){
		switch(aff){
			case "The Pack" : return 0;
			case "Enemies" : 
			case "Rettatese Army" : 
			case "Ruffians" :
			case "???" : return 1;
			case "Ally" :
			case "Psari" : return 2;
			case "Other" : return 3;
			case "Environment" : return 4;
			default: return -1;
		}
	};

    //***********************\\
    // POSITION CALCULATIONS \\
    //***********************\\
    
    //Relocate the information box relative to the clicked char
    function positionCharBox(char){
    	var sprite = document.getElementById(char);
    	var box = document.getElementById(char + '_box');
    	
		//var x = sprite.style.left;
		//x = parseInt(x.replace("px", ""));
		var x = ($scope.columns.length + 1) * (boxWidth + gridWidth);

    	var y = sprite.style.top;
		y = parseInt(y.replace("px", ""));

		if(y <= 20) y = 20;
    	
    	box.style.left = x + 'px';
    	box.style.top = y + 'px';
    };
    
	$scope.fetchWeaponVerticalPos = function(index){ return weaponVerticalPos[index]; };
	$scope.fetchWpnRankVertPos = function(index){ return weaponRankVertPos[index]; };
    $scope.fetchWpnRankHorzPos = function(index){ return weaponRankHorzPos[index]; };
    $scope.fetchWpnDescVerticalPos = function(index){ return weaponDescVerticalPos[index]; };
    $scope.fetchSklVerticalPos = function(index){ return skillVerticalPos[index]; };
	$scope.fetchSklDescVerticalPos = function(index){ return skillDescVerticalPos[index]; };

	$scope.textTooLong = function(textA, textB){
		return (textA.length + textB.length) > 200;
	};

	$scope.setItemDescHeight = function(type){
		if(type != "Item" && type != "Consumable" && type != "Gear" && type != "Mystery") return "70px";
    	else return "108px";
	};
 
    //***********************\\
    // FUNCTIONS FOR STAT    \\
    // PROCESSING/FORMATTING \\
    //***********************\\
	
	$scope.calculateCharLvl = function(exp){
		exp = parseInt(exp);
		return Math.floor(exp / 100);
	};

    //Returns true if the value in the passed attribute is >= 0
    $scope.checkRate = function(stat){ return parseInt(stat) >= 0; };
    
    $scope.validSkill = function(skill){
    	return skill != "" && skill != "None";
    };

	$scope.getPairName = function(pos){
		if(pos.indexOf("(") == -1) return "None";
		else return pos.substring(pos.indexOf("(")+1, pos.indexOf(")"));
	};

	$scope.getPairSupportRank = function(name, pos){
		var supportRanks = DataService.getSupportIndex();
		var partner = pos.substring(pos.indexOf("(")+1, pos.indexOf(")"));
		var rank = supportRanks[name][partner];
		if(rank != "-") return rank;
		else return "None";
	};

	$scope.buildPairSupportBonuses = function(pos){
		var data = DataService.getSupportBonuses();
		var partner = pos.substring(pos.indexOf("(")+1, pos.indexOf(")"));
		var bonuses = data[partner];
		var returnStr = "";

		for(var stat in bonuses){
			var value = parseInt(bonuses[stat]);
			if(value > 0){
				returnStr += stat + ": +" + bonuses[stat] + ", ";
			}else if(value < 0){
				returnStr += stat + ": " + bonuses[stat] + ", ";
			}	
		}	
		
		if(returnStr.length > 2)
			returnStr = returnStr.substring(0, returnStr.length-2);
		return returnStr;
	};

	$scope.getAffinityIcon = function(affinity){
		if(affinity.length == 0) return "";
		affinity = affinity.toLowerCase();
		return "IMG/AFF/" + affinity + ".png";
	};

	//*************************\\
    //     RACIAL ABILITIES	   \\
    //*************************\\
	
	$scope.calcEnchantmentCost = function(hp){
		return Math.floor(hp / 4);
	};

	$scope.heatIsHighEnough = function(minHeat, currHeat){
		if(minHeat.match(/^[0-9]+$/) == null) return false;
		else return parseInt(minHeat) <= parseInt(currHeat);
	};

	$scope.calcHpPercentCost = function(penalty, maxHp){
		var percent = penalty.match(/^[0-9]+/)[0];
		percent = parseInt(percent) / 100;
		return Math.floor(parseInt(maxHp) * percent);
	};

	$scope.calcHeatUnitTemp = function(units){
		return ((parseInt(units) / 50) * 100) + "px";
	};

	$scope.checkStatLength = function(stat){
		return stat.length > 0;
	};

	$scope.checkStatExistence = function(stat){
		return stat != undefined;
	};

	$scope.checkWpnStatLength = function(index, s){
		if(s == "Spd") s = "OSpd";
		var stat = $scope.charaData[index].equippedWeapon[s];
		
		if(stat == undefined) return false;
		var num = parseInt(stat) || 0;
		return num != 0;
	};
	
	$scope.getWpnStatValue = function(index, s){
		if(s == "Spd") s = "OSpd";
		return $scope.charaData[index].equippedWeapon[s];
	};

	$scope.getStatColor = function(index, stat){
		var char = $scope.charaData[index];
		var base = parseInt(char[stat]) || 0;
		var enhnc = parseInt(char["True"+stat]);

		if(enhnc > base) return STAT_BUFF_COLOR;
		else if(enhnc < base) return STAT_DEBUFF_COLOR;
		else return STAT_DEFAULT_COLOR;
	};

	$scope.getBattleStatColor = function(index, stat){
		var char = $scope.charaData[index];
		if(Math.floor(char["Base"+stat]) < char[stat]) return STAT_BUFF_COLOR;
		else if(Math.floor(char["Base"+stat]) > char[stat]) return STAT_DEFAULT_COLOR;
		else return STAT_DEFAULT_COLOR;
	};

	$scope.getSupportBonusDesc = function(name, rank){
		//Find char affinity
		var aff = "";
		for(var char in $scope.charaData){
			if($scope.charaData[char].name == name){
				aff = $scope.charaData[char].affinity;
				break;
			}
		}

		if(aff == "") return "";
		else return supportBonuses[aff][rank].desc;
	};

    //*************************\\
    // FUNCTIONS FOR INVENTORY \\
    // & WEAPONS PROFICIENCY   \\
    //*************************\\
    
    //Checks to see if the weapon name in the passed slot is null
    //Version for characters
    $scope.validWeapon = function(weaponName){
    	if(weaponName != "-" && weaponName != "- (-)" && weaponName != "") return true;
    	else return false;
    };
    
    //Returns the icon for the class of the weapon at the index
    //Version for characters
    $scope.getWeaponClassIcon = function(type, override){
		if(override.length > 0) return override;
    	type = type.toLowerCase();
    	return "IMG/TYPE/type_" + type + ".png";
    };
    
    //Checks if the passed "type" is listed in the effectiveness column of a character's weapon
    //(Ex. Flier, Monster, Beast, Dragon, Armor)
    $scope.weaponEffective = function(types, goal){
    	types = types.toLowerCase();
    	return types.indexOf(goal) != -1;
    };
    
    $scope.existsWeapon = function(weaponName){
    	return weaponName != "" && weaponName != "None";
    };
    
    //Returns the weapon rank icon relevant to the passed weapon type
    $scope.weaponIcon = function(wpnCls){ 
		const laguzCls = ["Fang", "Claw", "Big Claw", "Hoof", "Tusk", "Talon", "Breath", "Song"];
		if(wpnCls == undefined) return "";
		
		if(laguzCls.indexOf(wpnCls) != -1) wpnCls = "laguz";
    	var c = wpnCls.toLowerCase();
    	return "IMG/RANK/rank_" + c + ".png";
    };
    
    //Calculates the percentage of weapon proficicency for a specific weapon,
    //then returns the width of the progress bar in pixels
    $scope.calcWeaponExp = function(exp){
		exp = parseInt(exp);
		
		var toNextLvl;
		if(exp < 10) toNextLvl = 10;
		else if(exp < 30){ toNextLvl = 20; exp -= 10; } 
		else if(exp < 70){ toNextLvl = 40; exp -= 30; }
		else if(exp < 150){ toNextLvl = 80; exp -= 70; }
		else if(exp < 300){ toNextLvl = 150; exp -= 150; }
		else{ toNextLvl = 1; exp = 1; } //max at S rank

		return (exp/toNextLvl) * 32;
	};
    
    //Checks if there is a value in the index
    $scope.validDebuff = function(value){
    	return value != "" && value != "0" && value != "-";
    };
    
    $scope.hasWeaponRank = function(rank){
    	return rank != "" && rank != "-";
    };
    
    $scope.notItem = function(type){
    	return type != "Consumable" && type != "Item" && type != "Gear" && type != "Mystery";
    };
    
    $scope.setDescriptionLoc = function(type){
    	if(type != "Consumable" && type != "Item" && type != "Gear" && type != "Mystery") return "60px";
    	else return "25px";
    };

	$scope.determineNametagColor = function(aff){
		switch($scope.determineAffiliationGrouping(aff)){
			case -1: return NAMETAG_DEFAULT;
			case 0 : return NAMETAG_BLUE;
			case 1 : return NAMETAG_RED;
			case 2 : return NAMETAG_GREEN;
			case 3 : return NAMETAG_PERIWINKLE;
			case 4 : return NAMETAG_WHITE;
		}
	};

	$scope.getItemDamageIcon = function(type){
		if(type.length == 0) return "";
		else return `IMG/${type}.png`;
	};
    
    //***************************\\
    // MOUSEOVER/MOUSEOUT EVENTS \\
    //***************************\\
	
	$scope.boxHoverIn = function(char){ $scope[char+"_boxhover"] = true; };
	$scope.boxHoverOut = function(char){ $scope[char+"_boxhover"] = false; };
	$scope.boxHoverOn = function(char){ 
		if($scope[char+"_boxhover"] == true) return ($scope.rows.length + 2) + "";
		else return ($scope.rows.length + 1) + "";
	};
	
    $scope.weaponHoverIn = function(char, index){ $scope[char + "wpn_" + index] = true; };
    $scope.weaponHoverOut = function(char, index){ $scope[char + "wpn_" + index] = false; };
    $scope.weaponHoverOn = function(char, index){ return $scope[char + "wpn_" + index] == true; };
    
    $scope.skillHoverIn = function(char, index){ $scope[char + "skl_" + index] = true; };
    $scope.skillHoverOut = function(char, index){ $scope[char + "skl_" + index] = false; };
    $scope.skillHoverOn = function(char, index){ return $scope[char + "skl_" + index] == true; };
    
    $scope.statHoverIn = function(char, stat){ $scope[char + "hov_" + stat] = true; };
    $scope.statHoverOut = function(char, stat){ $scope[char + "hov_" + stat] = false; };
    $scope.statHoverOn = function(char, stat){ return $scope[char + "hov_" + stat] == true; };
    
    $scope.pairUpHoverIn = function(char){ $scope[char + "pair"] = true; };
    $scope.pairUpHoverOut = function(char){ $scope[char + "pair"] = false; };
    $scope.pairUpHoverOn = function(char){ return $scope[char + "pair"] == true; };

	$scope.supportsHoverIn = function(char){ $scope[char + "support"] = true; };
	$scope.supportsHoverOut = function(char){ $scope[char + "support"] = false; };
	$scope.supportsHoverOn = function(char){ return $scope[char + "support"] == true; };

	$scope.tagsHoverIn = function(char){ $scope[char + "tags"] = true; };
	$scope.tagsHoverOut = function(char){ $scope[char + "tags"] = false; };
	$scope.tagsHoverOn = function(char){ return $scope[char + "tags"] == true; };

	$scope.accessoryHoverIn = function(char, index){ $scope[char + "acc_" + index] = true; };
	$scope.accessoryHoverOut = function(char, index){ $scope[char + "acc_" + index] = false; };
	$scope.accessoryHoverOn = function(char, index){ return $scope[char + "acc_" + index] == true; };

	$scope.statusHoverIn = function(char){ $scope[char + "status"] = true; };
	$scope.statusHoverOut = function(char){ $scope[char + "status"] = false; };
	$scope.statusHoverOn = function(char){ return $scope[char + "status"] == true; };

	$scope.behaviorHoverIn = function(char){ $scope[char + "behv"] = true; };
	$scope.behaviorHoverOut = function(char){ $scope[char + "behv"] = false; };
	$scope.behaviorHoverOn = function(char){ return $scope[char + "behv"] == true; };

	$scope.nameHoverIn = function(char){ $scope[char + "name"] = true; };
	$scope.nameHoverOut = function(char){ $scope[char + "name"] = false; };
	$scope.nameHoverOn = function(char){ return $scope[char + "name"] == true; };
    
    //*************************\\
    // SUPPORT FOR DRAGABILITY \\
    // OF CHAR INFO BOX        \\
    //*************************\\
    var currDrag = "";
    
    function dragStart(event){
    	var style = window.getComputedStyle(event.target, null);
    	currDrag = event.target.id;
        event.dataTransfer.setData("text",(parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
    };
    
    function dragOver(event){
    	event.preventDefault();
    	return false;
    };
    
    function dragEnter(event){
    	event.preventDefault();
    };
    
    function dropDiv(event){
    	event.preventDefault();
    	var data = event.dataTransfer.getData("text").split(',');

    	var drag = document.getElementById(currDrag);
    	drag.style.left = (event.clientX + parseInt(data[0],10)) + 'px';
    	drag.style.top = (event.clientY + parseInt(data[1],10)) + 'px';
    	currDrag = "";
    };
    
    function initializeListeners(){;
    	var test = document.getElementById('char_0_box');
    	if($scope.charaData != undefined && test != null){

    		var i = 0;
    		//Set event listeners to be activated when the div is dragged
    	    for(var char in $scope.charaData){
    	    	var box = document.getElementById(char + '_box');
    	    	box.addEventListener('dragstart',dragStart,false);
    	    	i++;
    	    }
    	    
    	    //Set event listeners
    	    var drop = document.getElementById('dropArea');
    	    drop.addEventListener('dragenter',dragEnter,false);
    	    drop.addEventListener('dragover',dragOver,false);
    	    drop.addEventListener('drop',dropDiv,false);
    	    
    	    $interval.cancel(dragNDrop); //cancel $interval timer
    	}
    };
}]);

app.filter('waterCostSort', function () {
  // custom value function for sorting
  function sortFunc(obj) {
    return parseInt(obj.waterCost);
  }

  return function (obj) {
    var array = [];
    Object.keys(obj).forEach(function (key) {
      // inject key into each object so we can refer to it from the template
      obj[key].name = key;
      array.push(obj[key]);
    });
    // apply a custom sorting function
    array.sort(function (a, b) {
      return sortFunc(a) - sortFunc(b);
    });
    return array;
  };
});

function adjustMusicVolume(){
	var player = document.getElementById("audioPlayer");
	var slider = document.getElementById("musicVolumeSlider");
	player.volume = parseInt(slider.value) / 100;
};