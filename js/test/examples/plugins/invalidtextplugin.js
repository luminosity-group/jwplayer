(function(jwplayer) {

	var template = function(player, config, div) {
		this.resize = function(width, height) {
			div.style.color = "white";
			div.innerHTML = config.text;
			console.log(width, height)
		};
	}
	
	jwplayer().registerPlugin('textplugin', template);
	
})(jwplayer);