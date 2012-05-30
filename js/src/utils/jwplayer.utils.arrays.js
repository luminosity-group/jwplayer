/**
 * Arrays utility class
 * 
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {
	jwplayer.utils.arrays = function(){};
	
	/**
	 * Finds an element in an Array
	 * 
	 * @param {Object} haystack
	 * @param {Object} needle
	 * @return {Number} int
	 */
	jwplayer.utils.arrays.indexOf = function(haystack, needle){
		for (var i = 0; i < haystack.length; i++){
			if (haystack[i] == needle){
				return i;
			}
		}
		return -1;
	};
	
	/**
	 * Removes and element from an array
	 * 
	 * @param {Object} haystack
	 * @param {Object} needle
	 */
	jwplayer.utils.arrays.remove = function(haystack, needle){
		var neeedleIndex = jwplayer.utils.arrays.indexOf(haystack, needle);
		if (neeedleIndex > -1){
			haystack.splice(neeedleIndex, 1);
		}
	};
})(jwplayer);
