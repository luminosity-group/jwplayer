/**
 * Event dispatcher for the JW Player for HTML5
 *
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {
	jwplayer.html5.eventdispatcher = function(id, debug) {
		var _eventDispatcher = new jwplayer.events.eventdispatcher(debug);
		jwplayer.utils.extend(this, _eventDispatcher);
		
		/** Send an event **/
		this.sendEvent = function(type, data) {
			if (!jwplayer.utils.exists(data)) {
				data = {};
			}
			jwplayer.utils.extend(data, {
				id: id,
				version: jwplayer.version,
				type: type
			});
			_eventDispatcher.sendEvent(type, data);
		};
	};
})(jwplayer);
