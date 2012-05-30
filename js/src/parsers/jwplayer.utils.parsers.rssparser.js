/**
 * Parse an RSS feed and translate it to a playlist.
 *
 * @author zach
 * @version 5.7
 */
(function(jwplayer) {

	jwplayer.utils.parsers.rssparser = function() {
	};
	
	/**
	 * Parse an RSS playlist for feed items.
	 *
	 * @param {XML} dat
	 * @reuturn {Array} playlistarray
	 */
	jwplayer.utils.parsers.rssparser.parse = function(dat) {
		var arr = [];
		for (var i = 0; i < dat.childNodes.length; i++) {
			if (jwplayer.utils.parsers.localName(dat.childNodes[i]).toLowerCase() == 'channel') {
				for (var j = 0; j < dat.childNodes[i].childNodes.length; j++) {
					if (jwplayer.utils.parsers.localName(dat.childNodes[i].childNodes[j]).toLowerCase() == 'item') {
						arr.push(_parseItem(dat.childNodes[i].childNodes[j]));
					}
				}
			}
		}
		return arr;
	};
	
	
	/** 
	 * Translate RSS item to playlist item.
	 *
	 * @param {XML} obj
	 * @return {PlaylistItem} PlaylistItem
	 */
	function _parseItem(obj) {
		var itm = {};
		for (var i = 0; i < obj.childNodes.length; i++) {
			if (!jwplayer.utils.parsers.localName(obj.childNodes[i])){
				continue;
			}
			switch (jwplayer.utils.parsers.localName(obj.childNodes[i]).toLowerCase()) {
				case 'enclosure':
					itm['file'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url');
					break;
				case 'title':
					itm['title'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					break;
				case 'pubdate':
					itm['date'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					break;
				case 'description':
					itm['description'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					break;
				case 'link':
					itm['link'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					break;
				case 'category':
					if (itm['tags']) {
						itm['tags'] += jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					} else {
						itm['tags'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
					}
					break;
			}
		}
//		itm = jwplayer.utils.parsers.itunesparser.parseEntry(obj, itm);
		itm = jwplayer.utils.parsers.mediaparser.parseGroup(obj, itm);
		itm = jwplayer.utils.parsers.jwparser.parseEntry(obj, itm);

		return new jwplayer.html5.playlistitem(itm);
	}
	
	
})(jwplayer);
