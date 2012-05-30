/**
 * InStream API 
 * 
 * @author Pablo
 * @version 5.9
 */
(function(jwplayer) {
	
	jwplayer.api.instream = function(api, player, item, options) {
		
		var _api = api;
		var _player = player;
		var _item = item;
		var _options = options;
		var _listeners = {};
		var _stateListeners = {};
		
		function _init() {
		   	_api.callInternal("jwLoadInstream", item, options);
		}
		
		function _addInternalListener(player, type) {
			_player.jwInstreamAddEventListener(type, 'function(dat) { jwplayer("' + _api.id + '").dispatchInstreamEvent("' + type + '", dat); }');
		};

		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				_addInternalListener(_player, type);
			}
			_listeners[type].push(callback);
			return this;
		};

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return this;
		};

		function _stateCallback(state) {
			return function(args) {
				var newstate = args.newstate, oldstate = args.oldstate;
				if (newstate == state) {
					var callbacks = _stateListeners[newstate];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, {
									oldstate: oldstate,
									newstate: newstate,
									type: args.type
								});
							}
						}
					}
				}
			};
		}		
		this.dispatchEvent = function(type, calledArguments) {
			if (_listeners[type]) {
				var args = _utils.translateEventResponse(type, calledArguments[1]);
				for (var l = 0; l < _listeners[type].length; l++) {
					if (typeof _listeners[type][l] == 'function') {
						_listeners[type][l].call(this, args);
					}
				}
			}
		}
		
		
		this.onError = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_ERROR, callback);
		};
		this.onFullscreen = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_FULLSCREEN, callback);
		};
		this.onMeta = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_META, callback);
		};
		this.onMute = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_MUTE, callback);
		};
		this.onComplete = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_COMPLETE, callback);
		};
		this.onSeek = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_SEEK, callback);
		};
		this.onTime = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_TIME, callback);
		};
		this.onVolume = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_MEDIA_VOLUME, callback);
		};
		// State events
		this.onBuffer = function(callback) {
			return _stateListener(jwplayer.api.events.state.BUFFERING, callback);
		};
		this.onPause = function(callback) {
			return _stateListener(jwplayer.api.events.state.PAUSED, callback);
		};
		this.onPlay = function(callback) {
			return _stateListener(jwplayer.api.events.state.PLAYING, callback);
		};
		this.onIdle = function(callback) {
			return _stateListener(jwplayer.api.events.state.IDLE, callback);
		};
		// Instream events
		this.onInstreamClick = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_INSTREAM_CLICK, callback);
		};
		this.onInstreamDestroyed = function(callback) {
			return _eventListener(jwplayer.api.events.JWPLAYER_INSTREAM_DESTROYED, callback);
		};
		
		this.play = function(state) {
			_player.jwInstreamPlay(state);
		};
		this.pause= function(state) {
			_player.jwInstreamPause(state);
		};
		this.seek = function(pos) {
			_player.jwInstreamSeek(pos);
		};
		this.destroy = function() {
			_player.jwInstreamDestroy();
		};
		this.getState = function() {
			return _player.jwInstreamGetState();
		}
		this.getDuration = function() {
			return _player.jwInstreamGetDuration();
		}
		this.getPosition = function() {
			return _player.jwInstreamGetPosition();
		}

		_init();
		
		
	}
	
})(jwplayer);

