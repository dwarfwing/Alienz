     
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
   
   // CALCULATE STRESS - HEALTH - RADIATION - VALUE FROM CHECKBOXES OR ATTRIBUTE
   const variableAttributes = ["stress","health","radiation","shipdamage"];
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

   // Set Armament range modifier
   const armas = ["armament1","armament2","armament3","armament4","armament5"];
   armas.forEach( (arma) => { 
       const target = arma+"_targetrange";
       const rangemod = arma+"_rangemod";
       clog("Armament: "+arma+" Target: "+target+" Range mod: "+rangemod);
        on(`change:${target}`, (eventInfo) => {           
            GetAttrs([target, rangemod], (values) => {
                clog("Armament changed: "+$target+" value: "+values[target]+" current range mod: "+values[rangemod]);
                var actual = 0;
                switch(values[target]) {
                    case "Contact": actual = 2;
                    case "Short": actual = 1;
                    case "Medium": actual = 0;
                    case "Long": actual = -1;
                    case "Extreme": actual = -2;
                }
                SetAttrs({rangemod: actual},{silent: true});
                clog("Armament range modification changed: "+$target+" range mod: "+actual);
            })
        })
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