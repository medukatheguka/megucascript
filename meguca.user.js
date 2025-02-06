// ==UserScript==
// @name        megucascript
// @namespace   megucasoft
// @description Does a lot of stuff
// @require     player.js
// @require     secret.js
// @require     deleted.js
// @include     https://meguca.org/*
// @include     https://megu.ca/*
// @include	https://kirara.cafe/*
// @include     https://shamik.ooo/*
// @include     https://shamiko.org/*
// @include     https://sachik.ooo/*
// @include     https://chiru.no/*
// @homepage    https://github.com/tragsg/megukascript
// @connect     meguca.org
// @connect	kirara.cafe
// @connect     megu.ca
// @connect     shamik.ooo
// @connect     shamiko.org
// @connect     sachik.ooo
// @connect     chiru.no
// @version     3.4.8
// @author      medukasthegucas
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_addValueChangeListener
// @grant       GM_openInTab
// @grant       GM_xmlhttpRequest
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// @grant       GM.openInTab
// @grant       GM.xmlHttpRequest
// ==/UserScript==

const defaultFiletypes = ".jpg .png .gif";
var chuuCount = 0;

// Things the user can turn on or off, add your new feature to this list
// For more complicated options, add them to the hackLatsOptions and getCurrentOptions functions
const onOffOptions = [["pyuOption", "Pyu Coloring~"],
                      ["decideOption", "Decision Coloring"],
                      ["dumbPosters", "Dumb xposters"],
                      ["dumbblanc", "dumb blancposters, not cute"],
                      ["sharesOption", "Shares Formatting"],
                      ["screamingPosters", "Vibrate screaming posts"],
                      ["sekritPosting", "Secret Posting"],
                      ["imgsekritPosting", "Image Secret Posting<br><br>(Check off the following option if you have drag and drop problems)"],
                      ["enablemegucaplayer","Enable music player"],
                      ["megucaplayerOption", "Show music player<br>"],
                      ["annoyingFormatting", "Annoying formatting button"],
                      ["mathOption", "Enables math parsing"],
                      ["chuuOption", "Enables receivement of chuu~s"],
                      ["cancelposters", "Dumb cancelposters"],
                      ["hideBinned", "Show deleted posts"],
                      ["showWhoDeletedPosts", "Show who deleted/banned posts"],
                      ["filterPosts", "Filter posts"],
                      ["preSubmitOption", "Enables pre-submit post processing (necessary for some functions)"]];

const themes = Array(document.getElementById("theme").options.length).fill().map((val, idx) => document.getElementById("theme").options[idx].value);
//const nowPlayingOptions = Array(document.getElementById("nowPlaying").options.length).fill().map((val, idx) => document.getElementById("nowPlaying").options[idx].value);

//the regular nonscript options, listed here so we can save values in incognito, if //on isn't there, assume it's off by default, () encases the default option
/*const nonScriptOptions = ["imageHover", //general options //on
						  "webmHover",
						  "audioVolume", //(0)-100 value
						  "notification", //on
						  "anonymise",
						  "hideRecursively",
						  "postInlineExpand", //on
						  "relativeTime",
						  "alwaysLock",
						  "inlineFit", //style options //none, (width), screen
						  "hideThumbs",
						  "workModeToggle",
						  "autogif",
						  "spoilers", //on (talking about image spoilers)
						  "replyRight",
						  "horizontalPosting",
						  "theme", //all of themes, (glass), default can be changed by board owner however
						  "userBG",
						  "userBGImage", //no idea how to set this
						  "mascot",
						  "mascotImage", //again, no idea
						  "customCSSToggle",
						  "customCSS",
						  "google", //image search options //on
						  "iqdb",
                          "yandex",
                          "tracemoe",
						  "saucenao", //on
						  "desuarchive",
						  "exhentai",
						  "nowPlaying", //fun options //all now playing options //(none)
						  "bgVideo", //background video (none)
						  "bgMute", //background mute (none)
						  "meguTV",
						  "newPost", //shortcut options (all alt+) //N
						  "done", //S
						  "toggleSpoiler", //(image spoiler) //I
						  "expandAll", //E
						  "workMode", //B
						  "galleryMode", //G
						  "meguTVShortcut"];//T*/
const nonScriptOptions = Array.from(document.getElementsByClassName("tab-cont")[1].getElementsByTagName('label'), lab => lab.getAttribute('for'));
// Keybinds (will be updated to allow modifications)
// note that you can add more keybinds
//TODO: add functionality for any keybind, allowing alt or fn keys (not happening any time soon)
var keybinds = [["spoilerShortcut", "Ctrl+S", "**"],
				["boldShortcut", "Ctrl+B", "@@"],
				["italicsShortcut", "Ctrl+I", "~~"],
				["programmingShortcut", "Ctrl+P", "``"],
				["redtextShortcut", "Ctrl+R","^r"],
				["bluetextShortcut", "Alt+B","^b"]];
// The current settings (will be loaded before other methods are called)
var currentlyEnabledOptions = new Set();
// Add custom options here if needed
var flashingDuration = 60;
var vibrationDuration = 20;
var setFunc, getFunc;
var customFilterText = "#Custom filters (lines starting with # are ignored)\n\
#text: is assumed by default if you don't specify otherwise\n\
#text:^[Aa]+$\n\
#name:[^(^Anonymous$)]\n\
#id:Fautatkal\n\
#flag:Sweden\n\
#filename:image\\.png\n";
var customFilters = [];
const filterTypes = new Map([["text", ".post-container"],
                             ["name", ".name.spaced > span:nth-child(1)"],
                             ["id", ".name.spaced > span:nth-child(2)"],
                             ["flag", ".flag"],
                             ["filename", "figcaption > a:not(.image-toggle)"]]);

function hackLatsOptions() {
	//TODO: replace localstorage with tampermonkey storage so this saves your settings
	//TODO: add functionality for saving non-megukascript settings as well to tampermonkey storage
    var options = document.getElementById("options");
    var tab_butts = options.getElementsByClassName("tab-butts")[0];
    var tab_cont = options.getElementsByClassName("tab-cont")[0];
	//add shortcut boxes
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<br><input name=\"spoilerShortcut\" id=\"spoilerShortcut\" title=\"Shortcut for spoilers\" style=\"width:150px\" class=\"shortcut\"><label for=\"spoilerShortcut\" title=\"Shortcut for spoilers\">Spoiler tags</label><br>");
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<input name=\"boldShortcut\" id=\"boldShortcut\" title=\"Shortcut for bold\" style=\"width:150px\" class=\"shortcut\"><label for=\"boldShortcut\" title=\"Shortcut for bold\">Bold tags</label><br>");
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<input name=\"italicsShortcut\" id=\"italicsShortcut\" title=\"Shortcut for italics\" style=\"width:150px\" class=\"shortcut\"><label for=\"italicsShortcut\" title=\"Shortcut for italics\">Italic tags</label><br>");
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<input name=\"programmingShortcut\" id=\"programmingShortcut\" title=\"Shortcut for code tags\" style=\"width:150px\" class=\"shortcut\"><label for=\"programmingShortcut\" title=\"Shortcut for code tags\">Programming tags</label><br>");
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<input name=\"redtextShortcut\" id=\"redtextShortcut\" title=\"Shortcut for red text\" style=\"width:150px\" class=\"shortcut\"><label for=\"redtextShortcut\" title=\"Shortcut for red text\">Red text tags</label><br>");
	tab_cont.getElementsByTagName("div")[4].insertAdjacentHTML('beforeend',"<input name=\"bluetextShortcut\" id=\"bluetextShortcut\" title=\"Shortcut for blue text\" style=\"width:150px\" class=\"shortcut\"><label for=\"bluetextShortcut\" title=\"Shortcut for code tags\">Blue text tags</label><br>");

    // add checkboxes for each option
    var new_butt /*lewd*/ = "<a class=\"tab-link\" data-id=\"5\">Meguca Userscript</a>";
    var new_cont = "<div data-id=\"5\">";
    for (var i = 0; i < onOffOptions.length; i++) {
        var id = onOffOptions[i][0];
        var name = onOffOptions[i][1];
        new_cont += "<input type=\"checkbox\" name=" + id + " id=" + id + "> <label for=" + id + ">" + name + "</label><br>";
    }

    // flashing duration
    new_cont += "<input type=\"textbox\" name=flashing id=flashing> <label for=flashing>Flashing Duration</label><br>";

    // vibration duration
    new_cont += "<input type=\"textbox\" name=vibration id=vibration> <label for=vibration>Vibration Duration</label><br>";

    // image stealing
    new_cont += "<span>Steal all files ending with </span><input type=\"textbox\" name=steal_filetypes id=steal_filetypes><button type=\"button\" id=\"stealButton\">Steal files</button><br>";

    // custom filters
    new_cont += "<textarea rows=4 cols=60 id=customFilters style='font-size: 10pt;'></textarea><br>";
    new_cont += "<button type=\"button\" id=\"saveFilters\">Save filter changes</button><br>";

    // Chuu counter
    new_cont += "<br>You have received <span id=\"chuu-counter\">" + chuuCount + "</span> chuu~'s";

    // Linking to github
    new_cont += "<br><a href=\"https://github.com/dasdgdafg/megukascript/blob/master/README.md\" target=\"_blank\">How do I use this?</a>";
	
	
    var new_sekrit_cont = "<div data-id=\"6\">";
    // hidetext encode
    new_sekrit_cont += "<input type=\"textbox\" name=hidetext id=hidetext> <label for=hidetext>Encode Text</label> <button type=\"button\" id=\"secretButton\">Convert & input</button><br>";
    // image for secret message
    new_sekrit_cont += "<input name=\"secret_image\" id=\"secret_image\" type=\"file\">";
    // Another link to github
    new_sekrit_cont += "<br><a href=\"https://github.com/dasdgdafg/megukascript/blob/master/README.md\" target=\"_blank\">How do I use this?</a>";
    // Secret Encoding tab
    var new_sekrit_butt = "<a class=\"tab-link\" data-id=\"6\">Secret Encoding</a>";
    new_cont += "</div>";
    new_sekrit_cont += "</div>";
	
    tab_butts.innerHTML += new_butt + new_sekrit_butt;
    tab_cont.innerHTML += new_cont + new_sekrit_cont;
	
	//activate shortcut buttons (must come after the tab_cont.innerHTML line otherwise it won't set)
	for(i=0;i<keybinds.length;i++){
		var userSet = getFunc(keybinds[i][0],keybinds[i][1]);
		document.getElementById(keybinds[i][0]).value=userSet;
		keybinds[i][1]=userSet;
	}

    for (i = 0; i < onOffOptions.length; i++) {
        id = onOffOptions[i][0];
        // set the correct intial state
        document.getElementById(id).checked = currentlyEnabledOptions.has(id);

        // set all the handler functions
        document.getElementById(id).onchange = function() {
			setFunc(this.id, this.checked ? "on" : "off");
        };
    }
    document.getElementById("megucaplayerOption").onclick = mgcPl_optionClicked;

    // flashing duration
    document.getElementById("flashing").value = flashingDuration;
    document.getElementById("flashing").onchange = function(){
        setFunc(this.id, (this.value > 60) ? 60 : this.value); //needn't test if the value is "infinite"
    };

    // vibration duration
    document.getElementById("vibration").value = vibrationDuration;
    document.getElementById("vibration").onchange = function(){
        setFunc(this.id, (this.value > 60) ? 60 : this.value);
    };
	
	document.querySelector("#hidetext").addEventListener("keyup", function(event) {
        if(event.key !== "Enter") return; // Use `.key` instead.
        document.querySelector("#secretButton").click(); // Things you want to do.
        event.preventDefault(); // No need to `return false;`.
    });

    document.getElementById("steal_filetypes").value = defaultFiletypes;
    document.getElementById("stealButton").onclick = function() {
        downloadAll();
    };

	document.getElementById("secretButton").onclick = secretButtonPressed;
    document.getElementById("hidetext").addEventListener('paste', function(e){
        var files = e.clipboardData.files;
        // check if a file was pasted
        if (files.length == 1) {
            var secretImage = document.getElementById("secret_image");
             if (secretImage != undefined) {
                secretImage.files = files;
                secretImage.javascriptIsFuckingDumb = files[0]; // secretImage.files seems to get cleared automatically
                e.stopPropagation();
            }
        }
    });
	
    document.getElementById("customFilters").value = customFilterText;
    document.getElementById("saveFilters").onclick = function() {
        customFilterText = document.getElementById("customFilters").value;
        setFunc("customFilterText", document.getElementById("customFilters").value);
    };
	for(i=0; i<nonScriptOptions.length; i++){
		id=nonScriptOptions[i];
        console.log(nonScriptOptions.length);
        if(i!=22){
            document.getElementById(id).value = getFunc(id, document.getElementById(id).value);
            console.log(" iter: "+i+"id: "+id+" value: "+document.getElementById(id).value+"\n");
            document.getElementById(id).onchange = function(){
                setFunc(this.id, this.value);
            }
        }
	}
	
}

function insertCuteIntoCSS() {
    var css = document.createElement("style");
    css.type = "text/css";
    // calculate lengths
    css.innerHTML = ".sekrit_text { color: #FFDC91; }" +
        ".lewd_color { animation: lewd_blinker 0.7s linear " + getIterations(0.7) + "; color: pink; } @keyframes lewd_blinker { 50% { color: #FFD6E1 } }" +
        ".decision_roll { animation: decision_blinker 0.4s linear 2; color: lightgreen; } @keyframes decision_blinker { 50% { color: green } }" +
        ".planeptune_wins { animation: planeptune_blinker 0.6s linear " + getIterations(0.6) + "; color: mediumpurple; } @keyframes planeptune_blinker { 50% { color: #fff} }"+
        ".lastation_wins { animation: lastation_blinker 0.6s linear " + getIterations(0.6) + "; color: #000; } @keyframes lastation_blinker { 50% { color: #fff} }"+
        ".lowee_wins { animation: lowee_blinker 0.6s linear " + getIterations(0.6) + "; color: #e6e6ff; } @keyframes lowee_blinker { 50% { color: #c59681 }}"+
        ".leanbox_wins { animation: leanbox_blinker 0.6s linear " + getIterations(0.6) + "; color: #4dff4d; } @keyframes leanbox_blinker { 50% { color: #fff} }"+
        ".thousand_pyu { animation: pyu_blinker 0.4s linear " + getIterations(0.4) + "; color: aqua; } @keyframes pyu_blinker { 50% { color: white } }"+
        ".filtered :not(.filter-stub) { display: none }" +
        ".shaking_post { animation: screaming 0.5s linear 0s " + getVibrationIterations() + "; } @keyframes screaming { 0% { -webkit-transform: translate(2px, 1px) rotate(0deg); } 10% { -webkit-transform: translate(-1px, -2px) rotate(-1deg); } 20% { -webkit-transform: translate(-3px, 0px) rotate(1deg); } 30% { -webkit-transform: translate(0px, 2px) rotate(0deg); } 40% { -webkit-transform: translate(1px, -1px) rotate(1deg); } 50% { -webkit-transform: translate(-1px, 2px) rotate(-1deg); } 60% { -webkit-transform: translate(-3px, 1px) rotate(0deg); } 70% { -webkit-transform: translate(2px, 1px) rotate(-1deg); } 80% { -webkit-transform: translate(-1px, -1px) rotate(1deg); } 90% { -webkit-transform: translate(2px, 2px) rotate(0deg); } 100% { -webkit-transform: translate(1px, -2px) rotate(-1deg); } }";
    document.head.appendChild(css);
}

function getIterations(period) {
    if (flashingDuration == "infinite") {
        return "infinite";
    }
    return flashingDuration / period;
}

function getVibrationIterations() {
    if (vibrationDuration == "infinite") {
        return "infinite";
    }
    return vibrationDuration * 2;
}

function getCurrentOptions() {
    for (var i = 0; i < onOffOptions.length; i++) {
        var id = onOffOptions[i][0];
        var setting = getFunc(id);
        if (setting != "off") {
            currentlyEnabledOptions.add(id);
        }
    }
    flashingDuration = parseFloat(getFunc("flashing"));
    if (isNaN(flashingDuration)) {
        // assume inifinity if it's not a number
        flashingDuration = "infinite";
    }

    vibrationDuration = parseFloat(getFunc("vibration"));
    if (isNaN(vibrationDuration)) {
        // assume inifinity if it's not a number
        vibrationDuration = "infinite";
    }

    chuuCount = parseInt(getFunc("chuuCount"));
    if (isNaN(chuuCount)) chuuCount = 0;

    var filters = getFunc("customFilterText");
    if (filters != undefined) {
        customFilterText = filters;
        setupFilters();
    }
}

function setupFilters() {
    var filters = customFilterText.split("\n");
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i];
        if (filter.startsWith("#")) {
            // ignore comments
            continue;
        }
        if (filter == "") {
            // ignore empty lines
            continue;
        }
        // check what kind of filter this is, default to checking post text
        var type = "text";
        for (var potentialType of filterTypes.keys()) {
            if (filter.startsWith(potentialType + ":")) {
                type = potentialType;
                filter = filter.substring(potentialType.length + 1);
                break;
            }
        }
        var reg;
        try {
            reg = new RegExp(filter);
        } catch(e) {
            // anon is a baka
            console.log(e);
            continue;
        }
        customFilters.push([type, reg]);
    }
}

// For most new features, you'll want to put a call to your function in this function
// This will be called multiple times per post, so handlers should be idempotent
function handlePost(post) {
    if (currentlyEnabledOptions.has("sekritPosting")) {
        var secret = findMultipleShitFromAString(post.innerHTML, /<code class=\"code-tag\"><\/code><del>([^#<>\[\]]*)<\/del><code class=\"code-tag\"><\/code>/g);
        for (let j = secret.length - 1; j >= 0; j--) {
            parseSecretPost(post, secret[j]);
        }
        var secretQuote = findMultipleShitFromAString(post.innerHTML, /[ >]󠁂&gt;󠁂&gt;([\d]+)(?:[ <]+)/g);
        for (let j = secretQuote.length - 1; j >= 0; j--) {
            parseSecretQuote(post, secretQuote[j]);
        }
    }
    if (currentlyEnabledOptions.has("sharesOption")) {
        var shares = findMultipleShitFromAString(post.innerHTML, /\[([^\]\[]*)\] <strong( class=\"\w+\")?>#(\d+)d(\d+) \(([\d +]* )*= (?:\d+)\)<\/strong>/g);
        for (let j = shares.length - 1; j >= Math.max(0,shares.length-4); j--) {
            parseShares(post, shares[j]);
        }
    }
    if (currentlyEnabledOptions.has("pyuOption")) {
        var pyu = findMultipleShitFromAString(post.innerHTML, /<strong>#pyu \(([\d+]*)\)<\/strong>/g);
        for (let j = pyu.length - 1; j >= 0; j--) {
            parsePyu(post, pyu[j]);
        }
    }
	//TODO: expand this, allow other functions, do it in a neater way (useless, low priority)
    if (currentlyEnabledOptions.has("mathOption")) {
        var math = findMultipleShitFromAString(post.innerHTML, /#math\(((?:[\d-+/*%().^ ]*(?:log)*)*)\)/g);
        for (let j = math.length - 1; j >= 0; j--) {
            parseMath(post, math[j]);
        }
    }
    if (currentlyEnabledOptions.has("chuuOption")) {
        var chuu = findMultipleShitFromAString(post.innerHTML, /#chuu\( ?(\d*) ?\)/g);
        for (let j = chuu.length - 1; j >= 0; j--) {
            parseChuu(post, chuu[j]);
        }
    }
	var RGB = findMultipleShitFromAString(post.innerHTML, /\^\[ ?(\d+)[ ,](\d+)[ ,](\d+) ?\]\{(.*?)\}/g);
	for (let j = RGB.length - 1; j >= 0; j--) {
        parseCustomColorRGB(post, RGB[j]);
    }
	var HEX = findMultipleShitFromAString(post.innerHTML, /\^\[ ?#? ?(\w+) ?\]\{(.*?)\}/g);
	for (let j = HEX.length - 1; j >= 0; j--) {
        parseCustomColorHEX(post, HEX[j]);
    }
	/*
	//strategically placed after everything else so it doesn't fuck up everything.....in theory....
	var RGB_TO_END = findMultipleShitFromAString(post.innerHTML, /\^\[ ?(\d+)[ ,](\d+)[ ,](\d+) ?\](.*?)(?:$|\^\[ ?#? ?\d+.?\d*.\d* ?\]|<font color)/g);
	console.log(RGB_TO_END);
	//this for loop should only iterate once
	for (var j = RGB_TO_END.length - 1; j >= 0; j--) {
        parseCustomColorRGB(post, RGB_TO_END[j]);
    }
	var HEX_TO_END = findMultipleShitFromAString(post.innerHTML, /\^\[ ?#? ?(\d+) ?\](.*?)(?:$|\^\[ ?#? ?\d+.?\d*.\d* ?\]|<font color)/g);
	for (var j = HEX_TO_END.length - 1; j >= 0; j--) {
        parseCustomColorHEX(post, HEX_TO_END[j]);
    }
	*/ //doesn't work lmao
    if (currentlyEnabledOptions.has("decideOption")) {
        var decide;
        decide = findMultipleShitFromAString(post.innerHTML, /\[([^#\]\[]*)\]\s<strong( class=\"\w+\")?>#d([0-9]+) \(([0-9]+)\)<\/strong>/g);
        for (let j = decide.length - 1; j >= 0; j--) {
            parseDecide(post, decide[j], false);
        }

        decide = findMultipleShitFromAString(post.innerHTML, /(?:<blockquote>|<br>)([^><]*)(\s|<br>)<strong( class=\"\w+\")?>#d([0-9]+) \(([0-9]+)\)<\/strong>/g);
        for (let j = decide.length - 1; j >= 0; j--) {
            parseDecide(post, decide[j], true);
        }
    }
    if (currentlyEnabledOptions.has("dumbPosters")) {
        checkForDumbPost(post);
    }
    if (currentlyEnabledOptions.has("screamingPosters")) {
        checkForScreamingPost(post);
    }
    if (currentlyEnabledOptions.has("showDeletedPosts")) {
        showDeletedPost(post);
    }
    if (currentlyEnabledOptions.has("showWhoDeletedPosts")) {
        checkForDeletedOrBannedPost(post);
    }
    if (currentlyEnabledOptions.has("filterPosts")) {
        filterPost(post);
    }
}

function readPostsForData() {
    var posts = document.getElementsByClassName('post-container');
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        handlePost(post);
    }
}

function parseCustomColorRGB(post, customColor){
	var before = post.innerHTML.substring(0,customColor.index);
	var after = post.innerHTML.substring(customColor.index+customColor[0].length);
	/*
	var justBeforeAfter="";
	for(var j=customColor.length-1;j>4;j--){
		justBeforeAfter+=customColor[j]; //annoying, but it's to handle non braced custom colors
	}
	after=justBeforeAfter+after;
	*/ //used when trying the ^[RGB] without brackets
	//turns our RGB numbers to the color tag css likes
	//does some epic bitwise shift operator black hat magic
	var colorTag = "#"+((1 << 24)+(Number(customColor[1]) << 16)+(Number(customColor[2]) << 8)+Number(customColor[3])).toString(16).slice(1);
	post.innerHTML = before + "<font color=\""+colorTag+"\">"+customColor[4]+"</font>"+after;
}
function parseCustomColorHEX(post, customColor){
	var before = post.innerHTML.substring(0,customColor.index);
	var after = post.innerHTML.substring(customColor.index+customColor[0].length);
	/*
	var justBeforeAfter="";
	for(var j=customColor.length-1;j>2;j--){
		justBeforeAfter+=customColor[j];
	}
	after=justBeforeAfter+after;
	*/
	var colorTag = "#"+customColor[1];
	post.innerHTML = before + "<font color=\""+colorTag+"\">"+customColor[2]+"</font>"+after;
}

function parsePyu(post, pyu) {
    var n = pyu[1];
    if (n % 1000 == 0) {
		var before = post.innerHTML.substring(0, pyu.index);
		var after = post.innerHTML.substring(pyu.index + pyu[0].length);
        var pyuHTML = "<strong class=\"thousand_pyu\"> 💦 " + pyu[0].substring(8) + " 💦 ";
        post.innerHTML = before + pyuHTML + after;
    }
}

function parseMath(post, math) {
    var expr = math[1];
    expr = parseMath_addPow(expr).replace(/log/g, 'Math.log');
    var result;
    try {
        result = eval(expr);
    } catch (err) {
        result = '???';
    }
    if (isNaN(result)) result = '???';

    var before = post.innerHTML.substring(0, math.index);
    var after = post.innerHTML.substring(math.index + math[0].length);
    var mathHTML = "<strong>" + math[0].substring(0, 5) + " " + math[0].substring(5, math[0].length - 1) + " = " + result + ")</strong>";
    post.innerHTML = before + mathHTML + after;
}

function parseMath_addPow(str) {
    for (let i = str.length-1; i >= 0; i--) {
        if (str[i] !== "^") continue;
        let parentheses = 0;
        const operators = /[-+*/%^]/;

        // looking ahead
        let j;
        for (j = i+1; j < str.length; j++) {
            if (str[j] === "(") parentheses++;
            else if (str[j] === ")" && parentheses > 0) parentheses--;
            else if (operators.test(str[j]) && parentheses === 0) break;
        }
        // j is just after the term

        // looking back
        let k;
        parentheses = 0; // so it doesn't break even more stuff;
        for (k = i-1; k >= 0; k--) {
            if (str[k] === ")") parentheses++;
            else if (str[k] === "(" && parentheses > 0) parentheses--;
            else if (operators.test(str[k]) && parentheses === 0) break;
        }
        // k is just before the term
        k++; // k is on the beginning of the term

        str = str.substring(0, k) + "Math.pow(" + str.substring(k,i) + "," +
              str.substring(i+1, j) + ")" + str.substring(j);
        i += 9; // Due to the addition of "pow(" before i
    }

    return str;
}

function parseChuu(post, chuu) {
    var postNum = chuu[1];
    var kissedPost = document.getElementById("p" + postNum);

    if (kissedPost === null || kissedPost === undefined) return;

    var nametag = kissedPost.querySelector("header").getElementsByTagName("B")[0];

    var before = post.innerHTML.substring(0, chuu.index);
    var after = post.innerHTML.substring(chuu.index + chuu[0].length);
    var chuuHTML = "<strong";

    // Has an (You) => You've been kissed!
    if (nametag.getElementsByTagName("I").length > 0) {
        var ownName = post.parentNode.querySelector("header").getElementsByTagName("B")[0];
        // Don't chuu yourself
        if (ownName.getElementsByTagName("I").length > 0) return;

        chuuHTML += " class=\"lewd_color\"";
        chuuCount = getFunc("chuuCount", chuuCount);
        chuuCount++;
        setFunc("chuuCount", chuuCount);
        document.getElementById("chuu-counter").innerHTML = chuuCount;

        var message = "chuu~";
        if (chuuCount % 10 === 0) {
            message += "\nCongratulations on your pregnancy!\nYou now have " +
                chuuCount / 10 +
                " children!";
        }

        alert(message);
    }

    chuuHTML += ">#chuu~(" + chuu[1] + ")</strong>";
    post.innerHTML = before + chuuHTML + after;
}

function parseDecide(post, decide, isSmart) {
    var offset = (isSmart) ? 1 : 0;

    var options = decide[1].split(",");
    var n = decide[3 + offset];
    var m = decide[4 + offset];

    var before = post.innerHTML.substring(0, decide.index);
    var after = post.innerHTML.substring(decide.index + decide[0].length);

    if (options.length != n || n == 1) return;
    options[m-1] = "<strong class=\"decision_roll\">" + options[m-1] + "</strong>";
    var newInner = options.toString();
    var retreivedRoll;
    if (decide[2 + offset] == null) {
        retreivedRoll = " <strong>#d" + n + " (" + m + ")</strong>";
    } else {
        retreivedRoll = " <strong" + decide[2 + offset] + ">#d" + n + " (" + m + ")</strong>";
    }

    if (isSmart) {
        if (decide[0].substring(0,3) === "<br") before += "<br>";
        else before += "<blockquote>";

        newInner += decide[2];
    }

    post.innerHTML = before + newInner + retreivedRoll + after;
}

function parseShares(post, shares) {
    var options = shares[1].split(",");
    var n = shares[3];
    var maxShares = shares[4];
    var shareValues = shares[5].split(" + ");
    for (var j = 0; j < shareValues.length; j++) {
        shareValues[j] = Number(shareValues[j]); //Because FUCK YOU FUCKING JAVASCRIPT END YOURSELF YOU SHIT AAAAAAAAAAAAAAAA FUCK
    }

    var before = post.innerHTML.substring(0, shares.index);
    var after = post.innerHTML.substring(shares.index + shares[0].length);
    var highestValue = Math.max.apply(Math, shareValues);

    if (options.length != n || n == 1 || n == 0) return;

    for (var j = 0; j < shareValues.length; j++) {
        var formattedRoll = " (" + shareValues[j] + "/" + maxShares + ")";

        // format the options
        if (shareValues[j] == highestValue) {
            if(options[j].match(/(^|\W)planeptune($|\W)(?!\w)/i)){
                options[j] = "</strong><strong class=\"planeptune_wins\">" + options[j] + formattedRoll + "</strong><strong>";
            }else if(options[j].match(/(^|\W)lastation($|\W)(?!\w)/i)){
                options[j] = "</strong><strong class=\"lastation_wins\">" + options[j] + formattedRoll + "</strong><strong>";
            }else if(options[j].match(/(^|\W)lowee($|\W)(?!\w)/i)){
                options[j] = "</strong><strong class=\"lowee_wins\">" + options[j] + formattedRoll + "</strong><strong>";
            }else if(options[j].match(/(^|\W)leanbox($|\W)(?!\w)/i)){
                options[j] = "</strong><strong class=\"leanbox_wins\">" + options[j] + formattedRoll + "</strong><strong>";
            }else{
                options[j] = "</strong><strong class=\"decision_roll\">" + options[j] + formattedRoll + "</strong><strong>";
            }

        } else {
            options[j] = options[j] + formattedRoll;
        }
    }

    var newInner = options.join("<br>");
    if (before.substring(before.length-4) != "<br>" && before.substring(before.length-4) != "ote>") {
        before += "<br>";
    }
    if (after.substring(0, 4) != "<br>" && after.substring(0, 4) != "<blo") {
        after = "<br>" + after;
    }
    post.innerHTML = before + "<strong>" + newInner + "</strong>" + after;
}

function findMultipleShitFromAString(s, re) {
    var result = [];
    var m;
    while (true) {
        m = re.exec(s);
        if (m) result.push(m);
        else break;
    }
    return result;
}

// Observer watches the thread

function setObservers() {
    var thread = document.getElementById("thread-container");

    // configuration of the observers:
    var config = { attributes: true, childList: true, subtree: true, attributeOldValue: true };

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length == 0) {
                if (mutation.type == "attributes" && mutation.attributeName == "class") {
                    // check for existing posts that have changed, ie deleted/canceled/finished
                    var post = mutation.target;
                    var postContent = post.getElementsByClassName("post-container")[0];
                    if (postContent != undefined) {
                        if (currentlyEnabledOptions.has("showWhoDeletedPosts")) {
                            checkForDeletedOrBannedPost(postContent);
                        }
                        if (currentlyEnabledOptions.has("showDeletedPosts")) {
                            showDeletedPost(postContent);
                        }
                        if (currentlyEnabledOptions.has("cancelposters")) {
                            // unhide removed posts, and restore their contents
                            if (post.classList.contains("hidden") && postContent.innerText == "") {
                                // look for events that removed nodes
                                var cancelled = false;
                                for (var j = 0; j < mutations.length; j++) {
                                    var removeEvt = mutations[j];
                                    if (removeEvt.type == "childList") {
                                        for (var i = 0; i < removeEvt.removedNodes.length; i++) {
                                            var node = removeEvt.removedNodes[i];
                                            // don't re-add the 'Hide, Report' menu if it disappeared
                                            // or the post controls or editable textarea
                                            if (!((node.classList && node.classList.contains("popup-menu")) ||
                                                 node.id == "post-controls" ||
                                                 node.id == "text-input")) {
                                                removeEvt.target.appendChild(removeEvt.removedNodes[i]);
                                                cancelled = true;
                                            }
                                        }
                                    }
                                }

                                // restore the post if it was probably cancelled
                                if (cancelled) {
                                    post.classList.remove("hidden");
                                    post.style.opacity = "0.5";
                                    // flag the post as cancelled so we add the correct 'dumb xposter' later
                                    postContent.cancelled = true;
                                    // somewhere along the way, the default image-hover listener breaks
                                    // so just prevent it from running to avoid console errors
                                    post.addEventListener("mousemove", function(e){e.stopPropagation();});
                                }
                            }
                        }
                        // check for posts finishing
                        // (the current user deadposting will have been 'reply-form' but not 'editing')
                        if ((mutation.oldValue.split(" ").includes("editing") ||
                             mutation.oldValue.split(" ").includes("reply-form")) &&
                             !post.classList.contains("editing") &&
                             !post.classList.contains("reply-form")) {
                            handlePost(postContent);
                            if (currentlyEnabledOptions.has("enablemegucaplayer")) {
                                mgcPl_addNewSong(post.getElementsByTagName("figcaption")[0]);
                            }
                        }
                    }
                }
            } else {
                // check what was added
                var postItself;
                if (mutation.target.nodeName == "BLOCKQUOTE") {
                    // could be updating the content of an existing post
                    // try to find the post itself
                    if (mutation.target.parentNode &&
                        mutation.target.parentNode.parentNode &&
                        mutation.target.parentNode.parentNode.nodeName == "ARTICLE") {
                        postItself = mutation.target.parentNode.parentNode;
                    }
                } else if (mutation.addedNodes[0].nodeName == "ARTICLE") {
                    postItself = mutation.addedNodes[0];
                } else if (mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("admin","banned")) {
                    if (currentlyEnabledOptions.has("showWhoDeletedPosts")) {
                        checkForDeletedOrBannedPost(mutation.target);
                    }
                }

                if (postItself == undefined) {
                    return;
                }
                var postContent = postItself.getElementsByClassName("post-container")[0];
                if (postContent == undefined) {
                    return;
                }

                // still editing
                if (postItself.getAttribute("class").includes("editing") || postItself.getAttribute("class").includes("reply-form")) {
                    // add Format button to posts the user is making
                    if (postItself.getAttribute("class").includes("reply-form")) {
                        if (currentlyEnabledOptions.has("annoyingFormatting")) addFormatButton(postItself);
                        if (currentlyEnabledOptions.has("preSubmitOption")) overrideDoneButton(postItself);
                    }
                    // but don't do anything else to editing posts
                    return;
                }
                // handlesPost (works for others' deadposts)
                handlePost(postContent);
                if (currentlyEnabledOptions.has("enablemegucaplayer")) {
                    mgcPl_addNewSong(post.getElementsByTagName("figcaption")[0]);
                }
            }
        });
    });

    // pass in the target node, as well as the observer options
    observer.observe(thread, config);

    if (currentlyEnabledOptions.has("imgsekritPosting")) {
        setupSecretObserver();
    }
}

function addFormatButton(post) {
    if (document.getElementById("format-button")) {
        // button already exists
        return;
    }
    var button = document.createElement("input");
    button.name = "format";
    button.value = "Format";
    button.type = "button";
    button.id = "format-button";
    button.onclick = formatPostText;

    var controls = document.getElementById("post-controls");
    controls.appendChild(button);
}

function formatPostText() {
    var input = document.getElementById("text-input");
    input.value = input.value.split(" ").map(formatWord).join(" ");
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('input', false, true);
    input.dispatchEvent(evt);
}

function formatWord(s) {
    // pick a random format and add it to both sides of the word
    var format = ["~~","**","@@","``"][Math.floor(Math.random()*4)];
    return format + s + format;
}

function checkForDumbPost(post) {
    // cancelposters
    if (post.cancelled) {
        addToName(post, " (dumb cancelposter)");
        return;
    }
    var text = post.textContent;
    // ~posters
    if (text.match("~") != null) {
        addToName(post, " (dumb ~poster)");
        return;
    }
    // Blancposters
    if ((text == "" || text == " ") && post.getElementsByTagName("figure").length == 0) {
        var quality = (currentlyEnabledOptions.has("dumbblanc")) ? "dumb" : "cute";
        addToName(post, " (" + quality + " blancposter)");
        return;
    }
    // dumbposterposters
    var dumbRegex = /^(?:>>\d* (?:\(You\) )?# )*(dumb ?.{0,20}posters?)$/i;
    if (text.match(dumbRegex) != null) {
        let posterType = text.match(dumbRegex)[1];
        addToName(post, " (dumb '" + posterType + "' poster)");
        return;
    }
    // cuteposterposters
    var cuteRegex = /^(?:>>\d* (?:\(You\) )?# )*(cute ?.{0,20}posters?)$/i;
    if (text.match(cuteRegex) != null) {
        let posterType = text.match(cuteRegex)[1];
        addToName(post, " (cute '" + posterType + "' poster)");
        return;
    }
    // wait anon
    if (text.match(/^(?:>>\d* (?:\(You\) )?# )*wait anon$/i) != null) {
        addToName(post, " (Dumb haiku poster / 'wait anon' is all she says / Don't wait, run away!)");
        return;
    }
    // virus post
    if (text.match(/virus/i) != null) {
        addToName(post, " (virus post do not read)");
        return;
    }
    // lowercaseposters
    var uppers = findMultipleShitFromAString(text, /[A-Z]/g);
    var Yous = findMultipleShitFromAString(text, />>\d* \(You\)/g);
    if (uppers.length == Yous.length) {
        var lowers = findMultipleShitFromAString(text, /[a-z]/g);
        if (lowers.length >= 5) {
            addToName(post, " (dumb lowercaseposter)");
            return;
        }
    }
    addToName(post, "");
}

function checkForScreamingPost(post) {
    var text = post.textContent;
    var wholePost = post.parentElement;

    // Remove (references, Yous and spaces)
    text = text.replace(/(?:>>\d* (?:\(You\) )?#)/g, "").replace(/(?:>>\d*)/g, "").replace(/[\s\W\d_]/g, "");

    var isBlanc = (text.length == 0);
    var hasLower = text.match("[a-z]");
    var isShort = (text.length <= 5);
    if (!isShort && !isBlanc && !hasLower && !wholePost.className.match("shaking_post")) {
        wholePost.className += " shaking_post";
    }
}

function addToName(post, message) {
    var name = post.parentNode.getElementsByClassName("name spaced")[0];
    var newText = document.createTextNode(message);
    newText.id = "dumbposter";
    // remove existing names
    name.parentNode.childNodes.forEach((node) => {
        if (node.id == "dumbposter") {
            name.parentNode.removeChild(node);
        }
    });
    name.parentNode.insertBefore(newText, name.nextSibling);
}

function filterPost(postContent) {
    var post = postContent.parentNode;
    if (post.classList.contains("filtered") ||
        post.classList.contains("filtered-shown")) {
        return;
    }
    for (var i = 0; i < customFilters.length; i++) {
        var filter = customFilters[i];
        var type = filter[0];
        var reg = filter[1];
        var textToMatch;
        var selector = filterTypes.get(type);
        var elt = post.querySelector(selector);
        if (elt != null) {
            // flags don't have text, so use the title instead
            if (type == "flag") {
                textToMatch = elt.title;
            } else {
                textToMatch = elt.innerText;
            }
        }
        if (textToMatch != undefined && textToMatch.match(reg)) {
            post.classList.add("filtered");
            var stub = document.createElement("div");
            stub.classList.add("filter-stub");
            var name = filter[1].toString();
            name = name.substring(1, name.length - 1); // strip the /s
            stub.innerText = "Post filtered (" + filter[0] + ":" + name + ")";
            stub.onclick = showFilteredPost;
            post.appendChild(stub);
        }
    }
}

function showFilteredPost() {
    var post = this.parentNode;
    if (post.classList.contains("filtered")) {
        post.classList.remove("filtered");
        post.classList.add("filtered-shown");
    } else {
        post.classList.remove("filtered-shown");
        post.classList.add("filtered");
    }
}

function setupStorage(){
	if(typeof GM_setValue === "function"){ //if tampermonkey/violentmonkey
        console.log("Using tampermonkey/violentmonkey");
		setFunc = GM_setValue;
		getFunc = GM_getValue;
	}else if(typeof GM === "object"){ //if greasemonkey
        console.log("Using greasemonkey");
		setFunc = GM.setValue;
		getFunc = GM.getValue;
	}else{ //if something else, alert to tell user something's wrong, use localstorage for rest of session
		//can't do setFunc = localStorage.setItem; for some reason, probably has to do with binding to the window
		setFunc = function(){localStorage.setItem(arguments[0], arguments[1]);};
		//if getFunc(item, default) is called and item is null, default will be given
		//if getFunc(item) is called, item will be given, and if item is null, null will still be returned
		getFunc = function(){
			return (localStorage.getItem(arguments[0]) == null) ? arguments[1] : localStorage.getItem(arguments[0]);
		};
		//gives alert, ok brings to issue page, only show once to not annoy you every time
		if(getFunc("errorScreenShown")!="true"){
			if(window.confirm("You are not using greasemonkey/tampermonkey/violentmonkey. Please open up an issue at our github to fix this. Specify what userscript manager you are using. Pressing OK will bring you to the page, until then only temporary storage will be used")){
				window.location.href="https://github.com/tragsg/megukascript/issues/new";
			}
			setFunc("errorScreenShown","true");
		}
	}
}

function setup() {
	setupStorage();
    getCurrentOptions();
    insertCuteIntoCSS();
    readPostsForData();
    if (document.getElementById("thread-container") != null)
        setObservers();
    hackLatsOptions();
	checkShortcuts(); //must go after options init
    if (currentlyEnabledOptions.has("enablemegucaplayer")) mgcPl_setupPlaylist();
}
function checkShortcuts() {
	var tagRow;
	//because this function overrides anything else, i must put all keydown operators in this
	//therefore the setters for keybinds are here as well
	document.onkeydown = function(e){
		e=e||event;
        //check to see which pathing method is supported by the current browser
        var path = e.path || (e.composedPath && e.composedPath());
		//if in the right area and if the current keys pressed are a shortcut
		//if that last check isn't there, it would ignore handy default shortcuts like copy/paste
		if(e.target.nodeName==='TEXTAREA' && e.target.parentElement.parentElement.className==='post-container' && ','.concat(keybinds.toString()).toLowerCase().concat(',').includes(','.concat((e.ctrlKey ? 'Ctrl+' : '')).concat(e.altKey ? 'Alt+' : '').concat(e.shiftKey ? 'Shift+' : '').concat(e.code.replace(/(Key|Digit)/,'')).concat(',').toLowerCase())){
			console.log(','.concat(keybinds.toString()).toLowerCase().concat(','));
			console.log((e.ctrlKey ? 'Ctrl+' : '').concat(e.altKey ? 'Alt+' : '').concat(e.shiftKey ? 'Shift+' : '').concat(e.code.replace(/(Key|Digit)/,'')).toLowerCase());
			e.preventDefault();
			e.stopPropagation();
			var tagRow=-1;
			var currentKeysPressed = (e.ctrlKey ? 'Ctrl+' : '')
						.concat(e.altKey ? 'Alt+' : '')
						.concat(e.shiftKey ? 'Shift+' : '')
						.concat(e.code.replace(/(Key|Digit)/,''));
			for(let i=0;i<keybinds.length && tagRow<0;i++){
				console.log(keybinds[0]);
				tagRow=(keybinds[i][1].toLowerCase()==currentKeysPressed.toLowerCase() ? i : -1);
			}
			if(tagRow>=0){
				var selStart=e.target.selectionStart, selEnd=e.target.selectionEnd;
				e.target.value = e.target.value.slice(0,selStart)
								+ keybinds[tagRow][2]
								+ e.target.value.slice(selStart,selEnd)
								+ keybinds[tagRow][2]
								+ e.target.value.slice(selEnd);
				e.target.setSelectionRange(keybinds[tagRow][2].length + selEnd, keybinds[tagRow][2].length + selEnd);
				let evt = document.createEvent('HTMLEvents');
				evt.initEvent('input', false, true);
				e.target.dispatchEvent(evt);
			}
		}
		//else if it's an input and it's in the shortcuts menu
		else if(e.target.nodeName==='INPUT' && path.length==10 && path[1].getAttribute('data-id')=='4' ){
			e.preventDefault();
			e.stopPropagation();
			var kc = (e.keyCode || e.which || 0);
			//if backspace, escape, delete are pressed, empty it
			if(kc==8 || kc==27 || kc==46){
				e.target.value='';
				let evt = document.createEvent('HTMLEvents');
				evt.initEvent('input', false, true);
				e.target.dispatchEvent(evt);
			}
			//0-9, a-z, numpad 0-9, f1-f12, enter
            //code could be expanded to other keys if desired
			else if((kc>=48 && kc<=57) || (kc>=65 && kc<=90) || (kc>=96 && kc<=105) || (kc>=112 && kc<=123) || kc==13 ){
				e.target.value=(e.ctrlKey ? 'Ctrl+' : '')
						.concat(e.altKey ? 'Alt+' : '')
						.concat(e.shiftKey ? 'Shift+' : '')
						.concat(e.code.replace(/(Key|Digit)/,'')); //KeyA gets turned to A, Digit1 -> 1, numpad1 is still numpad1
				
				setFunc(e.target.id,e.target.value);
				var rowTag=keybinds[0].map((col, i) => keybinds.map(row => row[i]))[0].indexOf(e.target.id);
				keybinds[rowTag][1]=e.target.value;
				
				let evt = document.createEvent('HTMLEvents');
				evt.initEvent('input', false, true);
				e.target.dispatchEvent(evt);
			}
		}
	}
}
function downloadAll() {
    var posts = document.getElementById("thread-container").children;
    var filetypes = document.getElementById("steal_filetypes").value.split(" ");
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].tagName.toLowerCase() === "article" &&
            posts[i].querySelector("figcaption") != null) {
            var anchor = posts[i].querySelector("figcaption").children[3];
            for (var j = 0; j < filetypes.length; j++){
                if (anchor.href.endsWith(filetypes[j])){
                    anchor.click();
                }
            }
        }
    }
}

// override #d7777(7777)
function overrideDoneButton(postItself) {
    if (document.getElementById("overrided-done-button") || document.getElementsByClassName('spaced temporary')) {
        // button shouldn't be added
        return;
    }

    var button = document.createElement("input");
    button.name = "over-done";
    button.value = "Done";
    button.type = "button";
    button.id = "overrided-done-button";
    button.onclick = editPostAndSubmit;

    var controls = document.getElementById("post-controls");
    controls.children[0].style.display = "none";
    controls.insertBefore(button, controls.children[0].nextSibling);
}

function editPostAndSubmit() {
    var input = document.getElementById("text-input");
    handlePreSubmit(input);
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('input', false, true);
    input.dispatchEvent(evt);
    document.getElementById("post-controls").children[0].click();
}

// All functions here must edit "input.value". This is the post written content.
function handlePreSubmit(input) {
    // Put memes here
}

setup();
