/**
 * jwplayer Playlist component for the JW Player.
 *
 * @author pablo
 * @version 5.8
 */
(function(jwplayer) {
	var _defaults = {
		size: 180,
		position: jwplayer.html5.view.positions.NONE,
		itemheight: 60,
		thumbs: true,
		
		fontcolor: "#000000",
		overcolor: "",
		activecolor: "",
		backgroundcolor: "#f8f8f8",
		font: "_sans",
		fontsize: "",
		fontstyle: "",
		fontweight: ""
	};

	var _fonts = {
		'_sans': "Arial, Helvetica, sans-serif",
		'_serif': "Times, Times New Roman, serif",
		'_typewriter': "Courier New, Courier, monospace"
	}
	
	_utils = jwplayer.utils; 
	_css = _utils.css;
	
	_hide = function(element) {
		_css(element, {
			display: "none"
		});
	};
	
	_show = function(element) {
		_css(element, {
			display: "block"
		});
	};
	
	jwplayer.html5.playlistcomponent = function(api, config) {
		var _api = api;
		var _settings = jwplayer.utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config);
		if (_settings.position == jwplayer.html5.view.positions.NONE
			|| typeof jwplayer.html5.view.positions[_settings.position] == "undefined") {
			return;
		}
		var _wrapper;
		var _width;
		var _height;
		var _playlist;
		var _items;
		var _ul;
		var _lastCurrent = -1;

		var _elements = {
			'background': undefined,
			'item': undefined,
			'itemOver': undefined,
			'itemImage': undefined,
			'itemActive': undefined
		};
		
		this.getDisplayElement = function() {
			return _wrapper;
		};
		
		this.resize = function(width, height) {
			_width = width;
			_height = height;
			if (_api.jwGetFullscreen()) {
				_hide(_wrapper);
			} else {
				var style = {
					display: "block",
					width: _width,
					height: _height
				};
				_css(_wrapper, style);
			}
		};
		
		this.show = function() {
			_show(_wrapper);
		}

		this.hide = function() {
			_hide(_wrapper);
		}


		function _setup() {
			_wrapper = document.createElement("div");
			_wrapper.id = _api.id + "_jwplayer_playlistcomponent";
			_wrapper.style.overflow = "hidden";
			switch(_settings.position) {
			case jwplayer.html5.view.positions.RIGHT:
			case jwplayer.html5.view.positions.LEFT:
				_wrapper.style.width = _settings.size + "px";
				break;
			case jwplayer.html5.view.positions.TOP:				
			case jwplayer.html5.view.positions.BOTTOM:
				_wrapper.style.height = _settings.size + "px";
				break;
			}
			
			_populateSkinElements();
			if (_elements.item) {
				_settings.itemheight = _elements.item.height;
			}
			
			_wrapper.style.backgroundColor = '#C6C6C6';
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			_api.jwAddEventListener(jwplayer.api.events.JWPLAYER_PLAYER_STATE, _stateHandler);
		}
		
		function _createList() {
			var ul = document.createElement("ul");
			_css(ul, {
			    width: _wrapper.style.width,
				minWidth: _wrapper.style.width,
				height: _wrapper.style.height,
		    	backgroundColor: _settings.backgroundcolor,
		    	backgroundImage: _elements.background ? "url("+_elements.background.src+")" : "",
		    			
		    	color: _settings.fontcolor,
		    	listStyle: 'none',
		    	margin: 0,
		    	padding: 0,
		    	fontFamily: _fonts[_settings.font] ? _fonts[_settings.font] : _fonts['_sans'],
		    	fontSize: (_settings.fontsize ? _settings.fontsize : 11) + "px",
		    	fontStyle: _settings.fontstyle,
		    	fontWeight: _settings.fontweight,
		    	
		    	'overflowY': 'auto'
			});
			return ul;
		}
		
		function _itemOver(index) {
			return function() {
				var li = _ul.getElementsByClassName("item")[index];
				var normalColor = _settings.fontcolor;
				var normalBG = _elements.item ? "url("+_elements.item.src+")" : ""
				if (index == _api.jwGetPlaylistIndex()) {
					if (_settings.activecolor !== "") {
						normalColor = _settings.activecolor;
					}
					if (_elements.itemActive) {
						normalBG =  "url("+_elements.itemActive.src+")";
					}
				}
				_css(li, {
					color: _settings.overcolor !== "" ? _settings.overcolor : normalColor,
				    backgroundImage: _elements.itemOver ? "url("+_elements.itemOver.src+")" : normalBG
				});
			}
		}

		function _itemOut(index) {
			return function() {
				var li = _ul.getElementsByClassName("item")[index];
				var color = _settings.fontcolor;
				var bg = _elements.item ? "url("+_elements.item.src+")" : "";
				
				if (index == _api.jwGetPlaylistIndex()) {
					if (_settings.activecolor !== "") {
						color = _settings.activecolor;
					}
					if (_elements.itemActive) {
						bg = "url("+_elements.itemActive.src+")";
					}
				}
				_css(li, {
					color: color,
					backgroundImage: bg
				});
			}
		}

		function _createItem(index) {
			var item = _playlist[index];
			var li = document.createElement("li");
			li.className = "item";
			
			_css(li,{
			    height: _settings.itemheight,
		    	display: 'block',
		    	cursor: 'pointer',
			    backgroundImage: _elements.item ? "url("+_elements.item.src+")" : "",
			    backgroundSize: "100% " + _settings.itemheight + "px"
		    });

			li.onmouseover = _itemOver(index);
			li.onmouseout = _itemOut(index);

			var imageWrapper = document.createElement("div");
			var image = new Image();
        	var imgPos = 0;
        	var imgWidth = 0;
        	var imgHeight = 0;
			if (_showThumbs() && (item.image || item['playlist.image'] || _elements.itemImage) ) {
	        	image.className = 'image';
	        	
	        	if (_elements.itemImage) {
	        		imgPos = (_settings.itemheight - _elements.itemImage.height) / 2;
	        		imgWidth = _elements.itemImage.width;
	        		imgHeight = _elements.itemImage.height;
	        	} else {
	        		imgWidth = _settings.itemheight * 4 / 3;
	        		imgHeight = _settings.itemheight
	        	}
	        			
	        	_css(imageWrapper, {
				    height: imgHeight,
				    width: imgWidth,
				    'float': 'left',
				    styleFloat: 'left',
				    cssFloat: 'left',
				    margin: '0 5px 0 0',
					background: 'black',
					overflow: 'hidden',
					margin: imgPos + "px",
					position: "relative"
	        	});
	        	
				_css(image, {
					position: "relative"
				});
				
				imageWrapper.appendChild(image);

				image.onload = function() {
				    jwplayer.utils.stretch(jwplayer.utils.stretching.FILL, image, imgWidth, imgHeight, this.naturalWidth, this.naturalHeight);
				}
				
				if (item['playlist.image']) {
					image.src = item['playlist.image'];	
				} else if (item.image) {
				  	image.src = item.image;
				} else if (_elements.itemImage) {
					image.src = _elements.itemImage.src;
				}
				
				li.appendChild(imageWrapper);
	        }
			
			var _remainingWidth = _width - imgWidth - imgPos * 2;
			if (_height < _settings.itemheight * _playlist.length) {
				_remainingWidth -= 15;
			}
			
	        var textWrapper = document.createElement("div");
	        _css(textWrapper, {
	            position: "relative",
	            height: "100%",
	            overflow: "hidden"
	        });

	        var duration = document.createElement("span");
    		if (item.duration > 0) {
        		duration.className = 'duration';
        		_css(duration, {
    		    	fontSize: (_settings.fontsize ? _settings.fontsize : 11) + "px",
                	fontWeight: (_settings.fontweight ? _settings.fontweight : "bold"),
    		    	width: "40px",
	            	height: _settings.fontsize ? _settings.fontsize + 10 : 20,
               		lineHeight: 24,
	            	'float': 'right',
				    styleFloat: 'right',
				    cssFloat: 'right'
	            });
        		duration.innerHTML = _utils.timeFormat(item.duration);
            	textWrapper.appendChild(duration);
        	}
	        
        	var title = document.createElement("span");
        	title.className = 'title';
        	_css(title, {
        		padding: "5px 5px 0 " + (imgPos ? 0 : "5px"),
        		height: _settings.fontsize ? _settings.fontsize + 10 : 20,
        		lineHeight: _settings.fontsize ? _settings.fontsize + 10 : 20,
            	overflow: 'hidden',
            	'float': 'left',
			    styleFloat: 'left',
			    cssFloat: 'left',
            	width: ((item.duration > 0) ? _remainingWidth - 50 : _remainingWidth)-10 + "px",
		    	fontSize: (_settings.fontsize ? _settings.fontsize : 13) + "px",
            	fontWeight: (_settings.fontweight ? _settings.fontweight : "bold")
        	});
        	title.innerHTML = item ? item.title : "";
        	textWrapper.appendChild(title);

	        if (item.description) {
	        	var desc = document.createElement("span");
	        	desc.className = 'description';
	        	_css(desc,{
	        	    display: 'block',
	        	    'float': 'left',
				    styleFloat: 'left',
				    cssFloat: 'left',
	        		margin: 0,
	        		paddingLeft: title.style.paddingLeft,
	        		paddingRight: title.style.paddingRight,
	            	lineHeight: (_settings.fontsize ? _settings.fontsize + 4 : 16) + "px",
	            	overflow: 'hidden',
	            	position: "relative"
	        	});
	        	desc.innerHTML = item.description;
	        	textWrapper.appendChild(desc);
	        }
	        li.appendChild(textWrapper);
			return li;
		}
		
		function _rebuildPlaylist(evt) {
			_wrapper.innerHTML = "";
			
			_playlist = _getPlaylist();
			if (!_playlist) {
				return;
			}
			items = [];
			_ul = _createList();
			
			for (var i=0; i<_playlist.length; i++) {
				var li = _createItem(i);
				li.onclick = _clickHandler(i);
				_ul.appendChild(li);
				items.push(li);
			}
			
			_lastCurrent = _api.jwGetPlaylistIndex();
			_itemOut(_lastCurrent)();
			
			_wrapper.appendChild(_ul);

			if (_utils.isIOS() && window.iScroll) {
				_ul.style.height = _settings.itemheight * _playlist.length + "px";
				var myscroll = new iScroll(_wrapper.id);
			}
			
		}
		
		function _getPlaylist() {
			var list = _api.jwGetPlaylist();
			var strippedList = [];
			for (var i=0; i<list.length; i++) {
				if (!list[i]['ova.hidden']) {
					strippedList.push(list[i]);
				}
			}
			return strippedList;
		}
		
		function _clickHandler(index) {
			return function() {
				_api.jwPlaylistItem(index);
				_api.jwPlay(true);
			}
		}
		
		function _scrollToItem() {
			_ul.scrollTop = _api.jwGetPlaylistIndex() * _settings.itemheight;
		}

		function _showThumbs() {
			return _settings.thumbs.toString().toLowerCase() == "true";	
		}

		function _itemHandler(evt) {
			if (_lastCurrent >= 0) {
				_itemOut(_lastCurrent)();
				_lastCurrent = evt.index;
			}
			_itemOut(evt.index)();
			_scrollToItem();
		}

		
		function _stateHandler() {
			if (_settings.position == jwplayer.html5.view.positions.OVER) {
				switch (_api.jwGetState()) {
				case jwplayer.api.events.state.IDLE:
					_show(_wrapper);
					break;
				default:
					_hide(_wrapper);
					break;
				}
			}
		}
		
		function _populateSkinElements() {
			for (var i in _elements) {
				_elements[i] = _getElement(i);
			}
		}
		
		function _getElement(name) {
			return _api.skin.getSkinElement("playlist", name);
		}
		
		
		
		_setup();
		return this;
	};
})(jwplayer);
