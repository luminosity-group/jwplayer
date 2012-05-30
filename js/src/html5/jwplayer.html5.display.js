/**
 * JW Player display component
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	_utils = jwplayer.utils;
	_css = _utils.css;
	
	_hide = function(element) {
		_css(element, {
			display: "none"
		});
	};
	
	_show = function(element) {
		_css(element, {
			display: "block"
		});
	};
	
	jwplayer.html5.display = function(api, config) {
		var _defaults = {
			icons: true,
			showmute: false
		}
		var _config = _utils.extend({}, _defaults, config);
		var _api = api;
		var _display = {};
		var _width;
		var _height;
		var _imageWidth;
		var _imageHeight;
		var _degreesRotated;
		var _rotationInterval;
		var _error;
		var _bufferRotation = !_utils.exists(_api.skin.getComponentSettings("display").bufferrotation) ? 15 : parseInt(_api.skin.getComponentSettings("display").bufferrotation, 10);
		var _bufferInterval = !_utils.exists(_api.skin.getComponentSettings("display").bufferinterval) ? 100 : parseInt(_api.skin.getComponentSettings("display").bufferinterval, 10);
		var _updateTimeout = -1;
		var _lastState = jwplayer.api.events.state.IDLE;
		var _showing = true;
		var _lastSent;
		var _imageLoading = false, _imageShowing = true;
		var _currentImage = "";
		var _hiding = false;
		var _ready = false;
		var _alternateClickHandler;
		var _normalscreenWidth, _normalscreenHeight;
		
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		_utils.extend(this, _eventDispatcher);
		
		var _elements = {
			display: {
				style: {
					cursor: "pointer",
					top: 0,
					left: 0,
					overflow: "hidden"
				},
				click: _displayClickHandler
			},
			display_icon: {
				style: {
					cursor: "pointer",
					position: "absolute",
					top: ((_api.skin.getSkinElement("display", "background").height - _api.skin.getSkinElement("display", "playIcon").height) / 2),
					left: ((_api.skin.getSkinElement("display", "background").width - _api.skin.getSkinElement("display", "playIcon").width) / 2),
					border: 0,
					margin: 0,
					padding: 0,
					zIndex: 3,
					display: "none"
				}
			},
			display_iconBackground: {
				style: {
					cursor: "pointer",
					position: "absolute",
					top: ((_height - _api.skin.getSkinElement("display", "background").height) / 2),
					left: ((_width - _api.skin.getSkinElement("display", "background").width) / 2),
					border: 0,
					backgroundImage: (["url(", _api.skin.getSkinElement("display", "background").src, ")"]).join(""),
					width: _api.skin.getSkinElement("display", "background").width,
					height: _api.skin.getSkinElement("display", "background").height,
					margin: 0,
					padding: 0,
					zIndex: 2,
					display: "none"
				}
			},
			display_image: {
				style: {
					display: "none",
					width: _width,
					height: _height,
					position: "absolute",
					cursor: "pointer",
					left: 0,
					top: 0,
					margin: 0,
					padding: 0,
					textDecoration: "none",
					zIndex: 1
				}
			},
			display_text: {
				style: {
					zIndex: 4,
					position: "relative",
					opacity: 0.8,
					backgroundColor: parseInt("000000", 16),
					color: parseInt("ffffff", 16),
					textAlign: "center",
					fontFamily: "Arial,sans-serif",
					padding: "0 5px",
					fontSize: 14
				}
			}
		};
		_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
		_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_MUTE, _stateHandler);
		_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, _playlistLoadHandler);
		_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM, _stateHandler);
		_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_ERROR, _errorHandler);
		_setupDisplay();
		
		function _setupDisplay() {
			_display.display = createElement("div", "display");
			_display.display_text = createElement("div", "display_text");
			_display.display.appendChild(_display.display_text);
			_display.display_image = createElement("img", "display_image");
			_display.display_image.onerror = function(evt) {
				_hide(_display.display_image);
			};
			_display.display_image.onload = _onImageLoad;
			_display.display_icon = createElement("div", "display_icon");
			_display.display_iconBackground = createElement("div", "display_iconBackground");
			_display.display.appendChild(_display.display_image);
			_display.display_iconBackground.appendChild(_display.display_icon);
			_display.display.appendChild(_display.display_iconBackground);
			_setupDisplayElements();
			
			setTimeout((function() {
				_ready = true;
				if (_config.icons.toString() == "true") {
					_sendShow();
				}
			}), 1);
		}
		
		
		this.getDisplayElement = function() {
			return _display.display;
		};
		
		this.resize = function(width, height) {
			if (_api.jwGetFullscreen() && _utils.isMobile()) {
				//No need to resize components; handled by the device
				return;
			}
			
			_css(_display.display, {
				width: width,
				height: height
			});
			_css(_display.display_text, {
				width: (width - 10),
				top: ((height - _utils.getBoundingClientRect(_display.display_text).height) / 2)
			});
			_css(_display.display_iconBackground, {
				top: ((height - _api.skin.getSkinElement("display", "background").height) / 2),
				left: ((width - _api.skin.getSkinElement("display", "background").width) / 2)
			});
			if (_width != width || _height != height) {
				_width = width;
				_height = height;
				_lastSent = undefined;
				_sendShow();
			}
			if (!_api.jwGetFullscreen()) {
				_normalscreenWidth = width;
				_normalscreenHeight = height;
			}
			_stretch();
			_stateHandler({});
		};
		
		this.show = function() {
			if (_hiding) {
				_hiding = false;
				_updateDisplay(_api.jwGetState());
			}
		}

		this.hide = function() {
			if (!_hiding) {
				_hideDisplayIcon();
				_hiding = true;
			}
		}

		function _onImageLoad(evt) {
			_imageWidth = _display.display_image.naturalWidth;
			_imageHeight = _display.display_image.naturalHeight;
			_stretch();
			if (_api.jwGetState() == jwplayer.api.events.state.IDLE) {
				_css(_display.display_image, {
					display: "block",
					opacity: 0
				});
				_utils.fadeTo(_display.display_image, 1, 0.1);
			}
			_imageLoading = false;
		}
		
		function _stretch() {
			if (_api.jwGetFullscreen() && _api.jwGetStretching() == jwplayer.utils.stretching.EXACTFIT) {
				var tmp = document.createElement("div");
				_utils.stretch(jwplayer.utils.stretching.UNIFORM, tmp, _width, _height, _normalscreenWidth, _normalscreenHeight);
				
				_utils.stretch(jwplayer.utils.stretching.EXACTFIT, _display.display_image, 
						_utils.parseDimension(tmp.style.width), _utils.parseDimension(tmp.style.height),
						_imageWidth, _imageHeight);
				
				_css(_display.display_image, {
					left: tmp.style.left,
					top: tmp.style.top
				});
			} else {
				_utils.stretch(_api.jwGetStretching(), _display.display_image, _width, _height, _imageWidth, _imageHeight);
			}
		};
		
		function createElement(tag, element) {
			var _element = document.createElement(tag);
			_element.id = _api.id + "_jwplayer_" + element;
			_css(_element, _elements[element].style);
			return _element;
		}
		
		
		function _setupDisplayElements() {
			for (var element in _display) {
				if (_utils.exists(_elements[element].click)) {
					_display[element].onclick = _elements[element].click;
				}
			}
		}
		
		
		function _displayClickHandler(evt) {
			if (typeof evt.preventDefault != "undefined") {
				evt.preventDefault(); // W3C
			} else {
				evt.returnValue = false; // IE
			}
			if (typeof _alternateClickHandler == "function") {
				_alternateClickHandler(evt);
				return;
			} else {
				if (_api.jwGetState() != jwplayer.api.events.state.PLAYING) {
					_api.jwPlay();
				} else {
					_api.jwPause();
				}
			}
		}
		
		
		function _setDisplayIcon(newIcon) {
			if (_error) {
				_hideDisplayIcon();
				return;
			}
			_display.display_icon.style.backgroundImage = (["url(", _api.skin.getSkinElement("display", newIcon).src, ")"]).join("");
			_css(_display.display_icon, {
				width: _api.skin.getSkinElement("display", newIcon).width,
				height: _api.skin.getSkinElement("display", newIcon).height,
				top: (_api.skin.getSkinElement("display", "background").height - _api.skin.getSkinElement("display", newIcon).height) / 2,
				left: (_api.skin.getSkinElement("display", "background").width - _api.skin.getSkinElement("display", newIcon).width) / 2
			});
			_showDisplayIcon();
			if (_utils.exists(_api.skin.getSkinElement("display", newIcon + "Over"))) {
				_display.display_icon.onmouseover = function(evt) {
					_display.display_icon.style.backgroundImage = ["url(", _api.skin.getSkinElement("display", newIcon + "Over").src, ")"].join("");
				};
				_display.display_icon.onmouseout = function(evt) {
					_display.display_icon.style.backgroundImage = ["url(", _api.skin.getSkinElement("display", newIcon).src, ")"].join("");
				};
			} else {
				_display.display_icon.onmouseover = null;
				_display.display_icon.onmouseout = null;
			}
		}
		
		function _hideDisplayIcon() {
			if (_config.icons.toString() == "true") {
				_hide(_display.display_icon);
				_hide(_display.display_iconBackground);
				_sendHide();
			}
		}

		function _showDisplayIcon() {
			if (!_hiding && _config.icons.toString() == "true") {
				_show(_display.display_icon);
				_show(_display.display_iconBackground);
				_sendShow();
			}
		}

		function _errorHandler(evt) {
			_error = true;
			_hideDisplayIcon();
			_display.display_text.innerHTML = evt.message;
			_show(_display.display_text);
			_display.display_text.style.top = ((_height - _utils.getBoundingClientRect(_display.display_text).height) / 2) + "px";
		}
		
		function _resetPoster() {
			_imageShowing = false;
			_display.display_image.style.display = "none";
		}
		
		function _playlistLoadHandler() {
			// We're going to force a refresh once we get the playlist item event.
			_lastState = "";
		}
		
		function _stateHandler(evt) {
			if ((evt.type == jwplayer.api.events.JWPLAYER_PLAYER_STATE ||
					evt.type == jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM) &&
					_error) {
				_error = false;
				_hide(_display.display_text);
			}
			
			var state = _api.jwGetState();
			if (state == _lastState) {
				return;
			}

			_lastState = state;

			if (_updateTimeout >= 0) {
				clearTimeout(_updateTimeout);
			}

			if (_showing || _api.jwGetState() == jwplayer.api.events.state.PLAYING || _api.jwGetState() == jwplayer.api.events.state.PAUSED) {
				_updateDisplay(_api.jwGetState());
			} else {
				_updateTimeout = setTimeout(_stateCallback(_api.jwGetState()), 500);
			}
		}
		
		function _stateCallback(state) {
			return (function() {
				_updateDisplay(state);
			});
		}
		
		
		function _updateDisplay(state) {
			if (_utils.exists(_rotationInterval)) {
				clearInterval(_rotationInterval);
				_rotationInterval = null;
				_utils.animations.rotate(_display.display_icon, 0);
			}
			switch (state) {
				case jwplayer.api.events.state.BUFFERING:
					if (_utils.isIPod()) {
						_resetPoster();
						_hideDisplayIcon();
					} else {
						if (_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].provider == "sound") {
							_showImage();
						}
						_degreesRotated = 0;
						_rotationInterval = setInterval(function() {
							_degreesRotated += _bufferRotation;
							_utils.animations.rotate(_display.display_icon, _degreesRotated % 360);
						}, _bufferInterval);
						_setDisplayIcon("bufferIcon");
						_showing = true;
					}
					break;
				case jwplayer.api.events.state.PAUSED:
					if (!_utils.isIPod()) {
						if (_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].provider != "sound") {
							_css(_display.display_image, {
								background: "transparent no-repeat center center"
							});
						}
						_setDisplayIcon("playIcon");
						_showing = true;
					}
					break;
				case jwplayer.api.events.state.IDLE:
					if (_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()] && _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].image) {
						_showImage();
					} else {
						_resetPoster();
					}
					_setDisplayIcon("playIcon");
					_showing = true;
					break;
				default:
					if (_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()] && _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].provider == "sound") {
						if (_utils.isIPod()) {
							_resetPoster();
							_showing = false;
						} else {
							_showImage();
						}
					} else {
						_resetPoster();
						_showing = false;
					}
					if (_api.jwGetMute() && _config.showmute) {
						_setDisplayIcon("muteIcon");
					} else {
						_hideDisplayIcon();
					}
					break;
			}
			_updateTimeout = -1;
		}
		
		function _showImage() {
			if (_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()]) {
				var newsrc = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].image;
				if (newsrc) {
					if (newsrc != _currentImage) {
						_currentImage = newsrc;
						_imageLoading = true;
						_display.display_image.src = _utils.getAbsolutePath(newsrc);
					} else if (!(_imageLoading || _imageShowing)) {
						_imageShowing = true;
						_display.display_image.style.opacity = 0;
						_display.display_image.style.display = "block";
						_utils.fadeTo(_display.display_image, 1, 0.1);
					}
					
				}
			}
		}
		
		
		function _sendVisibilityEvent(eventType) {
			return function() {
				if (!_ready) return;
					
				if (!_hiding && _lastSent != eventType) {
					_lastSent = eventType;
					_eventDispatcher.sendEvent(eventType, {
						component: "display",
						boundingRect: _utils.getDimensions(_display.display_iconBackground)
					});
				}
			}
		}

		var _sendShow = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_SHOW);
		var _sendHide = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_HIDE);

		/** NOT SUPPORTED : Using this for now to hack around instream API **/
		this.setAlternateClickHandler = function(handler) {
			_alternateClickHandler = handler;
		}
		this.revertAlternateClickHandler = function() {
			_alternateClickHandler = undefined;
		}
		
		return this;
	};
	
	
	
})(jwplayer);
