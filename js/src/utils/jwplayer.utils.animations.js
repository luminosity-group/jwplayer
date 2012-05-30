/**
 * Utility methods for the JW Player.
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	var _animations = {};
	
	jwplayer.utils.animations = function() {
	};
	
	jwplayer.utils.animations.transform = function(domelement, value) {
		domelement.style.webkitTransform = value;
		domelement.style.MozTransform = value;
		domelement.style.OTransform = value;
		domelement.style.msTransform = value;
	};
	
	jwplayer.utils.animations.transformOrigin = function(domelement, value) {
		domelement.style.webkitTransformOrigin = value;
		domelement.style.MozTransformOrigin = value;
		domelement.style.OTransformOrigin = value;
		domelement.style.msTransformOrigin = value;
	};
	
	jwplayer.utils.animations.rotate = function(domelement, deg) {
		jwplayer.utils.animations.transform(domelement, ["rotate(", deg, "deg)"].join(""));
	};
	
	jwplayer.utils.cancelAnimation = function(domelement) {
		delete _animations[domelement.id];
	};
	
	jwplayer.utils.fadeTo = function(domelement, endAlpha, time, startAlpha, delay, startTime) {
		// Interrupting
		if (_animations[domelement.id] != startTime && jwplayer.utils.exists(startTime)) {
			return;
		}
		// No need to fade if the opacity is already where we're going
		if (domelement.style.opacity == endAlpha) {
			return;
		}
		
		var currentTime = new Date().getTime();
		if (startTime > currentTime) {
			setTimeout(function() {
				jwplayer.utils.fadeTo(domelement, endAlpha, time, startAlpha, 0, startTime);
			}, startTime - currentTime);
		}
		if (domelement.style.display == "none") {
			domelement.style.display = "block";
		}
		if (!jwplayer.utils.exists(startAlpha)) {
			startAlpha = domelement.style.opacity === "" ? 1 : domelement.style.opacity;
		}
		if (domelement.style.opacity == endAlpha && domelement.style.opacity !== "" && jwplayer.utils.exists(startTime)) {
			if (endAlpha === 0) {
				domelement.style.display = "none";
			}
			return;
		}
		if (!jwplayer.utils.exists(startTime)) {
			startTime = currentTime;
			_animations[domelement.id] = startTime;
		}
		if (!jwplayer.utils.exists(delay)) {
			delay = 0;
		}
		var percentTime = (time > 0) ? ((currentTime - startTime) / (time * 1000)) : 0;
		percentTime = percentTime > 1 ? 1 : percentTime;
		var delta = endAlpha - startAlpha;
		var alpha = startAlpha + (percentTime * delta);
		if (alpha > 1) {
			alpha = 1;
		} else if (alpha < 0) {
			alpha = 0;
		}
		domelement.style.opacity = alpha;
		if (delay > 0) {
			_animations[domelement.id] = startTime + delay * 1000;
			jwplayer.utils.fadeTo(domelement, endAlpha, time, startAlpha, 0, _animations[domelement.id]);
			return;
		}
		setTimeout(function() {
			jwplayer.utils.fadeTo(domelement, endAlpha, time, startAlpha, 0, startTime);
		}, 10);
	};
})(jwplayer);
