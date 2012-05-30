(function(jwplayer) {

	var template = function(player, config, div) {
		this.resize = function(width, height) {
			div.style.color = "white";
			div.innerHTML = config.text;
		};
	}
	
	jwplayer().registerPlugin('hd', template, 'hd');
	
})(jwplayer);