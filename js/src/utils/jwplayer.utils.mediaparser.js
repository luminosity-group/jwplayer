/**
 * Parser for the JW Player.
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {

    jwplayer.utils.mediaparser = function() {};

	var elementAttributes = {
		element: {
			width: 'width',
			height: 'height',
			id: 'id',
			'class': 'className',
			name: 'name'
		},
		media: {
			src: 'file',
			preload: 'preload',
			autoplay: 'autostart',
			loop: 'repeat',
			controls: 'controls'
		},
		source: {
			src: 'file',
			type: 'type',
			media: 'media',
			'data-jw-width': 'width',
			'data-jw-bitrate': 'bitrate'
				
		},
		video: {
			poster: 'image'
		}
	};
	
	var parsers = {};
	
	jwplayer.utils.mediaparser.parseMedia = function(element) {
		return parseElement(element);
	};
	
	function getAttributeList(elementType, attributes) {
		if (!jwplayer.utils.exists(attributes)) {
			attributes = elementAttributes[elementType];
		} else {
			jwplayer.utils.extend(attributes, elementAttributes[elementType]);
		}
		return attributes;
	}
	
	function parseElement(domElement, attributes) {
		if (parsers[domElement.tagName.toLowerCase()] && !jwplayer.utils.exists(attributes)) {
			return parsers[domElement.tagName.toLowerCase()](domElement);
		} else {
			attributes = getAttributeList('element', attributes);
			var configuration = {};
			for (var attribute in attributes) {
				if (attribute != "length") {
					var value = domElement.getAttribute(attribute);
					if (jwplayer.utils.exists(value)) {
						configuration[attributes[attribute]] = value;
					}
				}
			}
			var bgColor = domElement.style['#background-color'];
			if (bgColor && !(bgColor == "transparent" || bgColor == "rgba(0, 0, 0, 0)")) {
				configuration.screencolor = bgColor;
			}
			return configuration;
		}
	}
	
	function parseMediaElement(domElement, attributes) {
		attributes = getAttributeList('media', attributes);
		var sources = [];
		var sourceTags = jwplayer.utils.selectors("source", domElement);
		for (var i in sourceTags) {
			if (!isNaN(i)){
				sources.push(parseSourceElement(sourceTags[i]));					
			}
		}
		var configuration = parseElement(domElement, attributes);
		if (jwplayer.utils.exists(configuration.file)) {
			sources[0] = {
				'file': configuration.file
			};
		}
		configuration.levels = sources;
		return configuration;
	}
	
	function parseSourceElement(domElement, attributes) {
		attributes = getAttributeList('source', attributes);
		var result = parseElement(domElement, attributes);
		result.width = result.width ? result.width : 0;
		result.bitrate = result.bitrate ? result.bitrate : 0;
		return result;
	}
	
	function parseVideoElement(domElement, attributes) {
		attributes = getAttributeList('video', attributes);
		var result = parseMediaElement(domElement, attributes);
		return result;
	}
	
	parsers.media = parseMediaElement;
	parsers.audio = parseMediaElement;
	parsers.source = parseSourceElement;
	parsers.video = parseVideoElement;
	
	
})(jwplayer);
