
      
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

    /* Oosh async attribute functions */
    const asw = (() => {
        const setActiveCharacterId = function(charId){
            let oldAcid=getActiveCharacterId();
            let ev = new CustomEvent("message");
            ev.data={"id":"0", "type":"setActiveCharacter", "data":charId};
            self.dispatchEvent(ev);
            return oldAcid;
        };
        const promisifyWorker = (worker, parameters) => {
            let acid=getActiveCharacterId(); 
            let prevAcid=null;               
            return new Promise((res,rej)=>{
                prevAcid=setActiveCharacterId(acid);  
                try {if (worker===0) getAttrs(parameters[0]||[],(v)=>res(v));
                    else if (worker===1) setAttrs(parameters[0]||{}, parameters[1]||{},(v)=>res(v));
                    else if (worker===2) getSectionIDs(parameters[0]||'',(v)=>res(v));
                } catch(err) {rej(console.error(err))}
            }).finally(()=>setActiveCharacterId(prevAcid));
        }
        return {
            getAttrs(attrArray) {return promisifyWorker(0, [attrArray])},
            setAttrs(attrObj, options) {return promisifyWorker(1, [attrObj, options])},
            getSectionIDs(section) {return promisifyWorker(2, [section])},
            setActiveCharacterId,
        }
    })();

    // METHODS FOR PARSED ROLLS
    const rollEscape = {
        chars: { '"': '%quot;', ',': '%comma;', ':': '%colon;', '}': '%rcub;', '{': '%lcub;', },
        escape(str) {
            str = (typeof(str) === 'object') ? JSON.stringify(str) : (typeof(str) === 'string') ? str : null;
            return (str) ? `${str}`.replace(new RegExp(`[${Object.keys(this.chars)}]`, 'g'), (r) => this.chars[r]) : null;
        },
        unescape(str) {
            str = `${str}`.replace(new RegExp(`(${Object.values(this.chars).join('|')})`, 'g'), (r) => Object.entries(this.chars).find(e=>e[1]===r)[0]);
            return JSON.parse(str);
        }
    }
    
	// Helper function to grab player input
	const getQuery = async (queryText) => {
		const rxGrab = /^0\[(.*)\]\s*$/;
		let rollBase = `! {{query1=[[ 0[${queryText}] ]]}}`, // just a [[0]] roll with an inline tag
			queryRoll = await startRoll(rollBase),
			queryResponse = (queryRoll.results.query1.expression.match(rxGrab) || [])[1]; 
		finishRoll(queryRoll.rollId); // you can just let this time out if you want - we're done with it
		return queryResponse;
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

    // VERSIONING
    // If need for specific data updates with new version then include as a case comparing sheet version with version in the below Switch statement
    on("sheet:opened", () => {
        getAttrs(["sheetversion", "version", "newchar"], (values) => {
            var sheet = float(values.sheetversion),
            actual = float(values.version),
            newchar = int(values.newchar);
            clog(`Versioning; sheet version: ${sheet}, actual: ${actual}, new char: ${newchar}`);

            // Add additional check below, e.g. case newchar != 1 && actual < 2.02
            // In the case statements, call on a separate function to handle data upgrades and other necessary changes
            switch (true) {
                case newchar == 1 :
                    // A new character would always be on the sheet version, no need to bother with upgrades but need to reset the newchar attribute
                    clog(`New character identified. New char: ${newchar}, sheet version: ${sheet}, actual: ${actual}`);
                    setAttrs({
                        version: sheet,
                        newchar: 0,
                        config_notice: 1
                    });
                    break;  
                case actual < sheet :
                    // This can be use as example of upgrade handling, use specific versions in the case logic to handle version specific upgrade of attributes, e.g. actual < 2.10 :
                    // Any upgrade handling needs to be done above this one, and may set the actual variable to be same as sheet to avoid doing the below setAttrs twice.
                    clog(`New version identified. New char: ${newchar}, sheet version: ${sheet}, actual: ${actual}`);
                    // Add reference to upgrade function here, if needed, e.g. upgrade_to_2.24() 
                    setAttrs({
                        version: sheet,
                        newchar: 0,
                        config_notice: 1
                    });
                    // In case an upgrade can be followed by further upgrading, then omit the break at this stage to move down the list of cases
                    break;
            }
        });
    });


    
    // Parsed Roll, triggered from sheet. Need to add logic and attributes for pushing rolls, keeping this for future additions. 
    const rollFirst = async (ev) => {
        // We'll pretend we've done a getAttrs on the attacker's weapon for all the required values
        // Row ID's must be provided when using action buttons too, we'll skip all of that here though
        clog(`First event: ${JSON.stringify(ev)}`);
        clog(`Event name: ${ev.htmlAttributes.name}`);
        const rollName = (ev.htmlAttributes.name).slice(4); 
        clog(`Roll name: ${rollName}`);

        let modifiers = await getQuery(`?{Modifiers?|0}`);
        const attrs = await asw.getAttrs(["character_name", rollName, "stress"]);
        const base = int(attrs[rollName]),
            stress = int(attrs.stress);
        var baseStr = "", stressStr = "";
        let total = base + int(modifiers); 
        clog(`Total = ${base} + ${modifiers} = ${total}`);
        for(let i = 1; i <= total; i++) { baseStr += "[[1d6]] "; }
        for(let i = 1; i <= stress; i++) { stressStr += "[[1d6]] "; }
        
        let rollBase = `@{secret_roll} &{template:aliens} {{character-name=${attrs.character_name} }} {{roll-name=${rollName} }} {{base-dice=${baseStr} }} {{stress-dice=${stressStr} }} {{passthroughdata=[[0]]}} {{buttonlabel=Push Roll}} {{buttonlink=pushroll}}`;
        let firstRoll = await startRoll(rollBase);
        //    rollValue = firstRoll.results.roll1.result;
        clog(`First roll data: ${JSON.stringify(firstRoll)}`);
        clog(`First roll data: ${JSON.stringify(firstRoll.rolls)}`);
        // Storing all the passthrough data required for the next roll in an Object helps for larger rolls

        let rollData = {
            roller: attrs.character_name,
        }
        // Finish the roll, passing the escaped rollData object into the template as computed::passthroughdata
        // Our roll template then inserts that into [butonlabel](~selected|buttonlink||<computed::passthroughdata>)
        // ~selected allows anyone to click the button with their token selected. Omitting this will cause the button
        // to default to whichever character is active in the sandbox when the button is created
        finishRoll(firstRoll.rollId, {
            passthroughdata: rollEscape.escape(rollData),
        });
    };
    /*
    // The defend roll triggered from the button sent to chat by rollAttack()
    const rollPush = async (ev) => {
        let origRoll = rollEscape.unescape(ev.originalRollId);
        console.info(`Original roll: ${JSON.stringify(origRoll)}`);
        //let attrs = { character_name: 'Bob', weapon_name: 'Celery', attack_bonus: '-10', }
        
        const attrs = await asw.getAttrs(["character_name", "strength", "stress"]);
        let rollBase = `&{template:aliens} {{name=${attrs.character_name} push}} {{roll-name=Push}} {{base-dice=[[${attrs.strength}d6]]}} {{stress-dice=[[${attrs.stress}d6]] }} {{previousrollname=${attrs.character_name}s Attack}} {{previousroll=${ev.originalRollId}}} {{showoutcome=1}} {{message=[[0]]}} {{passthroughdata=[[0]]}} {{buttonlabel=Push Roll}} {{buttonlink=pushroll}}`;
        let pushedRoll = await startRoll(rollBase);
        // Now we can do some further computation to insert into the {{outcome}} field, primed with a [[0]] roll
        //let pushedTotal = pushedRoll.results.roll1.result;
        let resultText = `${origRoll.character-name} pushes roll!`;
        // Finish the roll, inserting our computed text string into the roll template
        finishRoll(pushedRoll.rollId, {
            message: resultText,
        });
    };
    */

    // The pushroll button still needs its event listener, just like a normal button
    on('clicked:strength clicked:agility clicked:wits clicked:empathy', async (ev) => {
        clog(`Starting first roll`);
        await rollFirst(ev);
        clog(`Completed first roll`);
    });
    /* 
    // The pushroll button still needs its event listener, just like a normal button
    on('clicked:pushroll', async (ev) => {
        clog(`Starting push roll`);
        await rollPush(ev);
        clog(`Completed push roll`);
    });
    */

    on('change:secret_roll_api sheet:opened', (ev) => {
        getAttrs(['secret_roll_api', 'roll_command'], (values) => {
            var s = values.secret_roll_api; 
            if ( s == "0" || !s ) {
                s = "!alienr";
            } else {
                s = "!alienrw"
            }
            setAttrs({
                roll_command: s
            });
        });
    });

    // CALCULATE STRESS - HEALTH - RADIATION - VALUE FROM CHECKBOXES OR ATTRIBUTE
    const variableAttributes = ["stress","health","radiation"];
    variableAttributes.forEach(function (variableAttribute) {
        // create an array of the checkbox names. the array(10) sets how many checkboxes there are - change to match.
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

    /* */
    // CALCULATE Health
    on("change:strength change:tough sheet:opened", (eventinfo) => {
        //clog("Change detected: Health");
        //clog(`Eventinfo: ${JSON.stringify(eventinfo)}`);
        getAttrs(["strength", "tough", "health_calc"], (values) => {
            const strength = int(values.strength),
            tough = int(values.tough),
            health = strength + tough;
            clog(`Health values: strength = ${strength}, tough = ${tough}, calculated health = ${health}`);
            setAttrs({
                health_calc: health
            });
        });        
    });
   

    // CALCULATE Encumbrance
    // Calculate encumbrance values for repeating gear section
    on("change:repeating_gear remove:repeating_gear sheet:opened", function () {
        clog("Change Detected: Character Additional Gear Encumbrance");
        repeatingSum("encumbrance_repgear", "gear", ["wt", "num"]);
    });

    // Calculate encumbrance values for static gear list
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
    
    // Encumbrance for weapons
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

    // Encumbrance for consumables
    on("change:food change:water sheet:opened", () => {
        getAttrs(["food", "water", "encumbrance_consum"], (values) => {
            const food = Math.ceil(int(values.food)/4),
            water = Math.ceil(int(values.water)/4),
            encumb = food + water;
            //clog(`Food ${food}, water ${water} and encumberance ${encumb}`);
            setAttrs({
                encumbrance_consum: encumb
            });
        });
    });

    // Total Encumbrance
    on("change:encumbrance change:encumbrance_repgear change:encumbrance_gear change:encumbrance_weapons change:encumbrance_consum change:strength change:packmule change:config_advencumbrance sheet:opened", () => {
        getAttrs(["strength", "packmule", "encumbrance_repgear", "encumbrance_gear", "encumbrance_weapons", "encumbrance_consum", "config_advencumbrance", "encumbrance", "encumbrance_calc"], (values) => {
            const repgear = float(values.encumbrance_repgear),
            gear = float(values.encumbrance_gear),
            weapons = float(values.encumbrance_weapons),
            strength = int(values.strength),
            packmule = int(values.packmule),
            consumables = int(values.encumbrance_consum),
            encumb_calc = repgear + gear + weapons + consumables,
            carrycap = (strength*2) + packmule,
            config = values.config_advencumbrance,
            encumb = int(values.encumbrance);
            //clog(`Carry cap and pack mule: pack mule ${packmule}, strength ${strength} and carry cap ${carrycap}`);
            //clog(`Test total ${total} for nonzero value: ${total != 0}`);
            //clog(`advanced encumbrance: ${values.config_advencumbrance}`);
            var overencumbered = 0, overloaded = 0, total = 0; 
            ( config == "on" ) ? total = encumb_calc : total = encumb; 
            ( total > carrycap ) ? overencumbered = 1 : overencumbered = 0;
            ( total > (carrycap*2) ) ? overloaded = 1 : overloaded = 0;
            //clog(`Manual encumbrance is ${encumb}, calculated encumbrance is ${encumb_calc} and total is ${total}`);
            //clog(`Overencumbered: ${total > carrycap}`);
            //clog(`overloaded: ${total > (carrycap*2)}`);
            //if ( total > carrycap ) overencumbered = 1;
            //if ( total > (carrycap*2) ) overloaded = 1;
            //if ( encumb > carrycap ) overenc_manual = 0;
            //if ( encumb > (carrycap*2) ) overenc_manual = 0;

            // Only update total encumbrance if encumbrance and weights are actually used.
            // Added configuration for chosing calculated encumbrance using new attribute encumbrance_calc
            setAttrs({
                encumbrance_calc: encumb_calc,
                carrycap: carrycap,
                overencumbered: overencumbered,
                overloaded: overloaded
            });
        });
    });

    // Set Armament range modifier
    const armas = ["armament1","armament2","armament3","armament4","armament5"];
    armas.forEach( (arma) => { 
        const target = arma+"_targetrange";
        const rangemod = arma+"_rangemod";
        //clog("Armament: "+arma+" Target: "+target+" Range mod: "+rangemod);
         on(`change:${target} sheet:opened`, (eventInfo) => {           
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
     on(`change:module16 change:module17 change:module18 change:module19 change:module20 change:module21 change:module22 change:module23 change:module24 change:module25 change:module26 change:module27 change:module28 change:module29 change:module30 sheet:opened`, (eventInfo) => {
        getAttrs(["module16", "module17", "module18", "module19", "module20", "module21", "module22", "module23", "module24", "module25", "module26", "module27", "module28", "module29", "module30"], (values) => {
            //clog("modules values for button status: "+JSON.stringify(values)); 
            const button = "modules2_tab";
            var active = "-";
    
            for (let i = 16; i <= 30; i++) {
                if( values[`module${i}`] != "" ) {
                    active = "II";
                }
                //clog("value: "+ JSON.stringify(values[`module${i}`]) +", active: "+ active);
            }  

            //clog("active eor : "+active);
            setAttrs({
                [button]: active
            },{silent:true});
        });
    });

    // Set Ship logs 2nd tab indicator
    on(`change:log16 change:log17 change:log18 change:log19 change:log20 change:log21 change:log22 change:log23 change:log24 change:log25 change:log26 change:log27 change:log28 change:log29 change:log30 sheet:opened`, (eventInfo) => {
       getAttrs(["log16", "log17", "log18", "log19", "log20", "log21", "log22", "log23", "log24", "log25", "log26", "log27", "log28", "log29", "log30"], (values) => {
           //clog("log values for button status: "+JSON.stringify(values)); 
           const button = "logs2_tab";
           var active = "-";
   
           for (let i = 16; i <= 30; i++) {
               if( values[`log${i}`] != "" ) {
                   active = "II";
               }
               //clog("value: "+ JSON.stringify(values[`log${i}`]) +", active: "+ active);
           }  

           //clog("active eor : "+active);
           setAttrs({
               [button]: active
           },{silent:true});
       });
   });


   // Set Ship logs 3rd tab indicator
   on(`change:log31 change:log32 change:log33 change:log34 change:log35 change:log36 change:log37 change:log38 change:log39 change:log40 change:log41 change:log42 change:log43 change:log44 change:log45 sheet:opened`, (eventInfo) => {
      getAttrs(["log31", "log32", "log33", "log34", "log35", "log36", "log37", "log38", "log39", "log40", "log41", "log42", "log43", "log44", "log45"], (values) => {
          //clog("log values for button status: "+JSON.stringify(values)); 
          const button = "logs3_tab";
          var active = "-";
  
          for (let i = 31; i <= 45; i++) {
              if( values[`log${i}`] != "" ) {
                  active = "III";
              }
              //clog("value: "+ JSON.stringify(values[`log${i}`]) +", active: "+ active);
          }  

          //clog("active eor : "+active);
          setAttrs({
              [button]: active
          },{silent:true});
      });
  });

	// Highlight buttons if talents / weapons are populated
    talents = {"one": "I", "two": "II", "three": "III", "four": "IV", "five": "V", "six": "VI", "seven": "VII", "eight": "VIII"};
    _.each(Object.keys(talents), (tal) => {
        on(`change:talent_${tal} sheet:opened`, function() {
            //clog(`Current talent: ${tal}, current value: ${talents[tal]}`);
            getAttrs([`talent_${tal}`], function(v){
                var talentname = v[`talent_${tal}`];
                //clog("Talent output: "+ (talentname.length > 0) ? talents[`${tal}`] : "-");
                var txt = (talentname.length > 0) ? talents[`${tal}`] : "-";
                setAttrs({[`tal_${tal}`]: txt});
                });
            });
    });
	/*
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
    */

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

    on("clicked:tab_config", function() {
        console.log("tab_config button clicked");
        setAttrs({ 
            tab_sheet: "Config",
            config_notice: ""
        });
        console.log("Sheet tab Set To: Config");
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
    
    on("clicked:tab_five", function() {
        console.log("tab_five button clicked");
        setAttrs({ 
            tab: 5
        });
        console.log("tab Set To: 5");
    });
    
    on("clicked:tab_six", function() {
        console.log("tab_six button clicked");
        setAttrs({ 
            tab: 6
        });
        console.log("tab Set To: 6");
    });
    
    on("clicked:tab_seven", function() {
        console.log("tab_seven button clicked");
        setAttrs({ 
            tab: 7
        });
        console.log("tab Set To: 7");
    });
    
    on("clicked:tab_eight", function() {
        console.log("tab_eight button clicked");
        setAttrs({ 
            tab: 8
        });
        console.log("tab Set To: 8");
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