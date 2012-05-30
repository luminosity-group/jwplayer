/**
 * Parse iTunes specific RSS feed content into playlists.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {
	jwplayer.utils.parsers.itunesparser = function() {
	};
	
	/** Prefix for the iTunes namespace. **/
	jwplayer.utils.parsers.itunesparser.PREFIX = 'itunes';
	
	/**
	 * Parse a feedentry for iTunes content.
	 *
	 * @param	{XML}		obj		The XML object to parse.
	 * @param	{Object}	itm		The playlistentry to amend the object to.
	 * @return	{Object}			The playlistentry, amended with the iTunes info.
	 * @see RSSParser
	 */
	jwplayer.utils.parsers.itunesparser.parseEntry = function(obj, itm) {
		for (var i in obj.childNodes) {
			if (obj.childNodes[i].prefix == jwplayer.utils.parsers.itunesparser.PREFIX) {
				if (!obj.childNodes[i].localName) {
					continue;
				}
				switch (obj.childNodes[i].localName.toLowerCase()) {
					case 'author':
						itm['author'] = obj.childNodes[i].textContent;
						break;
					case 'duration':
						itm['duration'] = jwplayer.utils.strings.seconds(obj.childNodes[i].textContent);
						break;
					case 'summary':
						itm['description'] = obj.childNodes[i].textContent;
						break;
					case 'keywords':
						itm['tags'] = obj.childNodes[i].textContent;
						break;
				}
			}
		}
		return itm;
	}
})(jwplayer);
