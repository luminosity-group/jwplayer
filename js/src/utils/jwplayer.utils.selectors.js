/**
 * Selectors for the JW Player.
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.utils.selectors = function(selector, parent) {
		if (!jwplayer.utils.exists(parent)) {
			parent = document;
		}
		selector = jwplayer.utils.strings.trim(selector);
		var selectType = selector.charAt(0);
		if (selectType == "#") {
			return parent.getElementById(selector.substr(1));
		} else if (selectType == ".") {
			if (parent.getElementsByClassName) {
				return parent.getElementsByClassName(selector.substr(1));
			} else {
				return jwplayer.utils.selectors.getElementsByTagAndClass("*", selector.substr(1));
			}
		} else {
			if (selector.indexOf(".") > 0) {
				var selectors = selector.split(".");
				return jwplayer.utils.selectors.getElementsByTagAndClass(selectors[0], selectors[1]);
			} else {
				return parent.getElementsByTagName(selector);
			}
		}
		return null;
	};
	
	jwplayer.utils.selectors.getElementsByTagAndClass = function(tagName, className, parent) {
		var elements = [];
		if (!jwplayer.utils.exists(parent)) {
			parent = document;
		}
		var selected = parent.getElementsByTagName(tagName);
		for (var i = 0; i < selected.length; i++) {
			if (jwplayer.utils.exists(selected[i].className)) {
				var classes = selected[i].className.split(" ");
				for (var classIndex = 0; classIndex < classes.length; classIndex++) {
					if (classes[classIndex] == className) {
						elements.push(selected[i]);
					}
				}
			}
		}
		return elements;
	};
})(jwplayer);
