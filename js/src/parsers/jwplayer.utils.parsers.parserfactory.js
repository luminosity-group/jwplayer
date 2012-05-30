/**
 * Parser factory for the JW Player.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.parserfactory = function() {
	};
	
	/**
	 * Determines the parser for a feed
	 * @param {XML} list
	 * @return {IPlaylistParser} parser
	 */
	jwplayer.utils.parsers.parserfactory.getParser = function(list) {
	
		switch (jwplayer.utils.parsers.localName(list).toLowerCase()) {
			case 'asx':
				return jwplayer.utils.parsers.asxparser;
				break;
			case 'feed':
				return jwplayer.utils.parsers.atomparser;
				break;
			case 'playlist':
				return jwplayer.utils.parsers.xspfparser;
				break;
			case 'rss':
				return jwplayer.utils.parsers.rssparser;
				break;
			case 'smil':
				return jwplayer.utils.parsers.smilparser;
				break;
		}
		
		return null;
	};
})(jwplayer);
