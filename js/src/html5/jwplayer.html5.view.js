/**
 * JW Player view component
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {

	var _utils = jwplayer.utils;
	var _css = _utils.css;
	
	jwplayer.html5.view = function(api, container, model) {
		var _api = api;
		var _container = container;
		var _model = model;
		var _wrapper;
		var _width;
		var _height;
		var _box;
		var _zIndex;
		var _resizeInterval;
		var _media;
		var _falseFullscreen = false;
		var _fsBeforePlay = false;
		var _normalscreenWidth, _normalscreenHeight;
		var _instremArea, _instreamMode, _instreamVideo;
		
		function createWrapper() {
			_wrapper = document.createElement("div");
			_wrapper.id = _container.id;
			_wrapper.className = _container.className;
			_videowrapper = document.createElement("div");
			_videowrapper.id = _wrapper.id + "_video_wrapper";
			_container.id = _wrapper.id + "_video";
			
			_css(_wrapper, {
				position: "relative",
				height: _model.height,
				width: _model.width,
				padding: 0,
				backgroundColor: getBackgroundColor(),
				zIndex: 0
			});
			
			function getBackgroundColor() {
				if (_api.skin.getComponentSettings("display") && _api.skin.getComponentSettings("display").backgroundcolor) {
					return _api.skin.getComponentSettings("display").backgroundcolor;
				}
				return parseInt("000000", 16);
			}
			
			_css(_container, {
//				width: _model.width,
//				height: _model.height,
				width: "100%",
				height: "100%",
				top: 0,
				left: 0,
				zIndex: 1,
				margin: "auto",
				display: "block"
			});
			
			_css(_videowrapper, {
				overflow: "hidden",
				position: "absolute",
				top: 0,
				left: 0,
				bottom: 0,
				right: 0
			});
			
			_utils.wrap(_container, _wrapper);
			_utils.wrap(_container, _videowrapper);
			
			_box = document.createElement("div");
			_box.id = _wrapper.id + "_displayarea";
			_wrapper.appendChild(_box);
			
			_instreamArea = document.createElement("div");
			_instreamArea.id = _wrapper.id + "_instreamarea";
			_css(_instreamArea, {
				overflow: "hidden",
				position: "absolute",
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				zIndex: 100,
				background: '000000',
				display: 'none'
			});
			_wrapper.appendChild(_instreamArea);
		}
		
		function layoutComponents() {
			for (var pluginIndex = 0; pluginIndex < _model.plugins.order.length; pluginIndex++) {
				var pluginName = _model.plugins.order[pluginIndex];
				if (_utils.exists(_model.plugins.object[pluginName].getDisplayElement)) {
					_model.plugins.object[pluginName].height = _utils.parseDimension(_model.plugins.object[pluginName].getDisplayElement().style.height);
					_model.plugins.object[pluginName].width = _utils.parseDimension(_model.plugins.object[pluginName].getDisplayElement().style.width);
					_model.plugins.config[pluginName].currentPosition = _model.plugins.config[pluginName].position;
				}
			}
			_loadedHandler();
		}

		function _beforePlayHandler(evt) {
			_fsBeforePlay = _model.fullscreen;
		}

		function _stateHandler(evt) {
			if (_instreamMode) { return; }
			
			if (_model.getMedia() && _model.getMedia().hasChrome()) {
				_box.style.display = "none";
			} else {
				switch (evt.newstate) {
				case evt.newstate == jwplayer.api.events.state.PLAYING:
					_box.style.display = "none";
					break;
				default:
					_box.style.display = "block";
					break;
				}
			}
			_resizeMedia();
		}

		function _loadedHandler(evt) {
			var newMedia = _model.getMedia() ? _model.getMedia().getDisplayElement() : null;
			
			if (_utils.exists(newMedia)) {
				if (_media != newMedia) {
					if (_media && _media.parentNode) {
						_media.parentNode.replaceChild(newMedia, _media);
					}
					_media = newMedia;
				}
				for (var pluginIndex = 0; pluginIndex < _model.plugins.order.length; pluginIndex++) {
					var pluginName = _model.plugins.order[pluginIndex];
					if (_utils.exists(_model.plugins.object[pluginName].getDisplayElement)) {
						_model.plugins.config[pluginName].currentPosition = _model.plugins.config[pluginName].position;
					}
				}
			}
			_resize(_model.width, _model.height);
		}
		
		this.setup = function() {
			if (_model && _model.getMedia()) {
				_container = _model.getMedia().getDisplayElement();
			}
			createWrapper();
			layoutComponents();
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_LOADED, _loadedHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_BEFOREPLAY, _beforePlayHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_MEDIA_META, function(evt) {
				_resizeMedia();
			});
			var oldresize;
			if (_utils.exists(window.onresize)) {
				oldresize = window.onresize;
			}
			window.onresize = function(evt) {
				if (_utils.exists(oldresize)) {
					try {
						oldresize(evt);
					} catch (err) {
					
					}
				}
				if (_api.jwGetFullscreen()) {
					if (!_useNativeFullscreen()) {
						var rect = _utils.getBoundingClientRect(document.body);
						_model.width = Math.abs(rect.left) + Math.abs(rect.right);
						_model.height = window.innerHeight;
						_resize(_model.width, _model.height);
					}
				} else {
					_resize(_model.width, _model.height);
				}
			};
		};
		
		function _keyHandler(evt) {
			switch (evt.keyCode) {
				case 27:
					if (_api.jwGetFullscreen()) {
						_api.jwSetFullscreen(false);
					}
					break;
				case 32:
					// For spacebar. Not sure what to do when there are multiple players
					if (_api.jwGetState() != jwplayer.api.events.state.IDLE && _api.jwGetState() != jwplayer.api.events.state.PAUSED) {
						_api.jwPause();
					} else {
						_api.jwPlay();
					}
					break;
			}
		}
		
		
		function _resize(width, height) {
			if (_wrapper.style.display == "none") {
				return;
			}
			
			var plugins = [].concat(_model.plugins.order);
			plugins.reverse();
			_zIndex = plugins.length + 2;
			
			if (_fsBeforePlay && _useNativeFullscreen()) {
				try {
					// Check to see if we're in safari and the user has exited fullscreen (the model is not updated)
					if (_model.fullscreen && !_model.getMedia().getDisplayElement().webkitDisplayingFullscreen) {
						_model.fullscreen = false;
					}
				} catch(e) {}
			}
			
			if (!_model.fullscreen) {
				_width = width;
				_height = height;

				if (typeof width == "string" && width.indexOf("%") > 0) {
					_width = _utils.getElementWidth(_utils.parentNode(_wrapper)) * parseInt(width.replace("%"),"") / 100;
				} else {
					_width = width;
				}
				if (typeof height == "string" && height.indexOf("%") > 0) {
					_height = _utils.getElementHeight(_utils.parentNode(_wrapper)) * parseInt(height.replace("%"),"") / 100;
				} else {
					_height = height;
				}
				var boxStyle = {
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					width: _width,
					height: _height,
					position: "absolute"
				}; 
				_css(_box, boxStyle);
				var displayDimensions = {}
				var display;
				try { display = _model.plugins.object['display'].getDisplayElement(); } catch(e) {}
				if(display) {
					displayDimensions.width = _utils.parseDimension(display.style.width);
					displayDimensions.height = _utils.parseDimension(display.style.height);
				}
				
				var instreamStyle = _utils.extend({}, boxStyle, displayDimensions, {
					zIndex: _instreamArea.style.zIndex, 
					display: _instreamArea.style.display
				});
				_css(_instreamArea, instreamStyle);
				_css(_wrapper, {
					height: _height,
					width: _width
				});

				
				var failed = _resizeComponents(_normalscreenComponentResizer, plugins);
				if (failed.length > 0) {
					_zIndex += failed.length;
					var plIndex = failed.indexOf("playlist"),
						cbIndex = failed.indexOf("controlbar");
					if (plIndex >= 0 && cbIndex >= 0) {
						// Reverse order of controlbar and playlist when both are set to "over"
						failed[plIndex] = failed.splice(cbIndex, 1, failed[plIndex])[0];
					}
					_resizeComponents(_overlayComponentResizer, failed, true);
				}
				_normalscreenWidth = _utils.getElementWidth(_box);
				_normalscreenHeight = _utils.getElementHeight(_box);
			} else if ( !_useNativeFullscreen() ) {
				_resizeComponents(_fullscreenComponentResizer, plugins, true);
			}
			_resizeMedia();
		}
		
		function _resizeComponents(componentResizer, plugins, sizeToBox) {
			var failed = [];
			for (var pluginIndex = 0; pluginIndex < plugins.length; pluginIndex++) {
				var pluginName = plugins[pluginIndex];
				if (_utils.exists(_model.plugins.object[pluginName].getDisplayElement)) {
					if (_model.plugins.config[pluginName].currentPosition != jwplayer.html5.view.positions.NONE) {
						var style = componentResizer(pluginName, _zIndex--);
						if (!style) {
							failed.push(pluginName);
						} else {
							var width = style.width;
							var height = style.height;
							if (sizeToBox) {
								delete style.width;
								delete style.height;
							}
							_css(_model.plugins.object[pluginName].getDisplayElement(), style);
							_model.plugins.object[pluginName].resize(width, height);
						}
					} else {
						_css(_model.plugins.object[pluginName].getDisplayElement(), {
							display: "none"
						});
					}
				}
			}
			return failed;
		}
		
		function _normalscreenComponentResizer(pluginName, zIndex) {
			if (_utils.exists(_model.plugins.object[pluginName].getDisplayElement)) {
				if (_model.plugins.config[pluginName].position && _hasPosition(_model.plugins.config[pluginName].position)) {
					if (!_utils.exists(_model.plugins.object[pluginName].getDisplayElement().parentNode)) {
						_wrapper.appendChild(_model.plugins.object[pluginName].getDisplayElement());
					}
					var style = _getComponentPosition(pluginName);
					style.zIndex = zIndex;
					return style;
				}
			}
			return false;
		}
		
		function _overlayComponentResizer(pluginName, zIndex) {
			if (!_utils.exists(_model.plugins.object[pluginName].getDisplayElement().parentNode)) {
				_box.appendChild(_model.plugins.object[pluginName].getDisplayElement());
			}
			return {
				position: "absolute",
				width: (_utils.getElementWidth(_box) - _utils.parseDimension(_box.style.right)),
				height: (_utils.getElementHeight(_box) - _utils.parseDimension(_box.style.bottom)),
				zIndex: zIndex
			};
		}
		
		function _fullscreenComponentResizer(pluginName, zIndex) {
			return {
				position: "fixed",
				width: _model.width,
				height: _model.height,
				zIndex: zIndex
			};
		}
		
		var _resizeMedia = this.resizeMedia = function() {
			_box.style.position = "absolute";
			var media = _model.getMedia() ? _model.getMedia().getDisplayElement() : _instreamVideo;
			if (!media) { return; }
			if (media && media.tagName.toLowerCase() == "video") {
				if (!media.videoWidth || !media.videoHeight) {
					media.style.width = _box.style.width;
					media.style.height = _box.style.height;
					return;
				}
				media.style.position = "absolute";
				_utils.fadeTo(media, 1, 0.25);
				if (media.parentNode) {
					media.parentNode.style.left = _box.style.left;
					media.parentNode.style.top = _box.style.top;
				}
				if (_model.fullscreen && _api.jwGetStretching() == jwplayer.utils.stretching.EXACTFIT && !_utils.isMobile()) {
					var tmp = document.createElement("div");
					_utils.stretch(jwplayer.utils.stretching.UNIFORM, tmp, 
							_utils.getElementWidth(_box), 
							_utils.getElementHeight(_box), 
							_normalscreenWidth, _normalscreenHeight);
					
					_utils.stretch(jwplayer.utils.stretching.EXACTFIT, media, 
							_utils.parseDimension(tmp.style.width), _utils.parseDimension(tmp.style.height),
							media.videoWidth ? media.videoWidth : 400, 
							media.videoHeight ? media.videoHeight : 300);
					
					_css(media, {
						left: tmp.style.left,
						top: tmp.style.top
					});
				} else {
					_utils.stretch(_api.jwGetStretching(), media, 
							_utils.getElementWidth(_box), 
							_utils.getElementHeight(_box), 
						media.videoWidth ? media.videoWidth : 400, 
						media.videoHeight ? media.videoHeight : 300);
				}
				
			} else {
				var display = _model.plugins.object['display'].getDisplayElement();
				if(display) {
					_model.getMedia().resize(_utils.parseDimension(display.style.width), _utils.parseDimension(display.style.height));
				} else {
					_model.getMedia().resize(_utils.parseDimension(_box.style.width), _utils.parseDimension(_box.style.height));
				}
			}
		}
		
		var _getComponentPosition = this.getComponentPosition = function(pluginName) {
			var plugincss = {
				position: "absolute",
				margin: 0,
				padding: 0,
				top: null
			};
			// Not a code error - toLowerCase is needed for the CSS position
			var position = _model.plugins.config[pluginName].currentPosition.toLowerCase();
			switch (position.toUpperCase()) {
				case jwplayer.html5.view.positions.TOP:
					plugincss.top = _utils.parseDimension(_box.style.top);
					plugincss.left = _utils.parseDimension(_box.style.left);
					plugincss.width = _utils.getElementWidth(_box) - _utils.parseDimension(_box.style.left) - _utils.parseDimension(_box.style.right);
					plugincss.height = _model.plugins.object[pluginName].height;
					_box.style[position] = _utils.parseDimension(_box.style[position]) + _model.plugins.object[pluginName].height + "px";
					_box.style.height = _utils.getElementHeight(_box) - plugincss.height + "px";
					break;
				case jwplayer.html5.view.positions.RIGHT:
					plugincss.top = _utils.parseDimension(_box.style.top);
					plugincss.right = _utils.parseDimension(_box.style.right);
					plugincss.width = _model.plugins.object[pluginName].width;
					plugincss.height = _utils.getElementHeight(_box) - _utils.parseDimension(_box.style.top) - _utils.parseDimension(_box.style.bottom);
					_box.style.width = _utils.getElementWidth(_box) - plugincss.width + "px";
					break;
				case jwplayer.html5.view.positions.BOTTOM:
					plugincss.bottom = _utils.parseDimension(_box.style.bottom);
					plugincss.left = _utils.parseDimension(_box.style.left);
					plugincss.width = _utils.getElementWidth(_box) - _utils.parseDimension(_box.style.left) - _utils.parseDimension(_box.style.right);
					plugincss.height = _model.plugins.object[pluginName].height;
					_box.style.height = _utils.getElementHeight(_box) - plugincss.height + "px";
					break;
				case jwplayer.html5.view.positions.LEFT:
					plugincss.top = _utils.parseDimension(_box.style.top);
					plugincss.left = _utils.parseDimension(_box.style.left);
					plugincss.width = _model.plugins.object[pluginName].width;
					plugincss.height = _utils.getElementHeight(_box) - _utils.parseDimension(_box.style.top) - _utils.parseDimension(_box.style.bottom);
					_box.style[position] = _utils.parseDimension(_box.style[position]) + _model.plugins.object[pluginName].width + "px";
					_box.style.width = _utils.getElementWidth(_box) - plugincss.width + "px";
					break;
				default:
					break;
			}
			return plugincss;
		}
		
		
		this.resize = _resize;
		
		var _beforeNative;
		
		this.fullscreen = function(state) {
			var videotag;
			try {
				videotag = _model.getMedia().getDisplayElement();
			} catch(e) {}

			if (_useNativeFullscreen() && videotag && videotag.webkitSupportsFullscreen) {
				if (state && !videotag.webkitDisplayingFullscreen) {
					try {
						_utils.transform(videotag);
						_beforeNative = _box.style.display; 
						_box.style.display="none";
						videotag.webkitEnterFullscreen();
					} catch (err) {
					}
				} else if (!state) {
					_resizeMedia();
					if (videotag.webkitDisplayingFullscreen) {
						try {
							videotag.webkitExitFullscreen();
						} catch (err) {
						}
					}
					_box.style.display=_beforeNative;
				}
				_falseFullscreen = false;
			} else {
				if (state) {
					document.onkeydown = _keyHandler;
					clearInterval(_resizeInterval);
					var rect = _utils.getBoundingClientRect(document.body);
					_model.width = Math.abs(rect.left) + Math.abs(rect.right);
					_model.height = window.innerHeight;
					var style = {
						position: "fixed",
						width: "100%",
						height: "100%",
						top: 0,
						left: 0,
						zIndex: 2147483000
					};
					_css(_wrapper, style);
					style.zIndex = 1;
					if (_model.getMedia() && _model.getMedia().getDisplayElement()) {
						_css(_model.getMedia().getDisplayElement(), style);
					}
					style.zIndex = 2;
					_css(_box, style);
					_falseFullscreen = true;
				} else {
					document.onkeydown = "";
					_model.width = _width;
					_model.height = _height;
					_css(_wrapper, {
						position: "relative",
						height: _model.height,
						width: _model.width,
						zIndex: 0
					});
					_falseFullscreen = false;
				}
				_resize(_model.width, _model.height);
			}
		};
		
		function _hasPosition(position) {
			return ([jwplayer.html5.view.positions.TOP, jwplayer.html5.view.positions.RIGHT, jwplayer.html5.view.positions.BOTTOM, jwplayer.html5.view.positions.LEFT].toString().indexOf(position.toUpperCase()) > -1);
		}
		
		function _useNativeFullscreen() {
			if (_api.jwGetState() != jwplayer.api.events.state.IDLE
					&& !_falseFullscreen
					&& (_model.getMedia() && _model.getMedia().getDisplayElement() && _model.getMedia().getDisplayElement().webkitSupportsFullscreen)
					&& _utils.useNativeFullscreen()) {
				 return true;
			}
			
			return false;
		}
		
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			_utils.css(_instreamArea, {
				display: "block",
				position: "absolute"
			});
			_box.style.display = "none";
			_instreamArea.appendChild(instreamDisplay);
			_instreamVideo = instreamVideo;
			_instreamMode = true;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			_instreamArea.style.display = "none";
			_instreamArea.innerHTML = "";
			_box.style.display = "block";
			_instreamVideo = null;
			_instreamMode = false;
			_resize(_model.width, _model.height);
		}
	};
	
	
	jwplayer.html5.view.positions = {
		TOP: "TOP",
		RIGHT: "RIGHT",
		BOTTOM: "BOTTOM",
		LEFT: "LEFT",
		OVER: "OVER",
		NONE: "NONE"
	};
})(jwplayer);
