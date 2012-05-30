(function(jwplayer) {

	var template = function(player, config, div) {
		var over = false;
		player.onReady(function(obj) {
			toggleLights();
		});
		function toggleLights() {
			if (over) {
				over = false;
				player.getPlugin("dock").setButton("lightsoff", toggleLights, "http://playertest.longtailvideo.com/dockplugin/assets/dock_on_out.png", "http://playertest.longtailvideo.com/dockplugin/assets/dock_on_over.png");
			} else {
				over = true;
				player.getPlugin("dock").setButton("lightsoff", toggleLights, "http://playertest.longtailvideo.com/dockplugin/assets/dock_off_out.png", "http://playertest.longtailvideo.com/dockplugin/assets/dock_off_over.png");
			}
		};
	}
	
	jwplayer().registerPlugin('dockplugin', template, '');
	
})(jwplayer);
