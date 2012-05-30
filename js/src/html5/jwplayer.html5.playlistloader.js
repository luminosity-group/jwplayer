/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.html5.playlistloader = function() {
		var _eventDispatcher = new jwplayer.html5.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			jwplayer.utils.ajax(playlistfile, _playlistLoaded, _playlistError)
		}
		
		function _playlistLoaded(loadedEvent) {
			var playlistObj = [];  //[{file:'/testing/files/bunny.mp4'}];

			try {
				var playlistObj = jwplayer.utils.parsers.rssparser.parse(loadedEvent.responseXML.firstChild);
				_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, {
					"playlist": new jwplayer.html5.playlist({playlist: playlistObj})
				});
			} catch (e) {
				_playlistError("Could not parse the playlist");
			}
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(jwplayer.api.events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	};
	
})(jwplayer);
