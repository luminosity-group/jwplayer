/**
 * Embedder for the JW Player
 * @author Zach
 * @version 5.8
 */
(function(jwplayer) {
	var _utils = jwplayer.utils;
	
	jwplayer.embed = function(playerApi) {
		var _defaults = {
			width: 400,
			height: 300,
			components: {
				controlbar: {
					position: 'over'
				}
			}
		};
		var mediaConfig = _utils.mediaparser.parseMedia(playerApi.container);
		var _config = new jwplayer.embed.config(_utils.extend(_defaults, mediaConfig, playerApi.config), this);
		var _pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins);
		
		function _setupEvents(api, events) {
			for (var evt in events) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, events[evt]);
				}
			}
		}
		
		function _embedPlayer() {
			if (_pluginloader.getStatus() == _utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && jwplayer.embed[_config.modes[mode].type]) {
						var modeconfig = _config.modes[mode].config;
						var configClone = _config;
						if (modeconfig) {
							configClone = _utils.extend(_utils.clone(_config), modeconfig);

							/** Remove fields from top-level config which are overridden in mode config **/ 
							var overrides = ["file", "levels", "playlist"];
							for (var i=0; i < overrides.length; i++) {
								var field = overrides[i];
								if (_utils.exists(modeconfig[field])) {
									for (var j=0; j < overrides.length; j++) {
										if (j != i) {
											var other = overrides[j];
											if (_utils.exists(configClone[other]) && !_utils.exists(modeconfig[other])) {
												delete configClone[other];
											}
										}
									}
								}
							}
						}
						var embedder = new jwplayer.embed[_config.modes[mode].type](document.getElementById(playerApi.id), _config.modes[mode], configClone, _pluginloader, playerApi);
						if (embedder.supportsConfig()) {
							embedder.embed();
							
							_setupEvents(playerApi, _config.events);
							
							return playerApi;
						}
					}
				}
				_utils.log("No suitable players found");
				new jwplayer.embed.logo(_utils.extend({
					hide: true
				}, _config.components.logo), "none", playerApi.id);
			}
		};
		
		_pluginloader.addEventListener(jwplayer.events.COMPLETE, _embedPlayer);
		_pluginloader.addEventListener(jwplayer.events.ERROR, _embedPlayer);
		_pluginloader.load();
		
		return playerApi;
	};
	
	function noviceEmbed() {
		if (!document.body) {
			return setTimeout(noviceEmbed, 15);
		}
		var videoTags = _utils.selectors.getElementsByTagAndClass('video', 'jwplayer');
		for (var i = 0; i < videoTags.length; i++) {
			var video = videoTags[i];
			if (video.id == "") {
				video.id = "jwplayer_" + Math.round(Math.random()*100000);
			}
			jwplayer(video.id).setup({});
		}
	}
	
	noviceEmbed();
	
	
})(jwplayer);
