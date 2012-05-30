var settings = {
	players: function(location, players){
		var basepath = location.substring(0, location.indexOf("/js/test/examples") + 1);
		var defaults = {
			html5: {type:"html5"},
			//flash: {type:"flash", src:basepath+"bin-debug/player.swf"},
			flash: {type:"flash", src:basepath+"player.swf"},
			download: {type:"download"}
		};
		if (!players){
			return [defaults.html5, defaults.flash, defaults.download];
			//return [defaults.flash, defaults.html5, defaults.download];
		} else {
			var result = [];
			for (var player = 0; player < players.length; player++) {
				result.push(defaults[players[player]]);
			} 
			return result;
		}
	},
	
	modes:{
    flashonly: [{type:'flash',src:'../../../player.swf'}],
    html5only: [{type:'html5'}],
    flashhtml5: [{type:'flash',src:'../../../player.swf'},{type:'html5'}],
    flash: [{type:'flash',src:'../../../player.swf'},{type:'html5'},{type:'download'}],
    html5: [{type:'html5'},{type:'flash',src:'../../../player.swf'},{type:'download'}],
    standard: [{type:'flash',src:'../../../player.swf'},{type:'html5'},{type:'download'}]
 }

};

function getVariable(name) {
	return QueryString[name];
}

// Borrowed from http://stackoverflow.com/questions/4865089/retreiving-a-multiple-select-with-get
var QueryString = function () {
	  // This function is anonymous, is executed immediately and 
	  // the return value is assigned to QueryString!
	  var query_string = {};
	  var query = window.location.search.substring(1);
	  var vars = query ? query.split("&") : [];
	  for (var i=0;i<vars.length;i++) {
	    var pair = vars[i] ? vars[i].split("=") : [];
	                // If first entry with this name
	    if (typeof query_string[pair[0]] === "undefined") {
	      query_string[pair[0]] = pair[1];
	                // If second entry with this name
	    } else if (typeof query_string[pair[0]] === "string") {
	      var arr = [ query_string[pair[0]], pair[1] ];
	      query_string[pair[0]] = arr.join(",");
	                // If third or later entry with this name
	    } else {
	      query_string[pair[0]].push(pair[1]);
	    }
	  } 
	  return query_string;
} ();

function setDefault(name) {
	var val = getVariable(name);
	if (val) {
		document.getElementById(name+"_"+val).selected = true;
	}
}
