/**
 * JW Player logo component
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {

	var _defaults = {
		prefix: "http://l.longtailvideo.com/html5/",
		file: "logo.png",
		link: "http://www.longtailvideo.com/players/jw-flv-player/",
		linktarget: "_top",
		margin: 8,
		out: 0.5,
		over: 1,
		timeout: 5,
		hide: true,
		position: "bottom-left"
	};
	
	_css = jwplayer.utils.css;
	
	jwplayer.html5.logo = function(api, logoConfig) {
		var _api = api;
		var _timeout;
		var _settings;
		var _logo;
		var _showing = false;
		
		_setup();
		
		function _setup() {
			_setupConfig();
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_setupDisplayElements();
			_setupMouseEvents();
		}
		
		function _setupConfig() {
			if (_defaults.prefix) {
				var version = api.version.split(/\W/).splice(0, 2).join("/");
				if (_defaults.prefix.indexOf(version) < 0) {
					_defaults.prefix += version + "/";
				}
			}
			
			if (logoConfig.position == jwplayer.html5.view.positions.OVER) {
				logoConfig.position = _defaults.position;
			}
			
			try {
				if (window.location.href.indexOf("https") == 0) {
					_defaults.prefix = _defaults.prefix.replace("http://l.longtailvideo.com", "https://securel.longtailvideo.com");
				}
			} catch(e) {}
			
			_settings = jwplayer.utils.extend({}, _defaults, logoConfig);
		}
		
		function _setupDisplayElements() {
			_logo = document.createElement("img");
			_logo.id = _api.id + "_jwplayer_logo";
			_logo.style.display = "none";
			
			_logo.onload = function(evt) {
				_css(_logo, _getStyle());
				_outHandler();
			};
			
			if (!_settings.file) {
				return;
			}
			
			if (_settings.file.indexOf("/") >= 0) {
				_logo.src = _settings.file;
			} else {
				_logo.src = _settings.prefix + _settings.file;
			}
		}
		
		if (!_settings.file) {
			return;
		}
		
		
		this.resize = function(width, height) {
		};
		
		this.getDisplayElement = function() {
			return _logo;
		};
		
		function _setupMouseEvents() {
			if (_settings.link) {
				_logo.onmouseover = _overHandler;
				_logo.onmouseout = _outHandler;
				_logo.onclick = _clickHandler;
			} else {
				this.mouseEnabled = false;
			}
		}
		
		
		function _clickHandler(evt) {
			if (typeof evt != "undefined") {
				evt.stopPropagation();
			}
			
			if (!_showing)
				return;
			
			_api.jwPause();
			_api.jwSetFullscreen(false);
			if (_settings.link) {
				window.open(_settings.link, _settings.linktarget);
			}
			return;
		}
		
		function _outHandler(evt) {
			if (_settings.link && _showing) {
				_logo.style.opacity = _settings.out;
			}
			return;
		}
		
		function _overHandler(evt) {
			if (_showing) {
				_logo.style.opacity = _settings.over;
			}
			return;
		}
		
		function _getStyle() {
			var _imageStyle = {
				textDecoration: "none",
				position: "absolute",
				cursor: "pointer"
			};
			_imageStyle.display = (_settings.hide.toString() == "true" && !_showing) ? "none" : "block";
			var positions = _settings.position.toLowerCase().split("-");
			for (var position in positions) {
				_imageStyle[positions[position]] = parseInt(_settings.margin);
			}
			return _imageStyle;
		}
		
		function _show() {
			if (_settings.hide.toString() == "true") {
				_logo.style.display = "block";
				_logo.style.opacity = 0;
				jwplayer.utils.fadeTo(_logo, _settings.out, 0.1, parseFloat(_logo.style.opacity));
				_timeout = setTimeout(function() {
					_hide();
				}, _settings.timeout * 1000);
			}
			_showing = true;
		}
		
		function _hide() {
			_showing = false;
			if (_settings.hide.toString() == "true") {
				jwplayer.utils.fadeTo(_logo, 0, 0.1, parseFloat(_logo.style.opacity));
			}
		}
		
		function _stateHandler(obj) {
			if (obj.newstate == jwplayer.api.events.state.BUFFERING) {
				clearTimeout(_timeout);
				_show();
			}
		}
		
		return this;
	};
	
})(jwplayer);
