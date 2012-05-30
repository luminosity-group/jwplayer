/**
 * JW Player playlist model
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.html5.playlist = function(config) {
		var _playlist = [];
		if (config.playlist && config.playlist instanceof Array && config.playlist.length > 0) {
			for (var playlistItem in config.playlist) {
				if (!isNaN(parseInt(playlistItem))){
					_playlist.push(new jwplayer.html5.playlistitem(config.playlist[playlistItem]));
				}
			}
		} else {
			_playlist.push(new jwplayer.html5.playlistitem(config));
		}
		return _playlist;
	};
	
})(jwplayer);
