/**
 * HTML5 mode embedder for the JW Player
 * @author Zach
 * @version 5.8
 */
(function(jwplayer) {

	jwplayer.embed.html5 = function(_container, _player, _options, _loader, _api) {
		function _resizePlugin (plugin, div, onready) {
			return function(evt) {
				var displayarea = document.getElementById(_container.id + "_displayarea");
				if (onready) {
					displayarea.appendChild(div);
				}
				plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
				div.left = displayarea.style.left;
				div.top = displayarea.style.top;
			}
		}
		
		this.embed = function() {
			if (jwplayer.html5) {
				_loader.setupPlugins(_api, _options, _resizePlugin);
				_container.innerHTML = "";
				var playerOptions = jwplayer.utils.extend({
					screencolor: '0x000000'
				}, _options);

				var toDelete = ["plugins", "modes", "events"];
				
				for (var i = 0; i < toDelete.length; i++){
					delete playerOptions[toDelete[i]];
				}
				// TODO: remove this requirement from the html5 _player (sources instead of levels)
				if (playerOptions.levels && !playerOptions.sources) {
					playerOptions.sources = _options.levels;
				}
				if (playerOptions.skin && playerOptions.skin.toLowerCase().indexOf(".zip") > 0) {
					playerOptions.skin = playerOptions.skin.replace(/\.zip/i, ".xml");
				}
				var html5player = new (jwplayer.html5(_container)).setup(playerOptions);
				_api.container = document.getElementById(_api.id);
				_api.setPlayer(html5player, "html5");
			} else {
				return null;
			}
		}
		
		/**
		 * Detects whether the html5 player supports this configuration.
		 *
		 * @return {Boolean}
		 */
		this.supportsConfig = function() {
			if (!!jwplayer.vid.canPlayType) {
				if (_options) {
					var item = jwplayer.utils.getFirstPlaylistItemFromConfig(_options);
					if (typeof item.file == "undefined" && typeof item.levels == "undefined") {
						return true;
					} else if (item.file) {
						return html5CanPlay(jwplayer.vid, item.file, item.provider, item.playlistfile);
					} else if (item.levels && item.levels.length) {
						for (var i = 0; i < item.levels.length; i++) {
							if (item.levels[i].file && html5CanPlay(jwplayer.vid, item.levels[i].file, item.provider, item.playlistfile)) {
								return true;
							}
						}
					}
				} else {
					return true;
				}
			}
			
			return false;
		}
		
		/**
		 * Determines if a video element can play a particular file, based on its extension
		 * @param {Object} video
		 * @param {Object} file
		 * @param {Object} provider
		 * @param {Object} playlistfile
		 * @return {Boolean}
		 */
		html5CanPlay = function(video, file, provider, playlistfile) {
			// Don't support playlists
			if (playlistfile) {
				return false;
			}
			
			// YouTube is supported
			if (provider && provider == "youtube") {
				return true;
			}
			
			// If a provider is set, only proceed if video or HTTP or sound
			if (provider && provider != "video" && provider != "http" && provider != "sound") {
				return false;
			}
			
			// HTML5 playback is not sufficiently supported on Blackberry devices; should fail over automatically.
			if(navigator.userAgent.match(/BlackBerry/i) !== null) { return false; }
			
			var extension = jwplayer.utils.extension(file);
			// If no extension or unrecognized extension, allow to play
			if (!jwplayer.utils.exists(extension) || !jwplayer.utils.exists(jwplayer.utils.extensionmap[extension])){
				return true;
			}
			
			// If extension is defined but not supported by HTML5, don't play 
			if (!jwplayer.utils.exists(jwplayer.utils.extensionmap[extension].html5)) {
				return false;
			}
						
			// Check for Android, which returns false for canPlayType
			if (jwplayer.utils.isLegacyAndroid() && extension.match(/m4v|mp4/)) {
				return true;
			}
			
			// Last, but not least, we ask the browser 
			// (But only if it's a video with an extension known to work in HTML5)
			return browserCanPlay(video, jwplayer.utils.extensionmap[extension].html5);
		};
		
		/**
		 * 
		 * @param {DOMMediaElement} video
		 * @param {String} mimetype
		 * @return {Boolean}
		 */
		browserCanPlay = function(video, mimetype) {
			// OK to use HTML5 with no extension
			if (!mimetype) {
				return true;
			}
			
			if (video.canPlayType(mimetype)) {
				return true;
			} else if (mimetype == "audio/mp3" && navigator.userAgent.match(/safari/i)) {
				// Work around Mac Safari bug
				return video.canPlayType("audio/mpeg");
			} else {
				return false;
			}
			
		}
	};
	
})(jwplayer);
