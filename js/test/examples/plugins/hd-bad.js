(function(jwplayer) {

	var template = function(player, config, div) {
		this.resize = function(width, height) {
			div.style.color = "white";
			div.innerHTML = config.text;
		};
	}
	
	jwplayer().registerPlugin('hd', template, 'http://plugins.longtailvideo.com/5/hd/hd1-1.swf');
	
})(jwplayer);