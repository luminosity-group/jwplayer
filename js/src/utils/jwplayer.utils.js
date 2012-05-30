/**
 * Utility methods for the JW Player.
 * 
 * @author zach, pablo
 * @version 5.9
 */
(function(jwplayer) {

	jwplayer.utils = function() {
	};

	/** Returns the true type of an object * */

	/**
	 * 
	 * @param {Object}
	 *            value
	 */
	jwplayer.utils.typeOf = function(value) {
		var s = typeof value;
		if (s === 'object') {
			if (value) {
				if (value instanceof Array) {
					s = 'array';
				}
			} else {
				s = 'null';
			}
		}
		return s;
	};

	/** Merges a list of objects * */
	jwplayer.utils.extend = function() {
		var args = jwplayer.utils.extend['arguments'];
		if (args.length > 1) {
			for ( var i = 1; i < args.length; i++) {
				for ( var element in args[i]) {
					args[0][element] = args[i][element];
				}
			}
			return args[0];
		}
		return null;
	};

	/**
	 * Returns a deep copy of an object.
	 * 
	 * @param {Object}
	 *            obj
	 */
	jwplayer.utils.clone = function(obj) {
		var result;
		var args = jwplayer.utils.clone['arguments'];
		if (args.length == 1) {
			switch (jwplayer.utils.typeOf(args[0])) {
			case "object":
				result = {};
				for ( var element in args[0]) {
					result[element] = jwplayer.utils.clone(args[0][element]);
				}
				break;
			case "array":
				result = [];
				for ( var element in args[0]) {
					result[element] = jwplayer.utils.clone(args[0][element]);
				}
				break;
			default:
				return args[0];
				break;
			}
		}
		return result;
	};

	/** Returns the extension of a file name * */
	jwplayer.utils.extension = function(path) {
		if (!path) { return ""; }
		path = path.substring(path.lastIndexOf("/") + 1, path.length);
		path = path.split("?")[0];
		if (path.lastIndexOf('.') > -1) {
			return path.substr(path.lastIndexOf('.') + 1, path.length)
					.toLowerCase();
		}
		return;
	};

	/** Updates the contents of an HTML element * */
	jwplayer.utils.html = function(element, content) {
		element.innerHTML = content;
	};

	/** Wraps an HTML element with another element * */
	jwplayer.utils.wrap = function(originalElement, appendedElement) {
		if (originalElement.parentNode) {
			originalElement.parentNode.replaceChild(appendedElement,
					originalElement);
		}
		appendedElement.appendChild(originalElement);
	};

	/** Loads an XML file into a DOM object * */
	jwplayer.utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		if (window.XMLHttpRequest) {
			// IE>7, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		} else {
			// IE6
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState === 4) {
				if (xmlhttp.status === 200) {
					if (completecallback) {
						// Handle the case where an XML document was returned with an incorrect MIME type.
						if (!jwplayer.utils.exists(xmlhttp.responseXML)) {
							try {
								if (window.DOMParser) {
									var parsedXML = (new DOMParser()).parseFromString(xmlhttp.responseText,"text/xml");
									if (parsedXML) {
										xmlhttp = jwplayer.utils.extend({}, xmlhttp, {responseXML:parsedXML});
									}
								} else { 
									// Internet Explorer
									parsedXML = new ActiveXObject("Microsoft.XMLDOM");
									parsedXML.async="false";
									parsedXML.loadXML(xmlhttp.responseText);
									xmlhttp = jwplayer.utils.extend({}, xmlhttp, {responseXML:parsedXML});									
								}
							} catch(e) {
								if (errorcallback) {
									errorcallback(xmldocpath);
								}
							}
						}
						completecallback(xmlhttp);
					}
				} else {
					if (errorcallback) {
						errorcallback(xmldocpath);
					}
				}
			}
		};
		try {
			xmlhttp.open("GET", xmldocpath, true);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) {
				errorcallback(xmldocpath);
			}
		}
		return xmlhttp;
	};

	/** Loads a file * */
	jwplayer.utils.load = function(domelement, completecallback, errorcallback) {
		domelement.onreadystatechange = function() {
			if (domelement.readyState === 4) {
				if (domelement.status === 200) {
					if (completecallback) {
						completecallback();
					}
				} else {
					if (errorcallback) {
						errorcallback();
					}
				}
			}
		};
	};

	/** Finds tags in a DOM, returning a new DOM * */
	jwplayer.utils.find = function(dom, tag) {
		return dom.getElementsByTagName(tag);
	};

	/** * */

	/** Appends an HTML element to another element HTML element * */
	jwplayer.utils.append = function(originalElement, appendedElement) {
		originalElement.appendChild(appendedElement);
	};

	/**
	 * Detects whether the current browser is IE !+"\v1" technique from
	 * http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	 * Note - this detection no longer works for IE9, hence the detection for
	 * window.ActiveXObject
	 */
	jwplayer.utils.isIE = function() {
		return ((!+"\v1") || (typeof window.ActiveXObject != "undefined"));
	};

	jwplayer.utils.userAgentMatch = function(regex) {
		var agent = navigator.userAgent.toLowerCase();
		return (agent.match(regex) !== null);
	};
	
	/**
	 * Detects whether the current browser is mobile Safari.
	 */
	jwplayer.utils.isIOS = function() {
		return jwplayer.utils.userAgentMatch(/iP(hone|ad|od)/i);
	};
	
	jwplayer.utils.isIPad = function() {
		return jwplayer.utils.userAgentMatch(/iPad/i);
	};

	jwplayer.utils.isIPod = function() {
		return jwplayer.utils.userAgentMatch(/iP(hone|od)/i);
	};
	
	jwplayer.utils.isAndroid = function() {
		return jwplayer.utils.userAgentMatch(/android/i);
	};

	/**
	 * Detects whether the current browser is Android 2.0, 2.1 or 2.2 which do
	 * have some support for HTML5
	 */
	jwplayer.utils.isLegacyAndroid = function() {
		return jwplayer.utils.userAgentMatch(/android 2.[012]/i);
	};

	
	jwplayer.utils.isBlackberry = function() {
		return jwplayer.utils.userAgentMatch(/blackberry/i);
	};
	
	/** Matches iOS and Android devices **/	
	jwplayer.utils.isMobile = function() {
		return jwplayer.utils.userAgentMatch(/(iP(hone|ad|od))|android/i);
	}


	jwplayer.utils.getFirstPlaylistItemFromConfig = function(config) {
		var item = {};
		var playlistItem;
		if (config.playlist && config.playlist.length) {
			playlistItem = config.playlist[0];
		} else {
			playlistItem = config;
		}
		item.file = playlistItem.file;
		item.levels = playlistItem.levels;
		item.streamer = playlistItem.streamer;
		item.playlistfile = playlistItem.playlistfile;

		item.provider = playlistItem.provider;
		if (!item.provider) {
			if (item.file
					&& (item.file.toLowerCase().indexOf("youtube.com") > -1 || item.file
							.toLowerCase().indexOf("youtu.be") > -1)) {
				item.provider = "youtube";
			}
			if (item.streamer
					&& item.streamer.toLowerCase().indexOf("rtmp://") == 0) {
				item.provider = "rtmp";
			}
			if (playlistItem.type) {
				item.provider = playlistItem.type.toLowerCase();
			}
		}
		
		if (item.provider == "audio") {
			item.provider = "sound";
		}

		return item;
	}

	/**
	 * Replacement for "outerHTML" getter (not available in FireFox)
	 */
	jwplayer.utils.getOuterHTML = function(element) {
		if (element.outerHTML) {
			return element.outerHTML;
		} else {
			try {
				return new XMLSerializer().serializeToString(element);
			} catch (err) {
				return "";
			}
		}
	};

	/**
	 * Replacement for outerHTML setter (not available in FireFox)
	 */
	jwplayer.utils.setOuterHTML = function(element, html) {
		if (element.outerHTML) {
			element.outerHTML = html;
		} else {
			var el = document.createElement('div');
			el.innerHTML = html;
			var range = document.createRange();
			range.selectNodeContents(el);
			var documentFragment = range.extractContents();
			element.parentNode.insertBefore(documentFragment, element);
			element.parentNode.removeChild(element);
		}
	};

	/**
	 * Detects whether or not the current player has flash capabilities TODO:
	 * Add minimum flash version constraint: 9.0.115
	 */
	jwplayer.utils.hasFlash = function() {
		if (typeof navigator.plugins != "undefined"
				&& typeof navigator.plugins['Shockwave Flash'] != "undefined") {
			return true;
		}
		if (typeof window.ActiveXObject != "undefined") {
			try {
				new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				return true
			} catch (err) {
			}
		}
		return false;
	};

	/**
	 * Extracts a plugin name from a string
	 */
	jwplayer.utils.getPluginName = function(pluginName) {
		if (pluginName.lastIndexOf("/") >= 0) {
			pluginName = pluginName.substring(pluginName.lastIndexOf("/") + 1,
					pluginName.length);
		}
		if (pluginName.lastIndexOf("-") >= 0) {
			pluginName = pluginName.substring(0, pluginName.lastIndexOf("-"));
		}
		if (pluginName.lastIndexOf(".swf") >= 0) {
			pluginName = pluginName
					.substring(0, pluginName.lastIndexOf(".swf"));
		}
		if (pluginName.lastIndexOf(".js") >= 0) {
			pluginName = pluginName.substring(0, pluginName.lastIndexOf(".js"));
		}
		return pluginName;
	};

	/**
	 * Extracts a plugin version from a string
	 */
	jwplayer.utils.getPluginVersion = function(pluginName) {
		if (pluginName.lastIndexOf("-") >= 0) {
			if (pluginName.lastIndexOf(".js") >= 0) {
				return pluginName.substring(pluginName.lastIndexOf("-") + 1,
						pluginName.lastIndexOf(".js"));
			} else if (pluginName.lastIndexOf(".swf") >= 0) {
				return pluginName.substring(pluginName.lastIndexOf("-") + 1,
						pluginName.lastIndexOf(".swf"));
			} else {
				return pluginName.substring(pluginName.lastIndexOf("-") + 1);
			}
		}
		return "";
	};

	/** Gets an absolute file path based on a relative filepath * */
	jwplayer.utils.getAbsolutePath = function(path, base) {
		if (!jwplayer.utils.exists(base)) {
			base = document.location.href;
		}
		if (!jwplayer.utils.exists(path)) {
			return undefined;
		}
		if (isAbsolutePath(path)) {
			return path;
		}
		var protocol = base.substring(0, base.indexOf("://") + 3);
		var domain = base.substring(protocol.length, base.indexOf('/',
				protocol.length + 1));
		var patharray;
		if (path.indexOf("/") === 0) {
			patharray = path.split("/");
		} else {
			var basepath = base.split("?")[0];
			basepath = basepath.substring(protocol.length + domain.length + 1,
					basepath.lastIndexOf('/'));
			patharray = basepath.split("/").concat(path.split("/"));
		}
		var result = [];
		for ( var i = 0; i < patharray.length; i++) {
			if (!patharray[i] || !jwplayer.utils.exists(patharray[i])
					|| patharray[i] == ".") {
				continue;
			} else if (patharray[i] == "..") {
				result.pop();
			} else {
				result.push(patharray[i]);
			}
		}
		return protocol + domain + "/" + result.join("/");
	};

	function isAbsolutePath(path) {
		if (!jwplayer.utils.exists(path)) {
			return;
		}
		var protocol = path.indexOf("://");
		var queryparams = path.indexOf("?");
		return (protocol > 0 && (queryparams < 0 || (queryparams > protocol)));
	}

	/**
	 * Types of plugin paths
	 */
	jwplayer.utils.pluginPathType = {
		// TODO: enum
		ABSOLUTE : "ABSOLUTE",
		RELATIVE : "RELATIVE",
		CDN : "CDN"
	}

	/*
	 * Test cases getPathType('hd') getPathType('hd-1') getPathType('hd-1.4')
	 * 
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd.swf')
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd-1.swf')
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd-1.4.swf')
	 * 
	 * getPathType('./hd.swf') getPathType('./hd-1.swf')
	 * getPathType('./hd-1.4.swf')
	 */
	jwplayer.utils.getPluginPathType = function(path) {
		if (typeof path != "string") {
			return;
		}
		path = path.split("?")[0];
		var protocol = path.indexOf("://");
		if (protocol > 0) {
			return jwplayer.utils.pluginPathType.ABSOLUTE;
		}
		var folder = path.indexOf("/");
		var extension = jwplayer.utils.extension(path);
		if (protocol < 0 && folder < 0 && (!extension || !isNaN(extension))) {
			return jwplayer.utils.pluginPathType.CDN;
		}
		return jwplayer.utils.pluginPathType.RELATIVE;
	};

	jwplayer.utils.mapEmpty = function(map) {
		for ( var val in map) {
			return false;
		}
		return true;
	};

	jwplayer.utils.mapLength = function(map) {
		var result = 0;
		for ( var val in map) {
			result++;
		}
		return result;
	};

	/** Logger * */
	jwplayer.utils.log = function(msg, obj) {
		if (typeof console != "undefined" && typeof console.log != "undefined") {
			if (obj) {
				console.log(msg, obj);
			} else {
				console.log(msg);
			}
		}
	};

	/**
	 * 
	 * @param {Object}
	 *            domelement
	 * @param {Object}
	 *            styles
	 * @param {Object}
	 *            debug
	 */
	jwplayer.utils.css = function(domelement, styles, debug) {
		if (jwplayer.utils.exists(domelement)) {
			for ( var style in styles) {
				try {
					if (typeof styles[style] === "undefined") {
						continue;
					} else if (typeof styles[style] == "number"
							&& !(style == "zIndex" || style == "opacity")) {
						if (isNaN(styles[style])) {
							continue;
						}
						if (style.match(/color/i)) {
							styles[style] = "#"
									+ jwplayer.utils.strings.pad(styles[style]
											.toString(16), 6);
						} else {
							styles[style] = Math.ceil(styles[style]) + "px";
						}
					}
					domelement.style[style] = styles[style];
				} catch (err) {
				}
			}
		}
	};

	jwplayer.utils.isYouTube = function(path) {
		return (path.indexOf("youtube.com") > -1 || path.indexOf("youtu.be") > -1);
	};

	/**
	 * 
	 * @param {Object}
	 *            domelement
	 * @param {Object}
	 *            xscale
	 * @param {Object}
	 *            yscale
	 * @param {Object}
	 *            xoffset
	 * @param {Object}
	 *            yoffset
	 */
	jwplayer.utils.transform = function(domelement, xscale, yscale, xoffset, yoffset) {
		// Set defaults
		if (!jwplayer.utils.exists(xscale)) xscale = 1;
		if (!jwplayer.utils.exists(yscale)) yscale = 1;
		if (!jwplayer.utils.exists(xoffset)) xoffset = 0;
		if (!jwplayer.utils.exists(yoffset)) yoffset = 0;
		
		if (xscale == 1 && yscale == 1 && xoffset == 0 && yoffset == 0) {
			domelement.style.webkitTransform = "";
			domelement.style.MozTransform = "";
			domelement.style.OTransform = "";
		} else {
			var value = "scale("+xscale+","+yscale+") translate("+xoffset+"px,"+yoffset+"px)";
			
			domelement.style.webkitTransform = value;
			domelement.style.MozTransform = value;
			domelement.style.OTransform = value;
		}
	};

	/**
	 * Stretches domelement based on stretching. parentWidth, parentHeight,
	 * elementWidth, and elementHeight are required as the elements dimensions
	 * change as a result of the stretching. Hence, the original dimensions must
	 * always be supplied.
	 * 
	 * @param {String}
	 *            stretching
	 * @param {DOMElement}
	 *            domelement
	 * @param {Number}
	 *            parentWidth
	 * @param {Number}
	 *            parentHeight
	 * @param {Number}
	 *            elementWidth
	 * @param {Number}
	 *            elementHeight
	 */
	jwplayer.utils.stretch = function(stretching, domelement, parentWidth,
			parentHeight, elementWidth, elementHeight) {
		if (typeof parentWidth == "undefined"
				|| typeof parentHeight == "undefined"
				|| typeof elementWidth == "undefined"
				|| typeof elementHeight == "undefined") {
			return;
		}
		var xscale = parentWidth / elementWidth;
		var yscale = parentHeight / elementHeight;
		var x = 0;
		var y = 0;
		var transform = false;
		var style = {};
		
		if (domelement.parentElement) {
			domelement.parentElement.style.overflow = "hidden";
		}
		
		jwplayer.utils.transform(domelement);		

		switch (stretching.toUpperCase()) {
		case jwplayer.utils.stretching.NONE:
			// Maintain original dimensions
			style.width = elementWidth;
			style.height = elementHeight;
			style.top = (parentHeight - style.height) / 2;
			style.left = (parentWidth - style.width) / 2;
			break;
		case jwplayer.utils.stretching.UNIFORM:
			// Scale on the dimension that would overflow most
			if (xscale > yscale) {
				// Taller than wide
				style.width = elementWidth * yscale;
				style.height = elementHeight * yscale;
				if (style.width/parentWidth > 0.95) {
					transform = true;
					xscale = Math.ceil(100 * parentWidth / style.width) / 100;
					yscale = 1;
					style.width = parentWidth;
				}
			} else {
				// Wider than tall
				style.width = elementWidth * xscale;
				style.height = elementHeight * xscale;
				if (style.height/parentHeight > 0.95) {
					transform = true;
					xscale = 1;
					yscale = Math.ceil(100 * parentHeight / style.height) / 100;
					style.height = parentHeight;
				}
			}
			style.top = (parentHeight - style.height) / 2;
			style.left = (parentWidth - style.width) / 2;
			break;
		case jwplayer.utils.stretching.FILL:
			// Scale on the smaller dimension and crop
			if (xscale > yscale) {
				style.width = elementWidth * xscale;
				style.height = elementHeight * xscale;
			} else {
				style.width = elementWidth * yscale;
				style.height = elementHeight * yscale;
			}
			style.top = (parentHeight - style.height) / 2;
			style.left = (parentWidth - style.width) / 2;
			break;
		case jwplayer.utils.stretching.EXACTFIT:
			// Distort to fit
//			jwplayer.utils.transform(domelement, [ "scale(", xscale, ",",
//					yscale, ")", " translate(0px,0px)" ].join(""));
			style.width = elementWidth;
			style.height = elementHeight;
			
		    var xoff = Math.round((elementWidth / 2) * (1-1/xscale));
	        var yoff = Math.round((elementHeight / 2) * (1-1/yscale));
			
	        transform = true;
			//style.width = style.height = "100%";
			style.top = style.left = 0;

			break;
		default:
			break;
		}

		if (transform) {
			jwplayer.utils.transform(domelement, xscale, yscale, xoff, yoff);
		}

		jwplayer.utils.css(domelement, style);
	};

	// TODO: enum
	jwplayer.utils.stretching = {
		NONE : "NONE",
		FILL : "FILL",
		UNIFORM : "UNIFORM",
		EXACTFIT : "EXACTFIT"
	};

	/**
	 * Recursively traverses nested object, replacing key names containing a
	 * search string with a replacement string.
	 * 
	 * @param searchString
	 *            The string to search for in the object's key names
	 * @param replaceString
	 *            The string to replace in the object's key names
	 * @returns The modified object.
	 */
	jwplayer.utils.deepReplaceKeyName = function(obj, searchString, replaceString) {
		switch (jwplayer.utils.typeOf(obj)) {
		case "array":
			for ( var i = 0; i < obj.length; i++) {
				obj[i] = jwplayer.utils.deepReplaceKeyName(obj[i],
						searchString, replaceString);
			}
			break;
		case "object":
			for ( var key in obj) {
				var searches, replacements;
				if (searchString instanceof Array && replaceString instanceof Array) {
					if (searchString.length != replaceString.length)
						continue;
					else {
						searches = searchString;
						replacements = replaceString;
					}
				} else {
					searches = [searchString];
					replacements = [replaceString];
				}
				var newkey = key;
				for (var i=0; i < searches.length; i++) {
					newkey = newkey.replace(new RegExp(searchString[i], "g"), replaceString[i]);
				}
				obj[newkey] = jwplayer.utils.deepReplaceKeyName(obj[key], searchString, replaceString);
				if (key != newkey) {
					delete obj[key];
				}
			}
			break;
		}
		return obj;
	}

	/**
	 * Returns true if an element is found in a given array
	 * 
	 * @param array
	 *            The array to search
	 * @param search
	 *            The element to search
	 */
	jwplayer.utils.isInArray = function(array, search) {
		if (!(array) || !(array instanceof Array)) {
			return false;
		}

		for ( var i = 0; i < array.length; i++) {
			if (search === array[i]) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if the value of the object is null, undefined or the empty
	 * string
	 * 
	 * @param a
	 *            The variable to inspect
	 */
	jwplayer.utils.exists = function(a) {
		switch (typeof (a)) {
		case "string":
			return (a.length > 0);
			break;
		case "object":
			return (a !== null);
		case "undefined":
			return false;
		}
		return true;
	}
	
	/**
	 * Removes all of an HTML container's child nodes
	 **/
	jwplayer.utils.empty = function(elem) {
		if (typeof elem.hasChildNodes == "function") {
			while(elem.hasChildNodes()) {
				elem.removeChild(elem.firstChild);
			}
		}
	}
	
	/**
	 * Cleans up a css dimension (e.g. '420px') and returns an integer.
	 */
	jwplayer.utils.parseDimension = function(dimension) {
		if (typeof dimension == "string") {
			if (dimension === "") {
				return 0;
			} else if (dimension.lastIndexOf("%") > -1) {
				return dimension;
			} else {
				return parseInt(dimension.replace("px", ""), 10);
			}
		}
		return dimension;
	}
	
	/**
	 * Returns dimensions (x,y,width,height) of a display object
	 */
	jwplayer.utils.getDimensions = function(obj) {
		if (obj && obj.style) {
			return {
				x: jwplayer.utils.parseDimension(obj.style.left),
				y: jwplayer.utils.parseDimension(obj.style.top),
				width: jwplayer.utils.parseDimension(obj.style.width),
				height: jwplayer.utils.parseDimension(obj.style.height)
			};
		} else {
			return {};
		}
	}

	/**
	 * Gets the clientWidth of an element, or returns its style.width
	 */
	jwplayer.utils.getElementWidth = function(obj) {
		if (!obj) {
			return null;
		} else if (obj == document.body) {
			return jwplayer.utils.parentNode(obj).clientWidth;
		} else if (obj.clientWidth > 0) {
			return obj.clientWidth;
		} else if (obj.style) {
			return jwplayer.utils.parseDimension(obj.style.width);
		} else {
			return null;
		}
	}

	/**
	 * Gets the clientHeight of an element, or returns its style.height
	 */
	jwplayer.utils.getElementHeight = function(obj) {
		if (!obj) {
			return null;
		} else if (obj == document.body) {
			return jwplayer.utils.parentNode(obj).clientHeight;
		} else if (obj.clientHeight > 0) {
			return obj.clientHeight;
		} else if (obj.style) {
			return jwplayer.utils.parseDimension(obj.style.height);
		} else {
			return null;
		}
	}

	
	
	/** Format the elapsed / remaining text. **/
	jwplayer.utils.timeFormat = function(sec) {
		str = "00:00";
		if (sec > 0) {
			str = Math.floor(sec / 60) < 10 ? "0" + Math.floor(sec / 60) + ":" : Math.floor(sec / 60) + ":";
			str += Math.floor(sec % 60) < 10 ? "0" + Math.floor(sec % 60) : Math.floor(sec % 60);
		}
		return str;
	}
	

	/** Returns true if the player should use the browser's native fullscreen mode **/
	jwplayer.utils.useNativeFullscreen = function() {
		//return jwplayer.utils.isIOS();
		return (navigator && navigator.vendor && navigator.vendor.indexOf("Apple") == 0);
	}

	/** Returns an element's parent element.  If no parent is available, return the element itself **/
	jwplayer.utils.parentNode = function(element) {
		if (!element) {
			return docuemnt.body;
		} else if (element.parentNode) {
			return element.parentNode;
		} else if (element.parentElement) {
			return element.parentElement;
		} else {
			return element;
		}
	}
	
	/** Replacement for getBoundingClientRect, which isn't supported in iOS 3.1.2 **/
	jwplayer.utils.getBoundingClientRect = function(element) {
		if (typeof element.getBoundingClientRect == "function") {
			return element.getBoundingClientRect();
		} else {
			return { 
				left: element.offsetLeft + document.body.scrollLeft, 
				top: element.offsetTop + document.body.scrollTop, 
				width: element.offsetWidth, 
				height: element.offsetHeight
			};
		}
	}
	
	/* Normalizes differences between Flash and HTML5 internal players' event responses. */
	jwplayer.utils.translateEventResponse = function(type, eventProperties) {
		var translated = jwplayer.utils.extend({}, eventProperties);
		if (type == jwplayer.api.events.JWPLAYER_FULLSCREEN && !translated.fullscreen) {
			translated.fullscreen = translated.message == "true" ? true : false;
			delete translated.message;
		} else if (typeof translated.data == "object") {
			// Takes ViewEvent "data" block and moves it up a level
			translated = jwplayer.utils.extend(translated, translated.data);
			delete translated.data;
		} else if (typeof translated.metadata == "object") {
			jwplayer.utils.deepReplaceKeyName(translated.metadata, ["__dot__","__spc__","__dsh__"], ["."," ","-"]);
		}
		
		var rounders = ["position", "duration", "offset"];
		for (var rounder in rounders) {
			if (translated[rounders[rounder]]) {
				translated[rounders[rounder]] = Math.round(translated[rounders[rounder]] * 1000) / 1000;
			}
		}
		
		return translated;
	}
	
	jwplayer.utils.saveCookie = function(name, value) {
		document.cookie = "jwplayer." + name + "=" + value + "; path=/";
	}

	jwplayer.utils.getCookies = function() {
		var jwCookies = {};
		var cookies = document.cookie.split('; ');
		for (var i=0; i<cookies.length; i++) {
			var split = cookies[i].split('=');
			if (split[0].indexOf("jwplayer.") == 0) {
				jwCookies[split[0].substring(9, split[0].length)] = split[1];
			}
		}
		return jwCookies;
	}
	
	jwplayer.utils.readCookie = function(name) {
		return jwplayer.utils.getCookies()[name];
	}

})(jwplayer);
