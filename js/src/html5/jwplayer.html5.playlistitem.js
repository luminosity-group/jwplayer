/**
 * JW Player playlist item model
 *
 * @author zach
 * @version 5.6
 */
(function(jwplayer) {
	jwplayer.html5.playlistitem = function(config) {
		var _defaults = {
			author: "",
			date: "",
			description: "",
			image: "",
			link: "",
			mediaid: "",
			tags: "",
			title: "",
			provider: "",
			
			file: "",
			streamer: "",
			duration: -1,
			start: 0,
			
			currentLevel: -1,
			levels: []
		};
		
		
		var _playlistitem = jwplayer.utils.extend({}, _defaults, config);
		
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
		
		if (_playlistitem.levels.length === 0) {
			_playlistitem.levels[0] = new jwplayer.html5.playlistitemlevel(_playlistitem);
		}
		
		if (!_playlistitem.provider) {
			_playlistitem.provider = _getProvider(_playlistitem.levels[0]);
		} else {
			_playlistitem.provider = _playlistitem.provider.toLowerCase();
		}
		
		return _playlistitem;
	};
	
	function _getProvider(item) {
		if (jwplayer.utils.isYouTube(item.file)) {
			return "youtube";
		} else {
			var extension = jwplayer.utils.extension(item.file);
			var mimetype;
			if (extension && jwplayer.utils.extensionmap[extension]) {
				if (extension == "m3u8") {
					return "video";
				}
				mimetype = jwplayer.utils.extensionmap[extension].html5;
			} else if (item.type) {
				mimetype = item.type;
			}
			
			if (mimetype) {
				var mimeprefix = mimetype.split("/")[0];
				if (mimeprefix == "audio") {
					return "sound";
				} else if (mimeprefix == "video") {
					return mimeprefix;
				}
			}
		}
		return "";
	}
})(jwplayer);