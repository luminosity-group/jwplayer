/**
 * Parse a feed item for JWPlayer content.
 *
 * @author zach
 * @version 5.7
 */
(function(jwplayer) {

	jwplayer.utils.parsers.jwparser = function() {
	};
	
	jwplayer.utils.parsers.jwparser.PREFIX = 'jwplayer';
	
	/**
	 * Parse a feed entry for JWPlayer content.
	 *
	 * @param	{XML}		obj	The XML object to parse.
	 * @param	{Object}	itm	The playlistentry to amend the object to.
	 * @return	{Object}		The playlistentry, amended with the JWPlayer info.
	 * @see			ASXParser
	 * @see			ATOMParser
	 * @see			RSSParser
	 * @see			SMILParser
	 * @see			XSPFParser
	 */
	jwplayer.utils.parsers.jwparser.parseEntry = function(obj, itm) {
		for (var i = 0; i < obj.childNodes.length; i++) {
			if (obj.childNodes[i].prefix == jwplayer.utils.parsers.jwparser.PREFIX) {
				itm[jwplayer.utils.parsers.localName(obj.childNodes[i])] = jwplayer.utils.strings.serialize(jwplayer.utils.parsers.textContent(obj.childNodes[i]));
				if (jwplayer.utils.parsers.localName(obj.childNodes[i]) == "file" && itm.levels) {
					// jwplayer namespace file should override existing level (probably set in MediaParser)
					delete itm.levels;
				}
			}
			if (!itm['file'] && String(itm['link']).toLowerCase().indexOf('youtube') > -1) {
				itm['file'] = itm['link'];
			}
		}
		return itm;
	}
	
	/**
	 * Determine the provider of an item
	 * @param {Object} item
	 * @return {String} provider
	 */
	jwplayer.utils.parsers.jwparser.getProvider = function(item) {
		if (item['type']) {
			return item['type'];
		} else if (item['file'].indexOf('youtube.com/w') > -1 
					|| item['file'].indexOf('youtube.com/v') > -1
					|| item['file'].indexOf('youtu.be/') > -1 ) {
			return "youtube";
		} else if (item['streamer'] && item['streamer'].indexOf('rtmp') == 0) {
			return "rtmp";
		} else if (item['streamer'] && item['streamer'].indexOf('http') == 0) {
			return "http";
		} else {
			var ext = jwplayer.utils.strings.extension(item['file']);
			if (extensions.hasOwnProperty(ext)) {
				return extensions[ext];
			}
		}
		return "";
	}
	
})(jwplayer);
