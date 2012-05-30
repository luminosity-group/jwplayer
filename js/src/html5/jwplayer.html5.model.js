/**
 * JW Player model component
 *
 * @author zach
 * @version 5.9
 */
(function(jwplayer) {
	var _configurableStateVariables = ["width", "height", "start", "duration", "volume", "mute", "fullscreen", "item", "plugins", "stretching"];
	var _utils = jwplayer.utils;
	
	jwplayer.html5.model = function(api, container, options) {
		var _api = api;
		var _container = container;
		var _cookies = _utils.getCookies();
		var _model = {
			id: _container.id,
			playlist: [],
			state: jwplayer.api.events.state.IDLE,
			position: 0,
			buffer: 0,
			container: _container,
			config: {
				width: 480,
				height: 320,
				item: -1,
				skin: undefined,
				file: undefined,
				image: undefined,
				start: 0,
				duration: 0,
				bufferlength: 5,
				volume: _cookies.volume ? _cookies.volume : 90,
				mute: _cookies.mute && _cookies.mute.toString().toLowerCase() == "true" ? true : false,
				fullscreen: false,
				repeat: "",
				stretching: jwplayer.utils.stretching.UNIFORM,
				autostart: false,
				debug: undefined,
				screencolor: undefined
			}
		};
		var _media;
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		var _components = ["display", "logo", "controlbar", "playlist", "dock"];
		
		jwplayer.utils.extend(_model, _eventDispatcher);
		
		for (var option in options) {
			if (typeof options[option] == "string") {
				var type = /color$/.test(option) ? "color" : null;
				options[option] = jwplayer.utils.typechecker(options[option], type);
			}
			var config = _model.config;
			var path = option.split(".");
			for (var edge in path) {
				if (edge == path.length - 1) {
					config[path[edge]] = options[option];
				} else {
					if (!jwplayer.utils.exists(config[path[edge]])) {
						config[path[edge]] = {};
					}
					config = config[path[edge]];
				}
			}
		}
		for (var index in _configurableStateVariables) {
			var configurableStateVariable = _configurableStateVariables[index];
			_model[configurableStateVariable] = _model.config[configurableStateVariable];
		}
		
		var pluginorder = _components.concat([]);
		
		if (jwplayer.utils.exists(_model.plugins)) {
			if (typeof _model.plugins == "string") {
				var userplugins = _model.plugins.split(",");
				for (var userplugin in userplugins) {
					if (typeof userplugins[userplugin] == "string") {
						pluginorder.push(userplugins[userplugin].replace(/^\s+|\s+$/g, ""));
					}
				}
			}
		}
		
		if (jwplayer.utils.isMobile()) {
			pluginorder = ["display","logo","dock","playlist"];
			if (!jwplayer.utils.exists(_model.config.repeat)) {
				_model.config.repeat = "list";
			}
		} else if (_model.config.chromeless) {
			pluginorder = ["logo","dock","playlist"];
			if (!jwplayer.utils.exists(_model.config.repeat)) {
				_model.config.repeat = "list";
			}
		}
		
		_model.plugins = {
			order: pluginorder,
			config: {},
			object: {}
		};
		
		if (typeof _model.config.components != "undefined") {
			for (var component in _model.config.components) {
				_model.plugins.config[component] = _model.config.components[component];
			}
		}
		
		var playlistVisible = false;
		
		for (var pluginIndex in _model.plugins.order) {
			var pluginName = _model.plugins.order[pluginIndex];
			var pluginConfig = !jwplayer.utils.exists(_model.plugins.config[pluginName]) ? {} : _model.plugins.config[pluginName];
			_model.plugins.config[pluginName] = !jwplayer.utils.exists(_model.plugins.config[pluginName]) ? pluginConfig : jwplayer.utils.extend(_model.plugins.config[pluginName], pluginConfig);
			if (!jwplayer.utils.exists(_model.plugins.config[pluginName].position)) {
				if (pluginName == "playlist") {
					_model.plugins.config[pluginName].position = jwplayer.html5.view.positions.NONE;
				} else {
					_model.plugins.config[pluginName].position = jwplayer.html5.view.positions.OVER;
				}
			} else {
				if (pluginName == "playlist") {
					playlistVisible = true;
				}
				_model.plugins.config[pluginName].position = _model.plugins.config[pluginName].position.toString().toUpperCase();
			}
		}
		
		/** Hide the next/prev buttons if the playlist is visible **/
		if (_model.plugins.config.controlbar && playlistVisible) {
			_model.plugins.config.controlbar.hideplaylistcontrols = true;
		}
		
		// Fix the dock
		if (typeof _model.plugins.config.dock != "undefined") {
			if (typeof _model.plugins.config.dock != "object") {
				var position = _model.plugins.config.dock.toString().toUpperCase();
				_model.plugins.config.dock = {
					position: position
				}
			}
			
			if (typeof _model.plugins.config.dock.position != "undefined") {
				_model.plugins.config.dock.align = _model.plugins.config.dock.position;
				_model.plugins.config.dock.position = jwplayer.html5.view.positions.OVER;
			}
			
			if (typeof _model.plugins.config.dock.idlehide == "undefined") {
				try {
					_model.plugins.config.dock.idlehide = _model.plugins.config.controlbar.idlehide;
				} catch (e) {}
			}
		}
		
		function _loadExternal(playlistfile) {
			var loader = new jwplayer.html5.playlistloader();
			loader.addEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
				_model.playlist = new jwplayer.html5.playlist(evt);
				_loadComplete(true);
			});
			loader.addEventListener(jwplayer.api.events.JWPLAYER_ERROR, function(evt) {
				_model.playlist = new jwplayer.html5.playlist({playlist:[]});
				_loadComplete(false);
			});
			loader.load(playlistfile);
		}
		
		function _loadComplete() {
			if (_model.config.shuffle) {
				_model.item = _getShuffleItem();
			} else {
				if (_model.config.item >= _model.playlist.length) {
					_model.config.item = _model.playlist.length - 1;
				} else if (_model.config.item < 0) {
					_model.config.item = 0;
				}
				_model.item = _model.config.item;
			}
			_model.position = 0;
			_model.duration = _model.playlist.length > 0 ? _model.playlist[_model.item].duration : 0;
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, {
				"playlist": _model.playlist
			});
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM, {
				"index": _model.item
			});
		}
		
		_model.loadPlaylist = function(arg) {
			var input;
			if (typeof arg == "string") {
				if (arg.indexOf("[") == 0 || arg.indexOf("{") == "0") {
					try {
						input = eval(arg);
					} catch(err) {
						input = arg;
					}
				} else {
					input = arg;
				}
			} else {
				input = arg;
			}
			var config;
			switch (jwplayer.utils.typeOf(input)) {
				case "object":
					config = input;
					break;
				case "array":
					config = {
						playlist: input
					};
					break;
				default:
					config = {
						file: input
					};
					break;
			}
			_model.playlist = new jwplayer.html5.playlist(config);
			_model.item = _model.config.item >= 0 ? _model.config.item : 0;
			if (!_model.playlist[0].provider && _model.playlist[0].file) {
				_loadExternal(_model.playlist[0].file);
			} else {
				_loadComplete();
			}
		};
		
		function _getShuffleItem() {
			var result = null;
			if (_model.playlist.length > 1) {
				while (!jwplayer.utils.exists(result)) {
					result = Math.floor(Math.random() * _model.playlist.length);
					if (result == _model.item) {
						result = null;
					}
				}
			} else {
				result = 0;
			}
			return result;
		}
		
		function forward(evt) {
			switch (evt.type) {
			case jwplayer.api.events.JWPLAYER_MEDIA_LOADED:
				_container = _media.getDisplayElement();
				break;
			case jwplayer.api.events.JWPLAYER_MEDIA_MUTE:
				this.mute = evt.mute;
				break;
			case jwplayer.api.events.JWPLAYER_MEDIA_VOLUME:
				this.volume = evt.volume
				break;
			}
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		var _mediaProviders = {};
		
		_model.setActiveMediaProvider = function(playlistItem) {
			if (playlistItem.provider == "audio") {
				playlistItem.provider = "sound";
			}
			var provider = playlistItem.provider;
			var current = _media ? _media.getDisplayElement() : null; 
			
			if (provider == "sound" || provider == "http" || provider == "") {
				provider = "video";
			}
			
			if (!jwplayer.utils.exists(_mediaProviders[provider])) {
				switch (provider) {
				case "video":
					_media = new jwplayer.html5.mediavideo(_model, current ? current : _container);
					break;
				case "youtube":
					_media = new jwplayer.html5.mediayoutube(_model, current ? current : _container);
					break;
				}
				if (!jwplayer.utils.exists(_media)) {
					return false;
				}
				_media.addGlobalListener(forward);
				_mediaProviders[provider] = _media;
			} else {
				if (_media != _mediaProviders[provider]) {
					if (_media) {
						_media.stop();
					}
					_media = _mediaProviders[provider];
				}
			}
			
			return true;
		};
		
		_model.getMedia = function() {
			return _media;
		};
		
		_model.seek = function(pos) {
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_SEEK, {
				"position": _model.position,
				"offset": pos
			});
			return _media.seek(pos);
		};
		
		_model.setVolume = function(newVol) {
			_utils.saveCookie("volume", newVol);
			_model.volume = newVol;
		}

		_model.setMute = function(state) {
			_utils.saveCookie("mute", state);
			_model.mute = state;
		}

		
		
		_model.setupPlugins = function() {
			if (!jwplayer.utils.exists(_model.plugins) || !jwplayer.utils.exists(_model.plugins.order) || _model.plugins.order.length == 0) {
				jwplayer.utils.log("No plugins to set up");
				return _model;
			}
			
			for (var i = 0; i < _model.plugins.order.length; i++) {
				try {
					var pluginName = _model.plugins.order[i];
					if (jwplayer.utils.exists(jwplayer.html5[pluginName])) {
						if (pluginName == "playlist") {
							_model.plugins.object[pluginName] = new jwplayer.html5.playlistcomponent(_api, _model.plugins.config[pluginName]);
						} else {
							_model.plugins.object[pluginName] = new jwplayer.html5[pluginName](_api, _model.plugins.config[pluginName]);
						}
					} else {
						_model.plugins.order.splice(plugin, plugin + 1);
					}
					if (typeof _model.plugins.object[pluginName].addGlobalListener == "function") {
						_model.plugins.object[pluginName].addGlobalListener(forward);
					}
				} catch (err) {
					jwplayer.utils.log("Could not setup " + pluginName);
				}
			}
			
		};
		
		return _model;
	};
	
	
})(jwplayer);
