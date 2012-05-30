/**
 * Loads a <script> tag
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {
	//TODO: Enum
	jwplayer.utils.loaderstatus = {
		NEW: "NEW",
		LOADING: "LOADING",
		ERROR: "ERROR",
		COMPLETE: "COMPLETE"
	};
	
	jwplayer.utils.scriptloader = function(url) {
		var _status = jwplayer.utils.loaderstatus.NEW;
		var _eventDispatcher = new jwplayer.events.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		this.load = function() {
			if (_status == jwplayer.utils.loaderstatus.NEW) {
				_status = jwplayer.utils.loaderstatus.LOADING;
				var scriptTag = document.createElement("script");
				// Most browsers
				scriptTag.onload = function(evt) {
					_status = jwplayer.utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
				}
				scriptTag.onerror = function(evt) {
					_status = jwplayer.utils.loaderstatus.ERROR;
					_eventDispatcher.sendEvent(jwplayer.events.ERROR);
				}
				// IE
				scriptTag.onreadystatechange = function() {
					if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
						_status = jwplayer.utils.loaderstatus.COMPLETE;
						_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
					}
					// Error?
				}
				document.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;
			}
			
		};
		
		this.getStatus = function() {
			return _status;
		}
	}
})(jwplayer);
