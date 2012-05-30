/**
 * Parse an RTMP Loadbalancing SMIL feed and translate it to a list of levels.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.loadbalanceparser = function() {
	}
	
	/**
	 * Parse an SMIL playlist for feed items.
	 *
	 * @param {Object} dat
	 * @return {Array} playlist
	 */
	jwplayer.utils.parsers.loadbalanceparser.parse = function(dat) {
		var array = [];
		var meta = dat.childNodes[0].childNodes[0];
		var streamer = jwplayer.utils.strings.xmlAttribute(meta, 'base');
		var switchOrVideo = dat.childNodes[1].childNodes[0];
		if (switchOrVideo.localName.toLowerCase() == 'switch') {
			for (var i in switchOrVideo.childNodes) {
				var level = new jwplayer.html5.playlistitemLevel(jwplayer.utils.strings.xmlAttribute(i, 'src'), Number(jwplayer.utils.strings.xmlAttribute(i, 'system-bitrate')) / 1000, Number(jwplayer.utils.strings.xmlAttribute(i, 'width')), streamer);
				array.push(level);
			}
		} else {
			array.push({
				file: jwplayer.utils.strings.xmlAttribute(switchOrVideo, 'src'),
				streamer: streamer
			});
		}
		return array;
	}
})(jwplayer);
