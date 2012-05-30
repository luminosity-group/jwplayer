/**
 * Parse an ASX feed and translate it to a playlist.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.asxparser = function() {
	};
	
	/**
	 * Parse an ASX playlist for feed items.
	 *
	 * @param {Object} dat
	 * @return {Array} playlistarray
	 */
	jwplayer.utils.parsers.asxparser.parse = function(dat) {
		var arr = [];
		for (var i in dat.childNodes) {
			if (dat.childNodes[i].localName && dat.childNodes[i].localName.toLowerCase() == 'entry') {
				arr.push(_parseItem(dat.childNodes[i]));
			}
		}
		return arr;
	}
	
	/** 
	 * Translate ASX item to playlist item.
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
				case 'ref':
					itm['file'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'href');
					break;
				case 'title':
					itm['title'] = obj.childNodes[i].textContent;
					break;
				case 'moreinfo':
					itm['link'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'href');
					break;
				case 'abstract':
					itm['description'] = obj.childNodes[i].textContent;
					break;
				case 'author':
					itm['author'] = obj.childNodes[i].textContent;
					break;
				case 'duration':
					itm['duration'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'value'));
					break;
				case 'starttime':
					itm['start'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'value'));
					break;
				case 'param':
					itm[jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'name')] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'value');
					break;
			}
		}
		itm = jwplayer.utils.parsers.jwparser.parseEntry(obj, itm);
		return new jwplayer.html5.playlistitem(itm);
	}
	
})(jwplayer);
