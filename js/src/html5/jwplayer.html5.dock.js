/**
 * JW Player dock component
 */
(function(jwplayer) {
	var _utils = jwplayer.utils;
	var _css = _utils.css; 
	
	jwplayer.html5.dock = function(api, config) {
		function _defaults() {
			return {
				align: jwplayer.html5.view.positions.RIGHT
			};
		};
		
		var _config = _utils.extend({}, _defaults(), config);
		
		if (_config.align == "FALSE") {
			return;
		}
		var _buttons = {};
		var _buttonArray = [];
		var _width;
		var _height;
		var _hiding = false;
		var _fullscreen = false;
		var _dimensions = { x: 0, y: 0, width: 0, height: 0 };
		var _lastSent;
		var _root;
		var _fadeTimeout;
		
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		_utils.extend(this, _eventDispatcher);
		
		var _dock = document.createElement("div");
		_dock.id = api.id + "_jwplayer_dock";
		_dock.style.opacity = 1;
		
		_setMouseListeners();
		
		api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
		
		this.getDisplayElement = function() {
			return _dock;
		};
		
		this.setButton = function(id, handler, outGraphic, overGraphic) {
			if (!handler && _buttons[id]) {
				_utils.arrays.remove(_buttonArray, id);
				_dock.removeChild(_buttons[id].div);
				delete _buttons[id];
			} else if (handler) {
				if (!_buttons[id]) {
					_buttons[id] = {
					}
				}
				_buttons[id].handler = handler;
				_buttons[id].outGraphic = outGraphic;
				_buttons[id].overGraphic = overGraphic;
				if (!_buttons[id].div) {
					_buttonArray.push(id);
					_buttons[id].div = document.createElement("div");
					_buttons[id].div.style.position = "absolute";
					_dock.appendChild(_buttons[id].div);
					
					_buttons[id].div.appendChild(document.createElement("div"));
					_buttons[id].div.childNodes[0].style.position = "relative";
					_buttons[id].div.childNodes[0].style.width = "100%";
					_buttons[id].div.childNodes[0].style.height = "100%";
					_buttons[id].div.childNodes[0].style.zIndex = 10;
					_buttons[id].div.childNodes[0].style.cursor = "pointer";
					
					_buttons[id].div.appendChild(document.createElement("img"));
					_buttons[id].div.childNodes[1].style.position = "absolute";
					_buttons[id].div.childNodes[1].style.left = 0;
					_buttons[id].div.childNodes[1].style.top = 0;
					if (api.skin.getSkinElement("dock", "button")) {
						_buttons[id].div.childNodes[1].src = api.skin.getSkinElement("dock", "button").src;
					}
					_buttons[id].div.childNodes[1].style.zIndex = 9;
					_buttons[id].div.childNodes[1].style.cursor = "pointer";
					
					_buttons[id].div.onmouseover = function() {
						if (_buttons[id].overGraphic) {
							_buttons[id].div.childNodes[0].style.background = _bgStyle(_buttons[id].overGraphic);
						}
						if (api.skin.getSkinElement("dock", "buttonOver")) {
							_buttons[id].div.childNodes[1].src = api.skin.getSkinElement("dock", "buttonOver").src;
						}
					}
					
					_buttons[id].div.onmouseout = function() {
						if (_buttons[id].outGraphic) {
							_buttons[id].div.childNodes[0].style.background = _bgStyle(_buttons[id].outGraphic);
						}
						if (api.skin.getSkinElement("dock", "button")) {
							_buttons[id].div.childNodes[1].src = api.skin.getSkinElement("dock", "button").src;
						}
					}
					// Make sure that this gets loaded and is cached so that rollovers are smooth
					if (api.skin.getSkinElement("dock", "button")) {
						_buttons[id].div.childNodes[1].src = api.skin.getSkinElement("dock", "button").src;
					}
				}


				if (_buttons[id].outGraphic) {
					_buttons[id].div.childNodes[0].style.background = _bgStyle(_buttons[id].outGraphic);
				} else if (_buttons[id].overGraphic) {
					_buttons[id].div.childNodes[0].style.background = _bgStyle(_buttons[id].overGraphic);
				}

				if (handler) {
					_buttons[id].div.onclick = function(evt) {
						evt.preventDefault();
						jwplayer(api.id).callback(id);
						if (_buttons[id].overGraphic) {
							_buttons[id].div.childNodes[0].style.background = _bgStyle(_buttons[id].overGraphic);
						}
						if (api.skin.getSkinElement("dock", "button")) {
							_buttons[id].div.childNodes[1].src = api.skin.getSkinElement("dock", "button").src;
						}
					}
				}
			}
			
			_resize(_width, _height);
		}
		
		function _bgStyle(url) {
			return "url("+ url + ") no-repeat center center" 
		}
		
		function _onImageLoad(evt) {
			
		}
		
		function _resize(width, height) {
			_setMouseListeners();
			
			if (_buttonArray.length > 0) {
				var margin = 10;
				var usedHeight = margin;
				var direction = -1;
				var buttonHeight = api.skin.getSkinElement("dock", "button").height;
				var buttonWidth = api.skin.getSkinElement("dock", "button").width;
				var xStart = width - buttonWidth - margin;
				var topLeft, bottomRight;
				if (_config.align == jwplayer.html5.view.positions.LEFT) {
					direction = 1;
					xStart = margin;
				}
				for (var i = 0; i < _buttonArray.length; i++) {
					var row = Math.floor(usedHeight / height);
					if ((usedHeight + buttonHeight + margin) > ((row + 1) * height)) {
						usedHeight = ((row + 1) * height) + margin;
						row = Math.floor(usedHeight / height);
					}
					var button = _buttons[_buttonArray[i]].div;
					button.style.top = (usedHeight % height) + "px";
					button.style.left = (xStart + (api.skin.getSkinElement("dock", "button").width + margin) * row * direction) + "px";
					var buttonDims = {
						x: _utils.parseDimension(button.style.left),
						y: _utils.parseDimension(button.style.top),
						width: buttonWidth,
						height: buttonHeight
					}
					if (!topLeft || (buttonDims.x <= topLeft.x && buttonDims.y <= topLeft.y))
						topLeft = buttonDims;
					if (!bottomRight || (buttonDims.x >= bottomRight.x && buttonDims.y >= bottomRight.y))
						bottomRight = buttonDims;
					
					button.style.width = buttonWidth + "px";
					button.style.height = buttonHeight + "px";
					
					usedHeight += api.skin.getSkinElement("dock", "button").height + margin;
				}
				_dimensions = {
					x: topLeft.x,
					y:  topLeft.y,
					width: bottomRight.x - topLeft.x + bottomRight.width,
					height: topLeft.y - bottomRight.y + bottomRight.height
				};
			}
			
			if (_fullscreen != api.jwGetFullscreen() || _width != width || _height != height) {
				_width = width;
				_height = height;
				_fullscreen = api.jwGetFullscreen();
				_lastSent = undefined;
				// Delay to allow resize event handlers to complete
				setTimeout(_sendShow, 1);
			}
			
		}
		
		function _sendVisibilityEvent(eventType) {
			return function() {
				if (!_hiding && _lastSent != eventType && _buttonArray.length > 0) {
					_lastSent = eventType;
					_eventDispatcher.sendEvent(eventType, {
						component: "dock",
						boundingRect: _dimensions
					});
				}
			}
		}
		
		function _stateHandler(event) {
			if (_utils.isMobile()) {
				if (event.newstate == jwplayer.api.events.state.IDLE) {
					_show();
				} else {
					_hide();
				}
			} else {
				_setVisibility();
			}
		}
		
		function _setVisibility(evt) {
			if (_hiding) { return; }
			clearTimeout(_fadeTimeout);
			if (config.position == jwplayer.html5.view.positions.OVER || api.jwGetFullscreen()) {
				switch(api.jwGetState()) {
				case jwplayer.api.events.state.PAUSED:
				case jwplayer.api.events.state.IDLE:
					if (_dock && _dock.style.opacity < 1 && (!config.idlehide || _utils.exists(evt))) {
						_fadeIn();
					}
					if (config.idlehide) {
						_fadeTimeout = setTimeout(function() {
							_fadeOut();
						}, 2000);
					}
					break;
				default:
					if (_utils.exists(evt)) {
						// Fade in on mouse move
						_fadeIn();
					}
					_fadeTimeout = setTimeout(function() {
						_fadeOut();
					}, 2000);
					break;
				}
			} else {
				_fadeIn();
			}
		}


		var _sendShow = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_SHOW);
		var _sendHide = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_HIDE);

		this.resize = _resize;
		
		var _show = function() {
			_css(_dock, {
				display: "block"
			});
			if (_hiding) {
				_hiding = false;
				_sendShow();
			}
		}

		var _hide = function() {
			_css(_dock, {
				display: "none"
			});
			if (!_hiding) {
				_sendHide();
				_hiding = true;
			}
			
		}
		
		function _fadeOut() {
			if (!_hiding) {
				_sendHide();
				if (_dock.style.opacity == 1) {
					_utils.cancelAnimation(_dock);
					_utils.fadeTo(_dock, 0, 0.1, 1, 0);
				}
			}
		}
		
		function _fadeIn() {
			if (!_hiding) {
				_sendShow();
				if (_dock.style.opacity == 0) {
					_utils.cancelAnimation(_dock);
					_utils.fadeTo(_dock, 1, 0.1, 0, 0);
				}
			}
		}
		
		function _setMouseListeners() {
			try {
				_root = document.getElementById(api.id);
				_root.addEventListener("mousemove", _setVisibility);
			} catch (e) {
				_utils.log("Could not add mouse listeners to dock: " + e);
			}
		}
				
		this.hide = _hide;
		this.show = _show;
		
		return this;
	}
})(jwplayer);
