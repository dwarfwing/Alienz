    /* number and log handling */
    const int = (score, on_error = 0) => parseInt(score) || on_error;
    const float = (score, on_error = 0) => parseFloat(score) || on_error;
    const clog = (text, title = "", color = "green", style = "font-size:12px; font-weight:normal;", headerstyle = "font-size:13px; font-weight:bold;") => {
        let titleStyle = `color:${color}; ${headerstyle} text-decoration:underline;`;
        let textStyle = `color:${color}; ${style}`;
        let output = `%c${title} %c${text}`;
        if (title) {
        console.log(output, titleStyle, textStyle);
        } else {
        output = `%c${text}`;
        console.log(output, textStyle);
        }
    };

    /* GiGs 'Super Simple Summarizer' */
    const repeatingSum = (destination, section, fields, multiplier = 1) => {
      if (!Array.isArray(fields)) fields = [fields];
      getSectionIDs(`repeating_${section}`, (idArray) => {
        const attrArray = idArray.reduce((m, id) => [...m, ...fields.map((field) => `repeating_${section}_${id}_${field}`)], []);
        getAttrs(attrArray, (v) => {
          //clog("values of v: " + JSON.stringify(v));
          // getValue: if not a number, returns 1 if it is 'on' (checkbox), otherwise returns 0..
          const getValue = (section, id, field) => float(v[`repeating_${section}_${id}_${field}`]) || (v[`repeating_${section}_${id}_${field}`] === "on" ? 1 : 0);
    
          const sumTotal = idArray.reduce((total, id) => total + fields.reduce((subtotal, field) => subtotal * getValue(section, id, field), 1), 0);
          setAttrs({
            [destination]: sumTotal * multiplier,
          });
        });
      });
    };

    // CALCULATE STRESS - HEALTH - RADIATION - VALUE FROM CHECKBOXES OR ATTRIBUTE
    const variableAttributes = ["stress","health","radiation"];
    variableAttributes.forEach(function (variableAttribute) {
        // create an array of the checkbox names. the array(12) sets how many checkboxes there are - change to match.
        const variableAttributeChecks = Array(10).fill().map((_, index) => `${variableAttribute}_${index +1}`);
        on(`change:${variableAttribute} change:${variableAttributeChecks.join(' change:')}`, function (eventinfo) {
            getAttrs(variableAttributeChecks.concat([variableAttribute, variableAttribute + "_max"]), function (values) {
                console.log("%c|*** Character Sheet Calculating Attribute Value Change ***|", "color:Black; background-color: LawnGreen");
                console.log(eventinfo.sourceAttribute + " was activated by " + eventinfo.sourceType);
                console.log("Previous Value: " + eventinfo.previousValue + " changed to a New Value of: " + eventinfo.newValue);
                console.log(JSON.stringify(eventinfo));
                console.log('checkbox names: ' + variableAttributeChecks.join(', '));
                if (eventinfo.sourceAttribute == variableAttribute) {
                    // stress or health token bar change
                    const newValue = values[variableAttribute]*1||0;
                    const setAttributeValuesAttrs = variableAttributeChecks.reduce((final,item,index) => {
                        final[item] = (index < newValue ? 1: 0);  // index will be 0 to 9, so we use < instead of <=
                        console.log(`Setting Attribute Values: ${item} = ${index < newValue ? 1: 0}`);
                        return final;
                    },{});
                    setAttrs(setAttributeValuesAttrs, {silent: true});
                } else {
                    const attributeTotal = variableAttributeChecks.reduce((total,item) => total + values[item] *1||0, 0);
                    const setAttributeFinalAttrs = {};
                    setAttributeFinalAttrs[variableAttribute] = attributeTotal;
                    console.log("Setting Attribute Values: " + attributeTotal);
                    setAttrs(setAttributeFinalAttrs, {silent: true});
                }
            });
        });
    });

    // CALCULATE Encumbrance
    on("change:repeating_gear remove:repeating_gear sheet:opened", function () {
        clog("Change Detected: Character Additional Gear Encumbrance");
        repeatingSum("encumbrance_repgear", "gear", ["wt", "num"]);
    });

    on("change:total_wt_item_one change:total_wt_item_two change:total_wt_item_three change:total_wt_item_four change:total_wt_item_five change:total_wt_item_six change:total_wt_item_seven change:total_wt_item_eight sheet:opened", () => {
        clog("Change Detected: Character Gear Encumbrance");
        const weights = ["wt_item_one", "wt_item_two", "wt_item_three", "wt_item_four", "wt_item_five", "wt_item_six", "wt_item_seven", "wt_item_eight"];
        const amounts = ["num_item_one", "num_item_two", "num_item_three", "num_item_four", "num_item_five", "num_item_six", "num_item_seven", "num_item_eight"];
        getAttrs(["encumbrance_gear", "wt_item_one", "wt_item_two", "wt_item_three", "wt_item_four", "wt_item_five", "wt_item_six", "wt_item_seven", "wt_item_eight", "num_item_one", "num_item_two", "num_item_three", "num_item_four", "num_item_five", "num_item_six", "num_item_seven", "num_item_eight"], (values) => {
            const w1 = float(values.wt_item_one),
            w2 = float(values.wt_item_two),
            w3 = float(values.wt_item_three),
            w4 = float(values.wt_item_four),
            w5 = float(values.wt_item_five),
            w6 = float(values.wt_item_six),
            w7 = float(values.wt_item_seven),
            w8 = float(values.wt_item_eight),
            n1 = float(values.num_item_one),
            n2 = float(values.num_item_two),
            n3 = float(values.num_item_three),
            n4 = float(values.num_item_four),
            n5 = float(values.num_item_five),
            n6 = float(values.num_item_six),
            n7 = float(values.num_item_seven),
            n8 = float(values.num_item_eight),
            total = float((n1*w1) + (n2*w2) + (n3*w3) + (n4*w4) + (n5*w5) + (n6*w6) + (n7*w7) + (n8*w8));
            //clog(`gear weights ${values.wt_item_one} ${values.wt_item_two} ${values.wt_item_three} ${values.wt_item_four} ${values.wt_item_five} ${values.wt_item_six} ${values.wt_item_seven} ${values.wt_item_eight}`);
            //clog(`gear amounts ${n1} ${n2} ${n3} ${n4} ${n5} ${n6} ${n7} ${n8} `);
            setAttrs({
                encumbrance_gear: total
            });
        });            
    });
    
    on("change:weapon_one_weight change:weapon_two_weight change:weapon_three_weight change:weapon_four_weight change:weapon_five_weight change:weapon_six_weight sheet:opened", () => {
        clog("Change Detected: Character Weapon Encumbrance");
        getAttrs(["encumbrance_weapons", "weapon_one_weight", "weapon_two_weight", "weapon_three_weight", "weapon_four_weight", "weapon_five_weight", "weapon_six_weight"], (values) => {
            const w1 = float(values.weapon_one_weight),
            w2 = float(values.weapon_two_weight),
            w3 = float(values.weapon_three_weight),
            w4 = float(values.weapon_four_weight),
            w5 = float(values.weapon_five_weight),
            w6 = float(values.weapon_six_weight),
            total = float(w1 + w2 + w3 + w4 + w5 + w6);
            //clog(`weapon weights ${values.weapon_one_weight} ${values.weapon_two_weight} ${values.weapon_three_weight} ${values.weapon_four_weight} ${values.weapon_five_weight} ${values.weapon_six_weight}`);
            //clog("weapon 1 weight: "+ JSON.stringify(w1));
            //clog(`weapon total weight: ${w1 + w2 + w3 + w4 + w5 + w6}`);
            setAttrs({
                encumbrance_weapons: total
            });
        });
    });

    on("change:encumbrance_repgear change:encumbrance_gear change:encumbrance_weapons change:food change:water change:strength change:packmule sheet:opened", () => {
        getAttrs(["strength", "packmule", "encumbrance_repgear", "encumbrance_gear", "encumbrance_weapons", "food", "water", "encumbrance"], (values) => {
            const repgear = float(values.encumbrance_repgear),
            gear = float(values.encumbrance_gear),
            weapons = float(values.encumbrance_weapons),
            strength = int(values.strength),
            packmule = int(values.packmule),
            food = Math.ceil(int(values.food)/4),
            water = Math.ceil(int(values.water)/4),
            consumables = food + water,
            total = repgear + gear + weapons + consumables,
            carrycap = (strength*2) + packmule;
            clog(`Food ${food}, water ${water} and encumberance ${consumables}`);
            clog(`Carry cap and pack mule: pack mule ${packmule}, strength ${strength} and carry cap ${carrycap}`);
            clog(`Test total for nonzero value: ${total != 0}`);
            clog(`Overencumbered: ${total > carrycap}`);
            clog(`overloaded: ${total > (carrycap*2)}`);
            var overencumbered = 0, overloaded = 0; 
            if ( total > carrycap ) overencumbered = 1;
            if ( total > (carrycap*2) ) overloaded = 1;
            // Only update total encumbrance if encumbrance and weights are actually used.
            if ( total != 0 ) {
                setAttrs({
                    encumbrance: total,
                    carrycap: carrycap,
                    overencumbered: overencumbered,
                    overloaded: overloaded
                });
            }
        });
    });

    // Set Armament range modifier
    const armas = ["armament1","armament2","armament3","armament4","armament5"];
    armas.forEach( (arma) => { 
        const target = arma+"_targetrange";
        const rangemod = arma+"_rangemod";
        //clog("Armament: "+arma+" Target: "+target+" Range mod: "+rangemod);
         on(`change:${target}`, (eventInfo) => {           
             getAttrs([target, rangemod], (values) => {
                 //clog("Armament changed: "+target+" value: "+values[target]+" current range mod: "+values[rangemod]);
                 var actual = 0;
                 switch(values[target]) {
                     case "Contact": actual = 2; break;
                     case "Short": actual = 1; break;
                     case "Medium": actual = 0; break;
                     case "Long": actual = -1; break;
                     case "Extreme": actual = -2; break;
                 }
                 setAttrs({[rangemod]: actual},{silent: true});
                 //clog("Armament range modification changed: "+target+", range mod "+rangemod+", range mod value: "+actual);
             })
         })
     });

     // Set Armament tab indicator
     const arma_buttons = {"armament1":"I","armament2":"II","armament3":"III","armament4":"IV","armament5":"V"};
     //clog("Arma buttons: "+ JSON.stringify(arma_buttons));
     //clog("Arma button1 : "+ JSON.stringify(arma_buttons["armament1"]));
     armas.forEach( (arma) => { 
         const armament = arma,
         name = arma+"_name",
         bonus = arma+"_bonus",
         damage = arma+"_damage",
         button = arma+"_tab";
         on(`change:${name} change:${bonus} change:${damage} sheet:opened`, (eventInfo) => {
             getAttrs([name, bonus, damage, button], (values) => {
                 //clog("armament values for button status: "+JSON.stringify(values)); 
                 var active = "-";
                 if( values[name] != "" || values[bonus] != "0" || values[damage] != "0" ) {
                     active = arma_buttons[arma];
                 }
                 //clog("active : "+active);
                 setAttrs({
                     [button]: active
                 },{silent:true});
             });
         });
     });

     // Set Internal modules tab indicator (only for second tab)
     for (let i = 16; i <= 30; i++) { 
         const module = "module"+i,
         button = "modules2_tab";
         //clog("Modules II listing: "+ module);
         on(`change:${module} sheet:opened`, (eventInfo) => {
             getAttrs([module, button], (values) => {
                 //clog("modules values for button status: "+JSON.stringify(values)); 
                 var active = "-";
                 if( values[module] != "" ) {
                     active = "II";
                 }
                 //clog("active : "+active);
                 setAttrs({
                     [button]: active
                 },{silent:true});
             });
         });
     }

	// Highlight buttons if talents / weapons are populated
	
	on("change:talent_one sheet:opened", function(){
    getAttrs(["talent_one"], function(v){
        var tal = v.talent_one;
        var txt = (tal.length > 0) ? "I" : "-";
		setAttrs({tal_one: txt});
		});
	});

	on("change:talent_two sheet:opened", function(){
    getAttrs(["talent_two"], function(v){
        var tal = v.talent_two;
        var txt = (tal.length > 0) ? "II" : "-";
		setAttrs({tal_two: txt});
		});
	});
	
	on("change:talent_three sheet:opened", function(){
    getAttrs(["talent_three"], function(v){
        var tal = v.talent_three;
        var txt = (tal.length > 0) ? "III" : "-";
		setAttrs({tal_three: txt});
		});
	});
	
	on("change:talent_four sheet:opened", function(){
    getAttrs(["talent_four"], function(v){
        var tal = v.talent_four;		
        var txt = (tal.length > 0) ? "IV" : "-";	
		setAttrs({tal_four: txt});
		});
	});

	on("change:weapon_one_name sheet:opened", function(){
    getAttrs(["weapon_one_name"], function(v){
        var wpn = v.weapon_one_name;
        var txt = (wpn.length > 0) ? "I" : "-";
		setAttrs({wpn_one: txt});
		});
	});

	on("change:weapon_two_name sheet:opened", function(){
    getAttrs(["weapon_two_name"], function(v){
        var wpn = v.weapon_two_name;
        var txt = (wpn.length > 0) ? "II" : "-";
		setAttrs({wpn_two: txt});
		});
	});

	on("change:weapon_three_name sheet:opened", function(){
    getAttrs(["weapon_three_name"], function(v){
        var wpn = v.weapon_three_name;
        var txt = (wpn.length > 0) ? "III" : "-";
		setAttrs({wpn_three: txt});
		});
	});

	on("change:weapon_four_name sheet:opened", function(){
    getAttrs(["weapon_four_name"], function(v){
        var wpn = v.weapon_four_name;
        var txt = (wpn.length > 0) ? "IV" : "-";
		setAttrs({wpn_four: txt});
		});
	});

	on("change:weapon_five_name sheet:opened", function(){
    getAttrs(["weapon_five_name"], function(v){
        var wpn = v.weapon_five_name;
        var txt = (wpn.length > 0) ? "V" : "-";
		setAttrs({wpn_five: txt});
		});
	});

	on("change:weapon_six_name sheet:opened", function(){
    getAttrs(["weapon_six_name"], function(v){
        var wpn = v.weapon_six_name;
        var txt = (wpn.length > 0) ? "VI" : "-";
		setAttrs({wpn_six: txt});
		});
	});
		
    // Action Button Tabs
    on("clicked:tab_character", function() {
        console.log("tab_character button clicked");
        setAttrs({ 
            tab_sheet: "Character"
        });
        console.log("Sheet tab Set To: Character");
    });

    on("clicked:tab_ship", function() {
        console.log("tab_ship button clicked");
        setAttrs({ 
            tab_sheet: "Ship"
        });
        console.log("Sheet tab Set To: Ship");
    });

    on("clicked:tab_one", function() {
        console.log("tab_one button clicked");
        setAttrs({ 
            tab: 1
        });
        console.log("tab Set To: 1");
    });
    
    on("clicked:tab_two", function() {
        console.log("tab_two button clicked");
        setAttrs({ 
            tab: 2
        });
        console.log("tab Set To: 2");
    });
    
    on("clicked:tab_three", function() {
        console.log("tab_three button clicked");
        setAttrs({ 
            tab: 3
        });
        console.log("tab Set To: 3");
    });
    
    on("clicked:tab_four", function() {
        console.log("tab_four button clicked");
        setAttrs({ 
            tab: 4
        });
        console.log("tab Set To: 4");
    });
    
    on("clicked:tab_alpha", function() {
        console.log("tab_alpha button clicked");
        setAttrs({ 
            tab_weapon: 1
        });
        console.log("tab_weapon Set To: 1");
    });
    
    on("clicked:tab_beta", function() {
        console.log("tab_beta button clicked");
        setAttrs({ 
            tab_weapon: 2
        });
        console.log("tab_weapon Set To: 2");
    });
    
    on("clicked:tab_gamma", function() {
        console.log("tab_gamma button clicked");
        setAttrs({ 
            tab_weapon: 3
        });
        console.log("tab_wweapon Set To: 3");
    });
    
    on("clicked:tab_delta", function() {
        console.log("tab_delta button clicked");
        setAttrs({ 
            tab_weapon: 4
        });
        console.log("tab_weapon Set To: 4");
    });
    
    on("clicked:tab_epsilon", function(eventinfo) {
        console.log("tab_epsilon button clicked");
        console.log("sourceAttribute=" + eventinfo.sourceAttribute);
        console.log("previousValue=" + eventinfo.previousValue);
        console.log("newValue =" + eventinfo.newValue );
        console.log("sourceType=" + eventinfo.sourceType);
        setAttrs({ 
            tab_weapon: 5
        })
        console.log("tab_weapon Set To: 5");
    });
    
    on("clicked:tab_zeta", function() {
        console.log("tab_zeta button clicked");
        setAttrs({ 
            tab_weapon: 6
        });
        console.log("tab_weapon Set To: 6");
    });
    
    on("clicked:tab_modules1", function() {
        console.log("tab_modules1 button clicked");
        setAttrs({ 
            tab_modules: 1
        });
        console.log("tab_modules Set To: 1");
    });
    
    on("clicked:tab_modules2", function() {
        console.log("tab_modules2 button clicked");
        setAttrs({ 
            tab_modules: 2
        });
        console.log("tab_modules Set To: 2");
    });
    
    on("clicked:tab_log1", function() {
        console.log("tab_log1 button clicked");
        setAttrs({ 
            tab_log: 1
        });
        console.log("tab_log Set To: 1");
    });
    
    on("clicked:tab_log2", function() {
        console.log("tab_log2 button clicked");
        setAttrs({ 
            tab_log: 2
        });
        console.log("tab_log Set To: 2");
    });
    
    on("clicked:tab_log3", function() {
        console.log("tab_log3 button clicked");
        setAttrs({ 
            tab_log: 3
        });
        console.log("tab_log Set To: 3");
    });
    
    on("clicked:tab_log4", function() {
        console.log("tab_log4 button clicked");
        setAttrs({ 
            tab_log: 4
        });
        console.log("tab_log Set To: 4");
    });
    
    on("clicked:tab_armament1", function() {
        console.log("tab_armament1 button clicked");
        setAttrs({ 
            tab_armament: 1
        });
        console.log("tab_armament Set To: 1");
    });
    
    on("clicked:tab_armament2", function() {
        console.log("tab_armament2 button clicked");
        setAttrs({ 
            tab_armament: 2
        });
        console.log("tab_armament Set To: 2");
    });
    
    on("clicked:tab_armament3", function() {
        console.log("tab_armament3 button clicked");
        setAttrs({ 
            tab_armament: 3
        });
        console.log("tab_armament Set To: 3");
    });
    
    on("clicked:tab_armament4", function() {
        console.log("tab_armament4 button clicked");
        setAttrs({ 
            tab_armament: 4
        });
        console.log("tab_armament Set To: 4");
    });
    
    on("clicked:tab_armament5", function() {
        console.log("tab_armament5 button clicked");
        setAttrs({ 
            tab_armament: 5
        });
        console.log("tab_armament Set To: 5");
    });