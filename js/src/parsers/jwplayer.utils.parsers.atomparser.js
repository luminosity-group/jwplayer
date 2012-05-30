/**
 * Parse an ATOM feed and translate it to a playlist.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.atomparser = function() {
	};
	
	/**
	 * Parse an RSS playlist for feed items.
	 *
	 * @param {XML} dat
	 * @return {Array} playlistarray
	 */
	jwplayer.utils.parsers.atomparser.parse = function(dat) {
		var arr = [];
		for (var i in dat.childNodes) {
			if (dat.childNodes[i].localName && dat.childNodes[i].localName.toLowerCase() == 'entry') {
				arr.push(_parseItem(dat.childNodes[i]));
			}
		}
		return arr;
	};
	
	
	/**
	 * Translate ATOM item to playlist item.
	 *
	 * @param {XML} obj
	 * @return {PlaylistItem} PlaylistItem
	 */
	function _parseItem(obj) {
		var itm = {};
		for (var i in obj.childNodes) {
			if (!obj.childNodes[i].localName) {
				continue;
			}
			switch (obj.childNodes[i].localName.toLowerCase()) {
				case 'author':
					itm['author'] = obj.childNodes[i].childNodes[0].textContent;
					break;
				case 'title':
					itm['title'] = obj.childNodes[i].textContent;
					break;
				case 'summary':
					itm['description'] = obj.childNodes[i].textContent;
					break;
				case 'link':
					if (jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'rel') == 'alternate') {
						itm['link'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'href');
					} else if (jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'rel') == 'enclosure') {
						itm['file'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'href');
					}
					break;
				case 'published':
					itm['date'] = obj.childNodes[i].textContent;
					break;
			}
		}
		itm = jwplayer.utils.parsers.mediaparser.parseGroup(obj, itm);
		itm = jwplayer.utils.parsers.jwparser.parseEntry(obj, itm);
		return new jwplayer.html5.playlistitem(itm);
	}
	
	
})(jwplayer);
