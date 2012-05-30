/**
 * Parser class definition
 *
 * @author zach
 * @version 5.7
 */
(function(jwplayer) {

	jwplayer.utils.parsers = function() {
	};
	
	jwplayer.utils.parsers.localName = function(node) {
		if(!node) {
			return "";
		} else if (node.localName) {
			return node.localName;
		} else if (node.baseName) {
			return node.baseName;
		} else {
			return "";
		}
	}

	jwplayer.utils.parsers.textContent = function(node) {
		if(!node) {
			return "";
		} else if (node.textContent) {
			return node.textContent;
		} else if (node.text) {
			return node.text;
		} else {
			return "";
		}
	}

})(jwplayer);
