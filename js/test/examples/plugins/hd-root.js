(function(jwplayer) {

	var template = function(player, config, div) {
		this.resize = function(width, height) {
			div.style.color = "white";
			div.innerHTML = config.text;
		};
	}
	
	jwplayer().registerPlugin('hd', template, '/player/trunk/fl5/js/test/examples/plugins/hd-1.swf');
	
})(jwplayer);