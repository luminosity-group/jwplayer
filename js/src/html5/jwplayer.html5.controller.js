/**
 * JW Player controller component
 *
 * @author zach
 * @version 5.9
 */
(function(jwplayer) {

	var _mediainfovariables = ["width", "height", "state", "playlist", "item", "position", "buffer", "duration", "volume", "mute", "fullscreen"];
	var _utils = jwplayer.utils;
	
	jwplayer.html5.controller = function(api, container, model, view) {
		var _api = api,
			_model = model,
			_view = view,
			_container = container,
			_itemUpdated = true,
			_oldstart = -1,
			_preplay = false,
			_interruptPlay = false,
			_actionOnAttach,
			_queuedEvents = [],
			_ready = false;
		
		
		var _debug = (_utils.exists(_model.config.debug) && (_model.config.debug.toString().toLowerCase() == 'console')),
			_eventDispatcher = new jwplayer.html5.eventdispatcher(_container.id, _debug);
			
		_utils.extend(this, _eventDispatcher);
		
		function forward(evt) {
			if (_ready) {
				_eventDispatcher.sendEvent(evt.type, evt);
			} else {
				_queuedEvents.push(evt);
			}
		}
		
		function _playerReady(evt) {
			if (!_ready) {
				_ready = true;

				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_READY, evt);
				
				if (jwplayer.utils.exists(window.playerReady)) {
					playerReady(evt);
				}

				if (jwplayer.utils.exists(window[model.config.playerReady])) {
					window[model.config.playerReady](evt);
				}

				while (_queuedEvents.length > 0) {
					var queued = _queuedEvents.shift(); 
					_eventDispatcher.sendEvent(queued.type, queued);						
				}
			
				if (model.config.autostart && !jwplayer.utils.isIOS()) {
					//_item(_model.item);
					_playlistLoadHandler();
				}

				while (_queuedCalls.length > 0) {
					var queuedCall = _queuedCalls.shift();
					_callMethod(queuedCall.method, queuedCall.arguments);
				}

			}
		}
		
		_model.addGlobalListener(forward);
		
		/** Set event handlers **/
		_model.addEventListener(jwplayer.api.events.JWPLAYER_MEDIA_BUFFER_FULL, function() {
			_model.getMedia().play();
		});
		_model.addEventListener(jwplayer.api.events.JWPLAYER_MEDIA_TIME, function(evt) {
			if (evt.position >= _model.playlist[_model.item].start && _oldstart >= 0) {
				_model.playlist[_model.item].start = _oldstart;
				_oldstart = -1;
			}
		});
		_model.addEventListener(jwplayer.api.events.JWPLAYER_MEDIA_COMPLETE, function(evt) {
			setTimeout(_completeHandler, 25);
		});
		_model.addEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, _playlistLoadHandler);
		_model.addEventListener(jwplayer.api.events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
		
		function _play() {
			try {
				_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = true;
					_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = false;
					if (_interruptPlay) {
						_interruptPlay = false;
						_actionOnAttach = null;
						return;
					}
				}
				
				_loadItem(_model.item);
				if (_model.playlist[_model.item].levels[0].file.length > 0) {
					if (_itemUpdated || _model.state == jwplayer.api.events.state.IDLE) {
						_model.getMedia().load(_model.playlist[_model.item]);
						_itemUpdated = false;
					} else if (_model.state == jwplayer.api.events.state.PAUSED) {
						_model.getMedia().play();
					}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return false;
		}
		
		
		/** Switch the pause state of the player. **/
		function _pause() {
			try {
				if (_model.playlist[_model.item].levels[0].file.length > 0) {
					switch (_model.state) {
						case jwplayer.api.events.state.PLAYING:
						case jwplayer.api.events.state.BUFFERING:
							if (_model.getMedia()) {
								_model.getMedia().pause();
							}
							break;
						default:
							if (_preplay) {
								_interruptPlay = true;
							}
					}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Seek to a position in the video. **/
		function _seek(position) {
			try {
				if (_model.playlist[_model.item].levels[0].file.length > 0) {
					if (typeof position != "number") {
						position = parseFloat(position);
					}
					switch (_model.state) {
						case jwplayer.api.events.state.IDLE:
							if (_oldstart < 0) {
								_oldstart = _model.playlist[_model.item].start;
								_model.playlist[_model.item].start = position;
							}
							if (!_preplay) {
								_play();
							}
							break;
						case jwplayer.api.events.state.PLAYING:
						case jwplayer.api.events.state.PAUSED:
						case jwplayer.api.events.state.BUFFERING:
							_model.seek(position);
							break;
					}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Stop playback and loading of the video. **/
		function _stop(clear) {
			_actionOnAttach = null;
			if (!_utils.exists(clear)) {
				clear = true;
			}
			try {
				if ((_model.state != jwplayer.api.events.state.IDLE || clear) && _model.getMedia()) {
					_model.getMedia().stop(clear);
				}
				if (_preplay) {
					_interruptPlay = true;
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		/** Stop playback and loading of the video. **/
		function _next() {
			try {
				if (_model.playlist[_model.item].levels[0].file.length > 0) {
					if (_model.config.shuffle) {
						_loadItem(_getShuffleItem());
					} else if (_model.item + 1 == _model.playlist.length) {
						_loadItem(0);
					} else {
						_loadItem(_model.item + 1);
					}
				}
				if (_model.state != jwplayer.api.events.state.IDLE) {
					var oldstate = _model.state;
					_model.state = jwplayer.api.events.state.IDLE;
					_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYER_STATE, {
						oldstate: oldstate,
						newstate: jwplayer.api.events.state.IDLE
					});
				}
				_play();
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		/** Stop playback and loading of the video. **/
		function _prev() {
			try {
				if (_model.playlist[_model.item].levels[0].file.length > 0) {
					if (_model.config.shuffle) {
						_loadItem(_getShuffleItem());
					} else if (_model.item === 0) {
						_loadItem(_model.playlist.length - 1);
					} else {
						_loadItem(_model.item - 1);
					}
				}
				if (_model.state != jwplayer.api.events.state.IDLE) {
					var oldstate = _model.state;
					_model.state = jwplayer.api.events.state.IDLE;
					_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYER_STATE, {
						oldstate: oldstate,
						newstate: jwplayer.api.events.state.IDLE
					});
				}
				_play();
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		function _getShuffleItem() {
			var result = null;
			if (_model.playlist.length > 1) {
				while (!_utils.exists(result)) {
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
		
		/** Stop playback and loading of the video. **/
		function _item(item) {
			if (!_model.playlist || !_model.playlist[item]) {
				return false;
			}
			
			try {
				if (_model.playlist[item].levels[0].file.length > 0) {
					var oldstate = _model.state;
					if (oldstate !== jwplayer.api.events.state.IDLE) {
						if (_model.playlist[_model.item] && _model.playlist[_model.item].provider == _model.playlist[item].provider) {
							_stop(false);
						} else {
							_stop();
						}
					}
					_loadItem(item);
					_play();
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		function _loadItem(item) {
			if (!_model.playlist[item]) {
				return;
			}
			_model.setActiveMediaProvider(_model.playlist[item]);
			if (_model.item != item) {
				_model.item = item;
				_itemUpdated = true;
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM, {
					"index": item
				});
			}
		}
		
		/** Get / set the video's volume level. **/
		function _setVolume(volume) {
			try {
				_loadItem(_model.item);
				var media = _model.getMedia();
				switch (typeof(volume)) {
					case "number":
						media.volume(volume);
						break;
					case "string":
						media.volume(parseInt(volume, 10));
						break;
				}
				_model.setVolume(volume);
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Get / set the mute state of the player. **/
		function _setMute(state) {
			try {
				_loadItem(_model.item);
				var media = _model.getMedia();
				if (typeof state == "undefined") {
					media.mute(!_model.mute);
					_model.setMute(!_model.mute);
				} else {
					if (state.toString().toLowerCase() == "true") {
						media.mute(true);
						_model.setMute(true);
					} else {
						media.mute(false);
						_model.setMute(false);
					}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Resizes the video **/
		function _resize(width, height) {
			try {
				_model.width = width;
				_model.height = height;
				_view.resize(width, height);
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_RESIZE, {
					"width": _model.width,
					"height": _model.height
				});
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Jumping the player to/from fullscreen. **/
		function _setFullscreen(state, forwardEvent) {
			try {
				if (typeof state == "undefined") {
					state = !_model.fullscreen;
				} 
				if (typeof forwardEvent == "undefined") {
					forwardEvent = true;
				} 
				
				if (state != _model.fullscreen) {
					_model.fullscreen = (state.toString().toLowerCase() == "true");	
					_view.fullscreen(_model.fullscreen);
					if (forwardEvent) {
						_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_FULLSCREEN, {
							fullscreen: _model.fullscreen
						});
					}
					_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_RESIZE, {
						"width": _model.width,
						"height": _model.height
					});
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		/** Loads a new video **/
		function _load(arg) {
			try {
				_stop();
				if (_preplay) {
					// stop() during preplay sets interruptPlay -- we don't want to do this.
					_interruptPlay = false;
				}
				_model.loadPlaylist(arg);
				if (_model.playlist[_model.item].provider) {
					_loadItem(_model.item);
					if (_model.config.autostart.toString().toLowerCase() == "true" && !_utils.isIOS() && !_preplay) {
						_play();
					}
					return true;
				} else {
					return false;
				}
			} catch (err) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, err);
			}
			return false;
		}
		
		
		function _playlistLoadHandler(evt) {
			if (!_utils.isIOS()) {
				_loadItem(_model.item);
				if (_model.config.autostart.toString().toLowerCase() == "true" && !_utils.isIOS()) {
					_play();
				}
			}
		}
		
		function _fullscreenHandler(evt) {
			_setFullscreen(evt.fullscreen, false);
		}
		
		function _detachMedia() {
			try {
				return _model.getMedia().detachMedia();
			} catch (err) {
				return null;
			}
		}

		function _attachMedia() {
			try {
				var ret = _model.getMedia().attachMedia();
				if (typeof _actionOnAttach == "function") {
					_actionOnAttach();
				}
			} catch (err) {
				return null;
			}
		}

		jwplayer.html5.controller.repeatoptions = {
			LIST: "LIST",
			ALWAYS: "ALWAYS",
			SINGLE: "SINGLE",
			NONE: "NONE"
		};
		
		function _completeHandler() {
			if (_model.state != jwplayer.api.events.state.IDLE) {
				// Something has made an API call before the complete handler has fired.
				return;
			}
			_actionOnAttach = _completeHandler;
			switch (_model.config.repeat.toUpperCase()) {
				case jwplayer.html5.controller.repeatoptions.SINGLE:
					_play();
					break;
				case jwplayer.html5.controller.repeatoptions.ALWAYS:
					if (_model.item == _model.playlist.length - 1 && !_model.config.shuffle) {
						_item(0);
					} else {
						_next();
					}
					break;
				case jwplayer.html5.controller.repeatoptions.LIST:
					if (_model.item == _model.playlist.length - 1 && !_model.config.shuffle) {
						_stop();
						_loadItem(0);
					} else {
						_next();
					}
					break;
				default:
					_stop();
					break;
			}
		}
		
		var _queuedCalls = [];
		
		function _waitForReady(func) {
			return function() {
				if (_ready) {
					_callMethod(func, arguments);
				} else {
					_queuedCalls.push({ method: func, arguments: arguments});
				}
			}
		}

		function _callMethod(func, args) {
			var _args = [];
			for (i=0; i < args.length; i++) {
				_args.push(args[i]);
			}
			func.apply(this, _args);
		}
		
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_setVolume);
		this.setMute = _waitForReady(_setMute);
		this.resize = _waitForReady(_resize);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.load = _waitForReady(_load);
		this.playerReady = _playerReady;
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.beforePlay = function() { 
			return _preplay; 
		}
	};
})(jwplayer);
