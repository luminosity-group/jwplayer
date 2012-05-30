(function(jwplayer) {

	var template = function(player, config, div) {
		this.resize = function(width, height) {
			div.style.color = "white";
			div.innerHTML = width + " x " + height;
		};
		
		player.onResize(function(evt) {
			var debug = document.getElementById(config.debug);
			if (debug) {
  			 debug.innerHTML += "Player dimensions: " + evt.width + " x " + evt.height + "<br/>";
			} else {
  			console.log("Player resize: %s %s", evt.width, evt.height);
			}
		});
	}
	
	jwplayer().registerPlugin('resizeplugin', template);
	
})(jwplayer);