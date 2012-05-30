/**
 * Parse an XSPF feed and translate it to a playlist.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.xspfparser = function() {
	};
	
	/**
	 * Parse an XSPF playlist for feed items.
	 * @param {Object} dat
	 * @return {Array} arr
	 */
	jwplayer.utils.parsers.xspfparser.parse = function(dat) {
		var arr = [];
		for (var i in dat.childNodes) {
			if (dat.childNodes[i].localName && dat.childNodes[i].localName.toLowerCase() == 'tracklist') {
				for (var j in dat.childNodes[i].childNodes) {
					if (dat.childNodes[i].childNodes[j].localName && dat.childNodes[i].childNodes[j].localName.toLowerCase() == 'track') {
						arr.push(_parseItem(dat.childNodes[i].childNodes[j]));
					}
				}
			}
		}
		return arr;
		
	}
	
	/**
	 * Translate XSPF item to playlist item.
	 * @param {XML} obj
	 * @return {PlaylistItem}
	 */
	function _parseItem(obj) {
		var itm = {};
		for (var i in obj.childNodes) {
			if (!obj.childNodes[i].localName) {
				continue;
			}
			switch (obj.childNodes[i].localName.toLowerCase()) {
				case 'location':
					itm['file'] = obj.childNodes[i].textContent;
					break;
				case 'title':
					itm['title'] = obj.childNodes[i].textContent;
					break;
				case 'annotation':
					itm['description'] = obj.childNodes[i].textContent;
					break;
				case 'info':
					itm['link'] = obj.childNodes[i].textContent;
					break;
				case 'image':
					itm['image'] = obj.childNodes[i].textContent;
					break;
				case 'creator':
					itm['author'] = obj.childNodes[i].textContent;
					break;
				case 'duration':
					itm['duration'] = jwplayer.utils.strings.seconds(obj.childNodes[i].textContent);
					break;
				case 'meta':
					itm[jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'rel')] = obj.childNodes[i].textContent;
					break;
				case 'extension':
					for (var ext in obj.childNodes[i].childNodes) {
						if (obj.childNodes[i].childNodes.ext.localName){
							itm[obj.childNodes[i].childNodes.ext.localName.toLowerCase()] = obj.childNodes[i].childNodes.ext.textContent;		
						}
					}
					break;
			}
		}
		itm = jwplayer.utils.parsers.jwparser.parseEntry(obj, itm);
		return new jwplayer.html5.playlistitem(itm);
	}
	
})(jwplayer);
