/**
 * JW Player YouTube Media component
 *
 * @author pablo
 * @version 5.8
 */
(function(jwplayer) {

	var _states = {
		"ended": jwplayer.api.events.state.IDLE,
		"playing": jwplayer.api.events.state.PLAYING,
		"pause": jwplayer.api.events.state.PAUSED,
		"buffering": jwplayer.api.events.state.BUFFERING
	};
	
	var _css = jwplayer.utils.css;
	
	jwplayer.html5.mediayoutube = function(model, container) {
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		var _model = model;
		var _container = document.getElementById(container.id);
		var _state = jwplayer.api.events.state.IDLE;
		var _object, _embed;
		
		function _setState(newstate) {
			if (_state != newstate) {
				var oldstate = _state;
				_model.state = newstate;
				_state = newstate;
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYER_STATE, {
					oldstate: oldstate,
					newstate: newstate
				});
			}
		}
		
		this.getDisplayElement = this.detachMedia = function() {
			return _container;
		};
		
		/** This API is only useful for the mediavideo class **/
		this.attachMedia = function() {};
		
		this.play = function() {
			if (_state == jwplayer.api.events.state.IDLE) {
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: 100
				});
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_BUFFER_FULL);
				_setState(jwplayer.api.events.state.PLAYING);
			} else if (_state == jwplayer.api.events.state.PAUSED) {
				_setState(jwplayer.api.events.state.PLAYING);
			}
		};
		
		
		/** Switch the pause state of the player. **/
		this.pause = function() {
			_setState(jwplayer.api.events.state.PAUSED);
		};
		
		
		/** Seek to a position in the video. **/
		this.seek = function(position) {
		};
		
		
		/** Stop playback and loading of the video. **/
		this.stop = function(clear) {
			if (!_utils.exists(clear)) {
				clear = true;
			}
			_model.position = 0;
			_setState(jwplayer.api.events.state.IDLE);
			if (clear) {
				_css(_container, { display: "none" });
			}
		}
		
		/** Change the video's volume level. **/
		this.volume = function(position) {
			_model.setVolume(position);
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(position)
			});
		};
		
		
		/** Switch the mute state of the player. **/
		this.mute = function(state) {
			_container.muted = state;
//			_model.setMute(state);
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_MUTE, {
				mute: state
			});
		};
		
		
		/** Resize the player. **/
		this.resize = function(width, height) {
			if (width * height > 0 && _object) {
				_object.width = _embed.width = width;
				_object.height = _embed.height = height;
			}
//			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_RESIZE, {
//				fullscreen: _model.fullscreen,
//				width: width,
//				height: height
//			});
		};
		
		
		/** Switch the fullscreen state of the player. **/
		this.fullscreen = function(state) {
			if (state === true) {
				this.resize("100%", "100%");
			} else {
				this.resize(_model.config.width, _model.config.height);
			}
		};
		
		
		/** Load a new video into the player. **/
		this.load = function(playlistItem) {
			_embedItem(playlistItem);
			_css(_object, { display: "block" });
			_setState(jwplayer.api.events.state.BUFFERING);
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_BUFFER, {
				bufferPercent: 0
			});
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_MEDIA_LOADED);
			this.play();
		};
		
		this.hasChrome = function() {
			return (_state != jwplayer.api.events.state.IDLE);
		};
		
		function _embedItem(playlistItem) {
			var path = playlistItem.levels[0].file;
			path = ["http://www.youtube.com/v/", _getYouTubeID(path), "&amp;hl=en_US&amp;fs=1&autoplay=1"].join("");

			_object = document.createElement("object");
			_object.id = _container.id;
			_object.style.position = "absolute";

			var objectParams = {
				movie: path,
				allowfullscreen: "true",
				allowscriptaccess: "always"
			};
			
			for (var objectParam in objectParams) {
				var param = document.createElement("param");
				param.name = objectParam;
				param.value = objectParams[objectParam];
				_object.appendChild(param);
			}

			_embed = document.createElement("embed");
			_object.appendChild(_embed);
			
			var embedParams = {
				src: path,
				type: "application/x-shockwave-flash",
				allowfullscreen: "true",
				allowscriptaccess: "always",
				width: _object.width,
				height: _object.height
			};
			for (var embedParam in embedParams) {
				_embed.setAttribute(embedParam, embedParams[embedParam]);
			}
			_object.appendChild(_embed);
			_object.style.zIndex = 2147483000;

			if (_container != _object && _container.parentNode) {
				_container.parentNode.replaceChild(_object, _container);
			}
			_container = _object;
			
		}
		
		/** Extract the current ID from a youtube URL.  Supported values include:
		 * http://www.youtube.com/watch?v=ylLzyHk54Z0
		 * http://www.youtube.com/watch#!v=ylLzyHk54Z0
		 * http://www.youtube.com/v/ylLzyHk54Z0
		 * http://youtu.be/ylLzyHk54Z0
		 * ylLzyHk54Z0
		 **/
		function _getYouTubeID(url) {
			var arr = url.split(/\?|\#\!/);
			var str = '';
			for (var i=0; i<arr.length; i++) {
				if (arr[i].substr(0, 2) == 'v=') {
					str = arr[i].substr(2);
				}
			}
			if (str == '') {
				if (url.indexOf('/v/') >= 0) {
					str = url.substr(url.indexOf('/v/') + 3);
				} else if (url.indexOf('youtu.be') >= 0) {
					str = url.substr(url.indexOf('youtu.be/') + 9);
				} else {
					str = url;
				}
			}
			if (str.indexOf('?') > -1) {
				str = str.substr(0, str.indexOf('?'));
			}
			if (str.indexOf('&') > -1) {
				str = str.substr(0, str.indexOf('&'));
			}
			
			return str;
		}
		
		this.embed = _embed;
		
		return this;
	};
})(jwplayer);
