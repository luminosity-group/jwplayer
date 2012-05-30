/**
 * Parse an SMIL feed and translate it to a playlist.
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {

	jwplayer.utils.parsers.smilparser = function() {
	};
	
	/**
	 * Parse an SMIL playlist for feeditems.
	 *
	 * @param {Object} dat
	 * @return {Array} playlistarray
	 */
	jwplayer.utils.parsers.smilparser.parse = function(dat) {
		var arr = [];
		for (var i in dat.childNodes) {
			if (dat.childNodes[i].localName && dat.childNodes[i].localName.toLowerCase() == 'body') {
				for (var j in dat.childNodes[i].childNodes) {
					var elm = dat.childNodes[i].childNodes[j];
					if (elm.localName && elm.localName.toLowerCase() == 'seq') {
						for (var k in elm.childNodes) {
							if (elm.childNodes[k].localName) {
								arr.push(new jwplayer.html5.playlistitem(_parseSeq(elm.childNodes[k])));
							}
						}
					} else {
						//arr.push(_parseItem(elm));
					}
					
				}
			}
		}
		return arr;
	};
	
	/**
	 *
	 * @param {XML} obj
	 * @return {PlaylistItem}
	 */
	function _parseItem(obj) {
		return new jwplayer.html5.playlistitem(_parsePar(obj));
	};
	
	
	/**
	 * Translate SMIL sequence item to playlistitem.
	 * @param {XML} obj
	 * @return {Object} obj
	 */
	function _parseSeq(obj) {
		var itm = {};
		switch (obj.localName.toLowerCase()) {
			case 'par':
				itm = _parsePar(obj);
				break;
			case 'img':
			case 'video':
			case 'audio':
				itm = _parseAttributes(obj, itm);
				break;
			default:
				break;
		}
		return itm;
	}
	
	/** 
	 * Translate a SMIL par group to playlistitem
	 *
	 * @param {XML} obj
	 * @return {Object} obj
	 */
	function _parsePar(obj) {
		var itm = {};
		for (var i in obj.childNodes) {
			if (!obj.childNodes[i].localName) {
				continue;
			}
			switch (obj.childNodes[i].localName.toLowerCase()) {
				case 'anchor':
					itm['link'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'href');
					break;
				case 'img':
					if (itm['file']) {
						itm['image'] = jwplayer.utils.strings.xmlAttribute(obj.childNodes[i], 'src');
						break;
					} else {
						itm = _parseAttributes(obj.childNodes[i], itm);
					}
					break;
				case 'video':
				case 'audio':
					itm = _parseAttributes(obj.childNodes[i], itm);
					break;
				default:
					break;
			}
		}
		itm = jwplayer.utils.parsers.jwparser.parseEntry(obj, itm);
		return itm;
	}
	
	/** 
	 * Get attributes from a SMIL element.
	 *
	 * @param {XML} obj
	 * @param {Object} itm
	 * @return {Object} obj
	 */
	function _parseAttributes(obj, itm) {
		for (var i = 0; i < obj.attributes.length; i++) {
			var att = obj.attributes[i].name.toString();
			switch (att) {
				case 'begin':
					itm['start'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj, 'begin'));
					break;
				case 'src':
					itm['file'] = jwplayer.utils.strings.xmlAttribute(obj, 'src');
					break;
				case 'dur':
					itm['duration'] = jwplayer.utils.strings.seconds(jwplayer.utils.strings.xmlAttribute(obj, 'dur'));
					break;
				case 'alt':
					itm['description'] = jwplayer.utils.strings.xmlAttribute(obj, 'alt');
					break;
				default:
					itm[att] = obj.attributes[i].toString();
					break;
			}
		}
		return itm;
	}
})(jwplayer);
