/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 *
 * author zach
 * version 5.7
 */
(function(jwplayer) {

	jwplayer.utils.parsers.mediaparser = function() {
	};
	
	/** Prefix for the JW Player namespace. **/
	jwplayer.utils.parsers.mediaparser.PREFIX = 'media';
	
	/**
	 * Parse a feeditem for Yahoo MediaRSS extensions.
	 * The 'content' and 'group' elements can nest other MediaRSS elements.
	 * @param	{XML}		obj		The entire MRSS XML object.
	 * @param	{Object}	itm		The playlistentry to amend the object to.
	 * @return	{Object}			The playlistentry, amended with the MRSS info.
	 * @see ATOMParser
	 * @see RSSParser
	 **/
	jwplayer.utils.parsers.mediaparser.parseGroup = function(obj, itm) {
		var ytp = false;
		
		for (var i = 0; i < obj.childNodes.length; i++) {
			if (obj.childNodes[i].prefix == jwplayer.utils.parsers.mediaparser.PREFIX) {
				if (!jwplayer.utils.parsers.localName(obj.childNodes[i])){
					continue;
				}
				switch (jwplayer.utils.parsers.localName(obj.childNodes[i]).toLowerCase()) {
					case 'content':
						if (!ytp) {
							itm['file'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url');
						}
						if (jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'duration')) {
							itm['duration'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'duration'));
						}
						if (jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'start')) {
							itm['start'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'start'));
						}
						if (obj.childNodes[i].childNodes && obj.childNodes[i].childNodes.length > 0) {
							itm = jwplayer.utils.parsers.mediaparser.parseGroup(obj.childNodes[i], itm);
						}
						if (jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'width')
								|| jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'bitrate')
								|| jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url')) {
							if (!itm.levels) {
								itm.levels = [];
							}
							itm.levels.push({
								width: jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'width'),
								bitrate: jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'bitrate'),
								file: jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url')
							});
						}
						break;
					case 'title':
						itm['title'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
						break;
					case 'description':
						itm['description'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
						break;
					case 'keywords':
						itm['tags'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
						break;
					case 'thumbnail':
						itm['image'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url');
						break;
					case 'credit':
						itm['author'] = jwplayer.utils.parsers.textContent(obj.childNodes[i]);
						break;
					case 'player':
						var url = obj.childNodes[i].url;
						if (url.indexOf('youtube.com') >= 0 || url.indexOf('youtu.be') >= 0) {
							ytp = true;
							itm['file'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'url');
						}
						break;
					case 'group':
						jwplayer.utils.parsers.mediaparser.parseGroup(obj.childNodes[i], itm);
						break;
				}
			}
		}
		return itm;
	}
	
})(jwplayer);
