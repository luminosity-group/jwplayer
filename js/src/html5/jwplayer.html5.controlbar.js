/**
 * jwplayer controlbar component of the JW Player.
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	/** Map with config for the jwplayerControlbar plugin. **/
	var _defaults = {
		backgroundcolor: "",
		margin: 10,
		font: "Arial,sans-serif",
		fontsize: 10,
		fontcolor: parseInt("000000", 16),
		fontstyle: "normal",
		fontweight: "bold",
		buttoncolor: parseInt("ffffff", 16),
		position: jwplayer.html5.view.positions.BOTTOM,
		idlehide: false,
		hideplaylistcontrols: false,
		forcenextprev: false,
		layout: {
			"left": {
				"position": "left",
				"elements": [{
					"name": "play",
					"type": "button"
				}, {
					"name": "divider",
					"type": "divider"
				}, {
					"name": "prev",
					"type": "button"
				}, {
					"name": "divider",
					"type": "divider"
				}, {
					"name": "next",
					"type": "button"
				}, {
					"name": "divider",
					"type": "divider"
				}, {
					"name": "elapsed",
					"type": "text"
				}]
			},
			"center": {
				"position": "center",
				"elements": [{
					"name": "time",
					"type": "slider"
				}]
			},
			"right": {
				"position": "right",
				"elements": [{
					"name": "duration",
					"type": "text"
				}, {
					"name": "blank",
					"type": "button"
				}, {
					"name": "divider",
					"type": "divider"
				}, {
					"name": "mute",
					"type": "button"
				}, {
					"name": "volume",
					"type": "slider"
				}, {
					"name": "divider",
					"type": "divider"
				}, {
					"name": "fullscreen",
					"type": "button"
				}]
			}
		}
	};
	
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
	
	jwplayer.html5.controlbar = function(api, config) {
		window.controlbar = this;
		var _api = api;
		var _settings = _utils.extend({}, _defaults, _api.skin.getComponentSettings("controlbar"), config);
		if (_settings.position == jwplayer.html5.view.positions.NONE
			|| typeof jwplayer.html5.view.positions[_settings.position] == "undefined") {
			return;
		}
		if (_utils.mapLength(_api.skin.getComponentLayout("controlbar")) > 0) {
			_settings.layout = _api.skin.getComponentLayout("controlbar");
		}
		var _wrapper;
		var _dividerid;
		var _marginleft;
		var _marginright;
		var _scrubber = "none";
		var _mousedown;
		var _currentPosition;
		var _currentDuration;
		var _currentBuffer;
		var _width;
		var _height;
		var _elements = {};
		var _ready = false;
		var _positions = {};
		var _bgElement;
		var _hiding = false;
		var _fadeTimeout;
		var _lastSent;
		var _eventReady = false;
		var _fullscreen = false;
		var _root;
		
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		_utils.extend(this, _eventDispatcher);
		
		function _getBack() {
			if (!_bgElement) {
				_bgElement = _api.skin.getSkinElement("controlbar", "background");
				if (!_bgElement) {
					_bgElement = {
					   width: 0, height: 0, src: null		
					}
				}
			}
			return _bgElement;
		}
		
		function _buildBase() {
			_marginleft = 0;
			_marginright = 0;
			_dividerid = 0;
			if (!_ready) {
				var wrappercss = {
					height: _getBack().height,
					backgroundColor: _settings.backgroundcolor
				};
				
				_wrapper = document.createElement("div");
				_wrapper.id = _api.id + "_jwplayer_controlbar";
				_css(_wrapper, wrappercss);
			}

			var capLeft = (_api.skin.getSkinElement("controlbar", "capLeft"));
			var capRight = (_api.skin.getSkinElement("controlbar", "capRight"));

			if (capLeft) {
				_addElement("capLeft", "left", false, _wrapper);
			}
			_appendNewElement("background", _wrapper, {
				position: "absolute",
				height: _getBack().height,
				left: (capLeft ? capLeft.width : 0),
				zIndex: 0
			}, "img");
			if (_getBack().src) {
				_elements.background.src = _getBack().src;
			}
			_appendNewElement("elements", _wrapper, {
				position: "relative",
				height: _getBack().height,
				zIndex: 1
			});
			if (capRight) {
				_addElement("capRight", "right", false, _wrapper);
			}
		}
		
		this.getDisplayElement = function() {
			return _wrapper;
		};
		
		this.resize = function(width, height) {
			_setMouseListeners();
			_utils.cancelAnimation(_wrapper);
			_width = width;
			_height = height;
			
			if (_fullscreen != _api.jwGetFullscreen()) {
				_fullscreen = _api.jwGetFullscreen();
				if (!_fullscreen) {
					_setVisibility();
				}
				_lastSent = undefined;
			}
			
			var style = _resizeBar();
			_timeHandler({
				id: _api.id,
				duration: _currentDuration,
				position: _currentPosition
			});
			_bufferHandler({
				id: _api.id,
				bufferPercent: _currentBuffer
			});
			return style;
		};
		
		this.show = function() {
			if (_hiding) {
				_hiding = false;
				_show(_wrapper);
				_sendShow();
			}
		}

		this.hide = function() {
			if (!_hiding) {
				_hiding = true;
				_hide(_wrapper);
				_sendHide();
			}
		}

		function _updatePositions() {
			var positionElements = ["timeSlider", "volumeSlider", "timeSliderRail", "volumeSliderRail"];
			for (var positionElement in positionElements) {
				var elementName = positionElements[positionElement];
				if (typeof _elements[elementName] != "undefined") {
					_positions[elementName] = _utils.getBoundingClientRect(_elements[elementName]);
				}
			}
		}
		
		var _cancelled;
		
		function _setVisibility(evt) {
			if (_hiding) { return; }
			clearTimeout(_fadeTimeout);
			if (_settings.position == jwplayer.html5.view.positions.OVER || _api.jwGetFullscreen()) {
				switch(_api.jwGetState()) {
				case jwplayer.api.events.state.PAUSED:
				case jwplayer.api.events.state.IDLE:
					if (_wrapper && _wrapper.style.opacity < 1 && (!_settings.idlehide || _utils.exists(evt))) {
						_cancelled = false;
						setTimeout(function() {
							if (!_cancelled) {
								_fadeIn();
							}
						}, 100);
					}
					if (_settings.idlehide) {
						_fadeTimeout = setTimeout(function() {
							_fadeOut();
						}, 2000);
					}
					break;
				default:
					_cancelled = true;
					if (evt) {
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
		
		function _fadeOut() {
			if (!_hiding) {
				_sendHide();
				if (_wrapper.style.opacity == 1) {
					_utils.cancelAnimation(_wrapper);
					_utils.fadeTo(_wrapper, 0, 0.1, 1, 0);
				}
			}
		}
		
		function _fadeIn() {
			if (!_hiding) {
				_sendShow();
				if (_wrapper.style.opacity == 0) {
					_utils.cancelAnimation(_wrapper);
					_utils.fadeTo(_wrapper, 1, 0.1, 0, 0);
				}
			}
		}
		
		function _sendVisibilityEvent(eventType) {
			return function() {
				if (_eventReady && _lastSent != eventType) {
					_lastSent = eventType;
					_eventDispatcher.sendEvent(eventType, {
						component: "controlbar",
						boundingRect: _getBoundingRect()
					});
				}
			}
		}

		var _sendShow = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_SHOW);
		var _sendHide = _sendVisibilityEvent(jwplayer.api.events.JWPLAYER_COMPONENT_HIDE);
		
		function _getBoundingRect() {
			if (_settings.position == jwplayer.html5.view.positions.OVER || _api.jwGetFullscreen()) {
				return _utils.getDimensions(_wrapper);
			} else {
				return { x: 0, y:0, width: 0, height: 0 };
			}
		}

		function _appendNewElement(id, parent, css, domelement) {
			var element;
			if (!_ready) {
				if (!domelement) {
					domelement = "div";
				}
				element = document.createElement(domelement);
				_elements[id] = element;
				element.id = _wrapper.id + "_" + id;
				parent.appendChild(element);
			} else {
				element = document.getElementById(_wrapper.id + "_" + id);
			}
			if (_utils.exists(css)) {
				_css(element, css);
			}
			return element;
		}
		
		/** Draw the jwplayerControlbar elements. **/
		function _buildElements() {
			if (_api.jwGetHeight() <= 40) {
				_settings.layout = _utils.clone(_settings.layout);
				for (var i=0; i < _settings.layout.left.elements.length; i++) {
					if (_settings.layout.left.elements[i].name == "fullscreen") {
						_settings.layout.left.elements.splice(i, 1);
					}
				}
				for (i=0; i < _settings.layout.right.elements.length; i++) {
					if (_settings.layout.right.elements[i].name == "fullscreen") {
						_settings.layout.right.elements.splice(i, 1);
					}
				}
				
				cleanupDividers();
			}
			
			_buildGroup(_settings.layout.left);
			_buildGroup(_settings.layout.center);
			_buildGroup(_settings.layout.right);
		}
		
		/** Layout a group of elements**/
		function _buildGroup(group, order) {
			var alignment = group.position == "right" ? "right" : "left";
			var elements = _utils.extend([], group.elements);
			if (_utils.exists(order)) {
				elements.reverse();
			}
		    var group = _appendNewElement(group.position+"Group", _elements.elements, {
				'float': 'left',
				styleFloat: 'left',
				cssFloat: 'left',
				height: '100%'
			});
			for (var i = 0; i < elements.length; i++) {
				_buildElement(elements[i], alignment, group);
			}
		}
		
		function getNewDividerId() {
			return _dividerid++;
		}
		
		/** Draw a single element into the jwplayerControlbar. **/
		function _buildElement(element, alignment, parent) {
			var offset, offsetLeft, offsetRight, width, slidercss;
			
			if (!parent) {
				parent = _elements.elements;
			}
			
			if (element.type == "divider") {
				_addElement("divider" + getNewDividerId(), alignment, true, parent, undefined, element.width, element.element);
				return;
			}
			
			switch (element.name) {
				case "play":
					_addElement("playButton", alignment, false, parent);
					_addElement("pauseButton", alignment, true, parent);
					_buildHandler("playButton", "jwPlay");
					_buildHandler("pauseButton", "jwPause");
					break;
				case "prev":
					_addElement("prevButton", alignment, true, parent);
					_buildHandler("prevButton", "jwPlaylistPrev");
					break;
				case "stop":
					_addElement("stopButton", alignment, true, parent);
					_buildHandler("stopButton", "jwStop");
					break;
				case "next":
					_addElement("nextButton", alignment, true, parent);
					_buildHandler("nextButton", "jwPlaylistNext");
					break;
				case "elapsed":
					_addElement("elapsedText", alignment, true, parent, null, null, _api.skin.getSkinElement("controlbar", "elapsedBackground"));
					break;
				case "time":
					offsetLeft = !_utils.exists(_api.skin.getSkinElement("controlbar", "timeSliderCapLeft")) ? 0 : _api.skin.getSkinElement("controlbar", "timeSliderCapLeft").width;
					offsetRight = !_utils.exists(_api.skin.getSkinElement("controlbar", "timeSliderCapRight")) ? 0 : _api.skin.getSkinElement("controlbar", "timeSliderCapRight").width;
					offset = alignment == "left" ? offsetLeft : offsetRight;
					slidercss = {
						height: _getBack().height,
						position: "relative",
						'float': 'left',
						styleFloat: 'left',
						cssFloat: 'left'
					};
					var _timeslider = _appendNewElement("timeSlider", parent, slidercss);
					_addElement("timeSliderCapLeft", alignment, true, _timeslider, "relative");
					_addElement("timeSliderRail", alignment, false, _timeslider, "relative");
					_addElement("timeSliderBuffer", alignment, false, _timeslider, "absolute");
					_addElement("timeSliderProgress", alignment, false, _timeslider, "absolute");
					_addElement("timeSliderThumb", alignment, false, _timeslider, "absolute");
					_addElement("timeSliderCapRight", alignment, true, _timeslider, "relative");
					_addSliderListener("time");
					break;
				case "fullscreen":
					_addElement("fullscreenButton", alignment, false, parent);
					_addElement("normalscreenButton", alignment, true, parent);
					_buildHandler("fullscreenButton", "jwSetFullscreen", true);
					_buildHandler("normalscreenButton", "jwSetFullscreen", false);
					break;
				case "volume":
					offsetLeft = !_utils.exists(_api.skin.getSkinElement("controlbar", "volumeSliderCapLeft")) ? 0 : _api.skin.getSkinElement("controlbar", "volumeSliderCapLeft").width;
					offsetRight = !_utils.exists(_api.skin.getSkinElement("controlbar", "volumeSliderCapRight")) ? 0 : _api.skin.getSkinElement("controlbar", "volumeSliderCapRight").width;
					offset = alignment == "left" ? offsetLeft : offsetRight;
					width = _api.skin.getSkinElement("controlbar", "volumeSliderRail").width + offsetLeft + offsetRight;
					slidercss = {
						height: _getBack().height,
						position: "relative",
						width: width,
						'float': 'left',
						styleFloat: 'left',
						cssFloat: 'left'
					};
					var _volumeslider = _appendNewElement("volumeSlider", parent, slidercss);
					_addElement("volumeSliderCapLeft", alignment, false, _volumeslider, "relative");
					_addElement("volumeSliderRail", alignment, false, _volumeslider, "relative");
					_addElement("volumeSliderProgress", alignment, false, _volumeslider, "absolute");
					_addElement("volumeSliderThumb", alignment, false, _volumeslider, "absolute");
					_addElement("volumeSliderCapRight", alignment, false, _volumeslider, "relative");
					_addSliderListener("volume");
					break;
				case "mute":
					_addElement("muteButton", alignment, false, parent);
					_addElement("unmuteButton", alignment, true, parent);
					_buildHandler("muteButton", "jwSetMute", true);
					_buildHandler("unmuteButton", "jwSetMute", false);
					
					break;
				case "duration":
					_addElement("durationText", alignment, true, parent, null, null, _api.skin.getSkinElement("controlbar", "durationBackground"));
					break;
			}
		}
		
		function _addElement(element, alignment, offset, parent, position, width, skinElement) {
			if (_utils.exists(_api.skin.getSkinElement("controlbar", element)) || element.indexOf("Text") > 0 || element.indexOf("divider") === 0)  {
				var css = {
					height: "100%",
					position: position ? position : "relative",
					display: "block",
					'float': "left",
					styleFloat: "left",
					cssFloat: "left"
				};
				if ((element.indexOf("next") === 0 || element.indexOf("prev") === 0) && (_api.jwGetPlaylist().length < 2 || _settings.hideplaylistcontrols.toString()=="true")) {
					if (_settings.forcenextprev.toString() != "true") {
						offset = false;
						css.display = "none";
					}
				}
				var wid;
				if (element.indexOf("Text") > 0) {
					element.innerhtml = "00:00";
					css.font = _settings.fontsize + "px/" + (_getBack().height + 1) + "px " + _settings.font;
					css.color = _settings.fontcolor;
					css.textAlign = "center";
					css.fontWeight = _settings.fontweight;
					css.fontStyle = _settings.fontstyle;
					css.cursor = "default";
					if (skinElement) {
						css.background = "url(" + skinElement.src + ") no-repeat center";
						css.backgroundSize = "100% " + _getBack().height + "px";
					}
					css.padding = "0 5px";
//					wid = 14 + 3 * _settings.fontsize;
				} else if (element.indexOf("divider") === 0) {
					if (width) {
						if (!isNaN(parseInt(width))) {
							wid = parseInt(width);
						}
					} else if (skinElement) {
						var altDivider = _api.skin.getSkinElement("controlbar", skinElement);
						if (altDivider) {
							css.background = "url(" + altDivider.src + ") repeat-x center left";
							wid = altDivider.width;
						}
					} else {
						css.background = "url(" + _api.skin.getSkinElement("controlbar", "divider").src + ") repeat-x center left";
						wid = _api.skin.getSkinElement("controlbar", "divider").width;	
					}
				} else {
					css.background = "url(" + _api.skin.getSkinElement("controlbar", element).src + ") repeat-x center left";
					wid = _api.skin.getSkinElement("controlbar", element).width;
				}
				if (alignment == "left") {
					if (offset) {
						_marginleft += wid;
					}
				} else if (alignment == "right") {
					if (offset) {
						_marginright += wid;
					}
				}
				
				
				if (_utils.typeOf(parent) == "undefined") {
					parent = _elements.elements;
				}
				
				css.width = wid;
				
				if (_ready) {
					_css(_elements[element], css);
				} else {
					var newelement = _appendNewElement(element, parent, css);
					if (_utils.exists(_api.skin.getSkinElement("controlbar", element + "Over"))) {
						newelement.onmouseover = function(evt) {
							newelement.style.backgroundImage = ["url(", _api.skin.getSkinElement("controlbar", element + "Over").src, ")"].join("");
						};
						newelement.onmouseout = function(evt) {
							newelement.style.backgroundImage = ["url(", _api.skin.getSkinElement("controlbar", element).src, ")"].join("");
						};
					}
					if (element.indexOf("divider") == 0) {
						newelement.setAttribute("class", "divider");
					}
					// Required for some browsers to display sized elements.
					newelement.innerHTML = "&nbsp;";
				}
			}
		}
		
		function _addListeners() {
			// Register events with the player.
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_TIME, _timeHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
		}
		
		function _playlistHandler() {
			if (!_settings.hideplaylistcontrols) {
				if (_api.jwGetPlaylist().length > 1 || _settings.forcenextprev.toString()=="true") {
					_show(_elements.nextButton);
					_show(_elements.prevButton);
				} else {
					_hide(_elements.nextButton);
					_hide(_elements.prevButton);
				}
			
				_resizeBar();
				_init();
			}
		}

		function _itemHandler(evt) {
			_currentDuration = _api.jwGetPlaylist()[evt.index].duration;
			_timeHandler({
				id: _api.id,
				duration: _currentDuration,
				position: 0
			});
			_bufferHandler({
				id: _api.id,
				bufferProgress: 0
			});
		}

		/** Add interactivity to the jwplayerControlbar elements. **/
		function _init() {
			// Trigger a few events so the bar looks good on startup.
			_timeHandler({
				id: _api.id,
				duration: _api.jwGetDuration(),
				position: 0
			});
			_bufferHandler({
				id: _api.id,
				bufferProgress: 0
			});
			_muteHandler({
				id: _api.id,
				mute: _api.jwGetMute()
			});
			_stateHandler({
				id: _api.id,
				newstate: jwplayer.api.events.state.IDLE
			});
			_volumeHandler({
				id: _api.id,
				volume: _api.jwGetVolume()
			});
		}
		
		
		/** Set a single button handler. **/
		function _buildHandler(element, handler, args) {
			if (_ready) {
				return;
			}
			if (_utils.exists(_api.skin.getSkinElement("controlbar", element))) {
				var _element = _elements[element];
				if (_utils.exists(_element)) {
					_css(_element, {
						cursor: "pointer"
					});
					if (handler == "fullscreen") {
						_element.onmouseup = function(evt) {
							evt.stopPropagation();
							_api.jwSetFullscreen(!_api.jwGetFullscreen());
						};
					} else {
						_element.onmouseup = function(evt) {
							evt.stopPropagation();
							if (_utils.exists(args)) {
								_api[handler](args);
							} else {
								_api[handler]();
							}
							
						};
					}
				}
			}
		}
		
		/** Set the volume drag handler. **/
		function _addSliderListener(name) {
			if (_ready) {
				return;
			}
			var bar = _elements[name + "Slider"];
			_css(_elements.elements, {
				"cursor": "pointer"
			});
			_css(bar, {
				"cursor": "pointer"
			});
			bar.onmousedown = function(evt) {
				_scrubber = name;
			};
			bar.onmouseup = function(evt) {
				evt.stopPropagation();
				_sliderUp(evt.pageX);
			};
			bar.onmousemove = function(evt) {
				if (_scrubber == "time") {
					_mousedown = true;
					var xps = evt.pageX - _positions[name + "Slider"].left - window.pageXOffset;
					_css(_elements[_scrubber + "SliderThumb"], {
						left: xps
					});
				}
			};
		}
		
		
		/** The slider has been moved up. **/
		function _sliderUp(msx) {
			_mousedown = false;
			var xps;
			if (_scrubber == "time") {
				xps = msx - _positions.timeSliderRail.left + window.pageXOffset;
				var pos = xps / _positions.timeSliderRail.width * _currentDuration;
				if (pos < 0) {
					pos = 0;
				} else if (pos > _currentDuration) {
					pos = _currentDuration - 3;
				}
				if (_api.jwGetState() == jwplayer.api.events.state.PAUSED || _api.jwGetState() == jwplayer.api.events.state.IDLE) {
					_api.jwPlay();
				}
				_api.jwSeek(pos);
			} else if (_scrubber == "volume") {
				xps = msx - _positions.volumeSliderRail.left - window.pageXOffset;
				var pct = Math.round(xps / _positions.volumeSliderRail.width * 100);
				if (pct < 10) {
					pct = 0;
				} else if (pct > 100) {
					pct = 100;
				}
				if (_api.jwGetMute()) {
					_api.jwSetMute(false);
				}
				_api.jwSetVolume(pct);
			}
			_scrubber = "none";
		}
		
		
		/** Update the buffer percentage. **/
		function _bufferHandler(event) {
			if (_utils.exists(event.bufferPercent)) {
				_currentBuffer = event.bufferPercent;
			}
			if (_positions.timeSliderRail) {
	            var timeSliderCapLeft = _api.skin.getSkinElement("controlbar", "timeSliderCapLeft"); 
				var wid = _positions.timeSliderRail.width;
				var bufferWidth = isNaN(Math.round(wid * _currentBuffer / 100)) ? 0 : Math.round(wid * _currentBuffer / 100);
				_css(_elements.timeSliderBuffer, {
					width: bufferWidth,
					left: timeSliderCapLeft ? timeSliderCapLeft.width : 0
				});
			}
		}
		
		
		/** Update the mute state. **/
		function _muteHandler(event) {
			if (event.mute) {
				_hide(_elements.muteButton);
				_show(_elements.unmuteButton);
				_hide(_elements.volumeSliderProgress);
			} else {
				_show(_elements.muteButton);
				_hide(_elements.unmuteButton);
				_show(_elements.volumeSliderProgress);
			}
		}
		
		
		/** Update the playback state. **/
		function _stateHandler(event) {
			// Handle the play / pause button
			if (event.newstate == jwplayer.api.events.state.BUFFERING || event.newstate == jwplayer.api.events.state.PLAYING) {
				_show(_elements.pauseButton);
				_hide(_elements.playButton);
			} else {
				_hide(_elements.pauseButton);
				_show(_elements.playButton);
			}
			
			_setVisibility();
			// Show / hide progress bar
			if (event.newstate == jwplayer.api.events.state.IDLE) {
				_hide(_elements.timeSliderBuffer);
				_hide(_elements.timeSliderProgress);
				_hide(_elements.timeSliderThumb);
				_timeHandler({
					id: _api.id,
					duration: _api.jwGetDuration(),
					position: 0
				});
			} else {
				_show(_elements.timeSliderBuffer);
				if (event.newstate != jwplayer.api.events.state.BUFFERING) {
					_show(_elements.timeSliderProgress);
					_show(_elements.timeSliderThumb);
				}
			}
		}
		
		
		/** Handles event completion **/
		function _completeHandler(event) {
			_bufferHandler({
				bufferPercent: 0
			});
			_timeHandler(_utils.extend(event, {
				position: 0,
				duration: _currentDuration
			}));
		}
		
		
		/** Update the playback time. **/
		function _timeHandler(event) {
			if (_utils.exists(event.position)) {
				_currentPosition = event.position;
			}
			var newDuration = false;
			if (_utils.exists(event.duration) && event.duration != _currentDuration) {
				_currentDuration = event.duration;
				newDuration = true;
			}
			var progress = (_currentPosition === _currentDuration === 0) ? 0 : _currentPosition / _currentDuration;
			var progressElement = _positions.timeSliderRail;
			if (progressElement) {
				var progressWidth = isNaN(Math.round(progressElement.width * progress)) ? 0 : Math.round(progressElement.width * progress);
	            var timeSliderCapLeft = _api.skin.getSkinElement("controlbar", "timeSliderCapLeft");
				var thumbPosition = progressWidth + (timeSliderCapLeft ? timeSliderCapLeft.width : 0);
				if (_elements.timeSliderProgress) {
					_css(_elements.timeSliderProgress, {
						width: progressWidth,
						left: timeSliderCapLeft ? timeSliderCapLeft.width : 0
					});
					if (!_mousedown) {
						if (_elements.timeSliderThumb) {
							_elements.timeSliderThumb.style.left = thumbPosition + "px";
						}
					}
				}
			}
			if (_elements.durationText) {
				_elements.durationText.innerHTML = _utils.timeFormat(_currentDuration);
			}
			if (_elements.elapsedText) {
				_elements.elapsedText.innerHTML = _utils.timeFormat(_currentPosition);
			}
			if (newDuration) {
				_resizeBar();
			}
		}
		
		
		function cleanupDividers() {
			var groups =  _elements.elements.childNodes;
			var lastElement, lastVisibleElement;
			
			for (var i = 0; i < groups.length; i++) {
				var childNodes = groups[i].childNodes;
				
				for (var childNode in childNodes) {
					if (isNaN(parseInt(childNode, 10))) {
						continue;
					}
					if (childNodes[childNode].id.indexOf(_wrapper.id + "_divider") === 0 
							&& lastVisibleElement 
							&& lastVisibleElement.id.indexOf(_wrapper.id + "_divider") === 0 
							&& childNodes[childNode].style.backgroundImage == lastVisibleElement.style.backgroundImage) {
						childNodes[childNode].style.display = "none";
					} else if (childNodes[childNode].id.indexOf(_wrapper.id + "_divider") === 0 && lastElement && lastElement.style.display != "none") {
						childNodes[childNode].style.display = "block";
					}
					if (childNodes[childNode].style.display != "none") {
						lastVisibleElement = childNodes[childNode];
					}
					lastElement = childNodes[childNode];
				}
			}
		}
		
		function setToggles() {
			if (_api.jwGetFullscreen()) {
				_show(_elements.normalscreenButton);
				_hide(_elements.fullscreenButton);
			} else {
				_hide(_elements.normalscreenButton);
				_show(_elements.fullscreenButton);
			}
			
			if (_api.jwGetState() == jwplayer.api.events.state.BUFFERING || _api.jwGetState() == jwplayer.api.events.state.PLAYING) {
				_show(_elements.pauseButton);
				_hide(_elements.playButton);
			} else {
				_hide(_elements.pauseButton);
				_show(_elements.playButton);
			}
			
			if (_api.jwGetMute() == true) {
				_hide(_elements.muteButton);
				_show(_elements.unmuteButton);
				_hide(_elements.volumeSliderProgress);
			} else {
				_show(_elements.muteButton);
				_hide(_elements.unmuteButton);
				_show(_elements.volumeSliderProgress);
			}
		}
		
		/** Resize the jwplayerControlbar. **/
		function _resizeBar() {
			cleanupDividers();
			setToggles();
			var controlbarcss = {
				width: _width
			};
			var elementcss = {
				'float': 'left',
				styleFloat: 'left',
				cssFloat: 'left'
			};
			if (_settings.position == jwplayer.html5.view.positions.OVER || _api.jwGetFullscreen()) {
				controlbarcss.left = _settings.margin;
				controlbarcss.width -= 2 * _settings.margin;
				controlbarcss.top = _height - _getBack().height - _settings.margin;
				controlbarcss.height = _getBack().height;
			}
			
			var capLeft = _api.skin.getSkinElement("controlbar", "capLeft"); 
			var capRight = _api.skin.getSkinElement("controlbar", "capRight"); 
			
			elementcss.width = controlbarcss.width - (capLeft ? capLeft.width : 0) - (capRight ? capRight.width : 0);

			var leftWidth = _utils.getBoundingClientRect(_elements.leftGroup).width;
			var rightWidth = _utils.getBoundingClientRect(_elements.rightGroup).width;
			var timeSliderWidth = elementcss.width - leftWidth - rightWidth - 1;  // IE requires a 1px margin
			var timeSliderRailWidth = timeSliderWidth;
            var timeSliderCapLeft = _api.skin.getSkinElement("controlbar", "timeSliderCapLeft"); 
            var timeSliderCapRight = _api.skin.getSkinElement("controlbar", "timeSliderCapRight"); 
			
			if (_utils.exists(timeSliderCapLeft)) {
				timeSliderRailWidth -= timeSliderCapLeft.width;
			}
			if (_utils.exists(timeSliderCapRight)) {
				timeSliderRailWidth -= timeSliderCapRight.width;
			}

			_elements.timeSlider.style.width = timeSliderWidth + "px";
			_elements.timeSliderRail.style.width = timeSliderRailWidth + "px";   

			_css(_wrapper, controlbarcss);
			_css(_elements.elements, elementcss);
			_css(_elements.background, elementcss);

			_updatePositions();

			return controlbarcss;
		}
		
		
		/** Update the volume level. **/
		function _volumeHandler(event) {
			if (_utils.exists(_elements.volumeSliderRail)) {
				var progress = isNaN(event.volume / 100) ? 1 : event.volume / 100;
				var width = _utils.parseDimension(_elements.volumeSliderRail.style.width);
				var progressWidth = isNaN(Math.round(width * progress)) ? 0 : Math.round(width * progress);
				var offset = _utils.parseDimension(_elements.volumeSliderRail.style.right);
				
				var volumeSliderLeft = (!_utils.exists(_api.skin.getSkinElement("controlbar", "volumeSliderCapLeft"))) ? 0 : _api.skin.getSkinElement("controlbar", "volumeSliderCapLeft").width;
				_css(_elements.volumeSliderProgress, {
					width: progressWidth,
					left: volumeSliderLeft
				});

				if (_elements.volumeSliderThumb) {
					var thumbPos = (progressWidth - Math.round(_utils.parseDimension(_elements.volumeSliderThumb.style.width) / 2));
					thumbPos = Math.min(Math.max(thumbPos, 0), width - _utils.parseDimension(_elements.volumeSliderThumb.style.width));
					
					_css(_elements.volumeSliderThumb, {
						left: thumbPos
					});
				}
				
				if (_utils.exists(_elements.volumeSliderCapLeft)) {
					_css(_elements.volumeSliderCapLeft, {
						left: 0
					});
				}
			}
		}
		
		function _setMouseListeners() {
			try {
				var id = (_api.id.indexOf("_instream") > 0 ? _api.id.replace("_instream","") : _api.id);
				_root = document.getElementById(id);
				_root.addEventListener("mousemove", _setVisibility);
			} catch (e) {
				_utils.log("Could not add mouse listeners to controlbar: " + e);
			}
		}
		
		function _setup() {
			_buildBase();
			_buildElements();
			_updatePositions();
			_ready = true;
			_addListeners();
			_settings.idlehide = (_settings.idlehide.toString().toLowerCase() == "true");
			if (_settings.position == jwplayer.html5.view.positions.OVER && _settings.idlehide) {
				_wrapper.style.opacity = 0;
				_eventReady = true;
			} else {
				_wrapper.style.opacity = 1;
				setTimeout((function() { 
					_eventReady = true;
					_sendShow();
				}), 1);
			}
			_setMouseListeners();
			_init();
		}
		
		_setup();
		return this;
	};
})(jwplayer);
