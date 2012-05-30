/**
 * Download mode embedder for the JW Player
 * @author Zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.embed.download = function(_container, _player, _options, _loader, _api) {
		this.embed = function() {
			var params = jwplayer.utils.extend({}, _options);
			
			var _display = {};
			var _width = _options.width ? _options.width : 480;
			if (typeof _width != "number") {
				_width = parseInt(_width, 10);
			}
			var _height = _options.height ? _options.height : 320;
			if (typeof _height != "number") {
				_height = parseInt(_height, 10);
			}
			var _file, _image, _cursor;
			
			var item = {};
			if (_options.playlist && _options.playlist.length) {
				item.file = _options.playlist[0].file;
				_image = _options.playlist[0].image;
				item.levels = _options.playlist[0].levels;
			} else {
				item.file = _options.file;
				_image = _options.image;
				item.levels = _options.levels;
			}
			
			if (item.file) {
				_file = item.file;
			} else if (item.levels && item.levels.length) {
				_file = item.levels[0].file;
			}
			
			_cursor = _file ? "pointer" : "auto";
			
			var _elements = {
				display: {
					style: {
						cursor: _cursor,
						width: _width,
						height: _height,
						backgroundColor: "#000",
						position: "relative",
						textDecoration: "none",
						border: "none",
						display: "block"
					}
				},
				display_icon: {
					style: {
						cursor: _cursor,
						position: "absolute",
						display: _file ? "block" : "none",
						top: 0,
						left: 0,
						border: 0,
						margin: 0,
						padding: 0,
						zIndex: 3,
						width: 50,
						height: 50,
						backgroundImage: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALdJREFUeNrs18ENgjAYhmFouDOCcQJGcARHgE10BDcgTOIosAGwQOuPwaQeuFRi2p/3Sb6EC5L3QCxZBgAAAOCorLW1zMn65TrlkH4NcV7QNcUQt7Gn7KIhxA+qNIR81spOGkL8oFJDyLJRdosqKDDkK+iX5+d7huzwM40xptMQMkjIOeRGo+VkEVvIPfTGIpKASfYIfT9iCHkHrBEzf4gcUQ56aEzuGK/mw0rHpy4AAACAf3kJMACBxjAQNRckhwAAAABJRU5ErkJggg==)"
					}
				},
				display_iconBackground: {
					style: {
						cursor: _cursor,
						position: "absolute",
						display: _file ? "block" : "none",
						top: ((_height - 50) / 2),
						left: ((_width - 50) / 2),
						border: 0,
						width: 50,
						height: 50,
						margin: 0,
						padding: 0,
						zIndex: 2,
						backgroundImage: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEpJREFUeNrszwENADAIA7DhX8ENoBMZ5KR10EryckCJiIiIiIiIiIiIiIiIiIiIiIh8GmkRERERERERERERERERERERERGRHSPAAPlXH1phYpYaAAAAAElFTkSuQmCC)"
					}
				},
				display_image: {
					style: {
						width: _width,
						height: _height,
						display: _image ? "block" : "none",
						position: "absolute",
						cursor: _cursor,
						left: 0,
						top: 0,
						margin: 0,
						padding: 0,
						textDecoration: "none",
						zIndex: 1,
						border: "none"
					}
				}
			};
			
			var createElement = function(tag, element, id) {
				var _element = document.createElement(tag);
				if (id) {
					_element.id = id;
				} else {
					_element.id = _container.id + "_jwplayer_" + element;
				}
				jwplayer.utils.css(_element, _elements[element].style);
				return _element;
			};
			
			_display.display = createElement("a", "display", _container.id);
			if (_file) {
				_display.display.setAttribute("href", jwplayer.utils.getAbsolutePath(_file));
			}
			_display.display_image = createElement("img", "display_image");
			_display.display_image.setAttribute("alt", "Click to download...");
			if (_image) {
				_display.display_image.setAttribute("src", jwplayer.utils.getAbsolutePath(_image));
			}
			//TODO: Add test to see if browser supports base64 images?
			if (true) {
				_display.display_icon = createElement("div", "display_icon");
				_display.display_iconBackground = createElement("div", "display_iconBackground");
				_display.display.appendChild(_display.display_image);
				_display.display_iconBackground.appendChild(_display.display_icon);
				_display.display.appendChild(_display.display_iconBackground);
			}
			_css = jwplayer.utils.css;
			
			_hide = function(element) {
				_css(element, {
					display: "none"
				});
			};
			
			function _onImageLoad(evt) {
				_imageWidth = _display.display_image.naturalWidth;
				_imageHeight = _display.display_image.naturalHeight;
				_stretch();
			}
			
			function _stretch() {
				jwplayer.utils.stretch(jwplayer.utils.stretching.UNIFORM, _display.display_image, _width, _height, _imageWidth, _imageHeight);
			};
			
			_display.display_image.onerror = function(evt) {
				_hide(_display.display_image);
			};
			_display.display_image.onload = _onImageLoad;
			
			_container.parentNode.replaceChild(_display.display, _container);
			
			var logoConfig = (_options.plugins && _options.plugins.logo) ? _options.plugins.logo : {};
			
			_display.display.appendChild(new jwplayer.embed.logo(_options.components.logo, "download", _container.id));
			
			_api.container = document.getElementById(_api.id);
			_api.setPlayer(_display.display, "download");
		};
		
		
		
		this.supportsConfig = function() {
			if (_options) {
				var item = jwplayer.utils.getFirstPlaylistItemFromConfig(_options);
				
				if (typeof item.file == "undefined" && typeof item.levels == "undefined") {
					return true;
				} else if (item.file) {
					return canDownload(item.file, item.provider, item.playlistfile);
				} else if (item.levels && item.levels.length) {
					for (var i = 0; i < item.levels.length; i++) {
						if (item.levels[i].file && canDownload(item.levels[i].file, item.provider, item.playlistfile)) {
							return true;
						}
					}
				}
			} else {
				return true;
			}
		};
		
		/**
		 *
		 * @param {Object} file
		 * @param {Object} provider
		 * @param {Object} playlistfile
		 */
		function canDownload(file, provider, playlistfile) {
			// Don't support playlists
			if (playlistfile) {
				return false;
			}
			
			var providers = ["image", "sound", "youtube", "http"];
			// If the media provider is supported, return true
			if (provider && (providers.toString().indexOf(provider) > -1)) {
				return true;
			}
			
			// If a provider is set, only proceed if video
			if (!provider || (provider && provider == "video")) {
				var extension = jwplayer.utils.extension(file);
				
				// Only download if it's in the extension map or YouTube
				if (extension && jwplayer.utils.extensionmap[extension]) {
					return true;
				}
			}
			
			return false;
		};
	};
	
})(jwplayer);
