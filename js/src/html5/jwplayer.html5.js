/**
 * Core component of the JW Player (initialization, API).
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.html5 = function(container) {
		var _container = container;
		
		this.setup = function(options) {
			jwplayer.utils.extend(this, new jwplayer.html5.api(_container, options));
			return this;
		};
		
		return this;
	};
})(jwplayer);

