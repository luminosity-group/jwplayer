package 
{
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.IInstreamPlayer;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.navigateToURL;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.utils.Timer;
	
	public class InStreamAdPlugin extends Sprite implements IPlugin
	{
		/* Configuration loader */
		private var _configLoader:URLLoader;
		/* Makes asynchronous ad requests */
		private var _adLoader:URLLoader;
		/* XML file containing ad schedule */
		private var _loadedConfig:XML;
		private var _configLoading:Boolean = false;
		/* Reference to the player */ 
		private var _player:IPlayer;
		/* Currently loading ad */
		private var _loadingAd:Object;
		/* Ads being loaded */
		private var _adLoadQueue:Array = [];
		/* Ad queue - these ads should be played in order */
		private var _playingAds:Array = [];
		/* Currently playing ad */
		private var _currentAd:Object;
		/* Something to simlate ad playback */
		private var _overlay:Sprite;
		/* Message to display in overlay */
		private var _overlayLabel:TextField;
		/* Keep track of whether we have the lock */
		private var _locking:Boolean = false;
		/* Whether we're forcing the display to buffer */
		private var _forcingBuffer:Boolean = false;
		/* Keep a hold of configured midroll ads */
		private var _midrollAds:XMLList;
		/* Amount of time before display time to load midroll ad info */
		private var _midrollThreshold:Number = 1;
		/* Should we play pre-rolls when config is loaded? */
		private var _waitingForPreroll:Boolean = false;
		
		
		public function initPlugin(player:IPlayer, config:PluginConfig):void {
			_player = player;
			
			createOverlay();
			
			addPlayerListeners();

			if (config.adconfig) {
				_configLoader = new URLLoader();
				_configLoader.addEventListener(IOErrorEvent.IO_ERROR, configFailed);
				_configLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, configFailed);
				_configLoader.addEventListener(Event.COMPLETE, configLoaded);
				_configLoader.addEventListener(Event.OPEN, function(evt:Event):void {
					_configLoading = true;
				});
				
				
				_adLoader = new URLLoader();
				_adLoader.addEventListener(IOErrorEvent.IO_ERROR, adFailed);
				_adLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, adFailed);
				_adLoader.addEventListener(Event.COMPLETE, adLoaded);
				
				_configLoader.load(new URLRequest(config.adconfig));
			} else {
				Logger.log("No config file to load", id);
			}
		}
		
		private function createOverlay():void {
			_overlay = new Sprite();
			_overlay.visible = false;

			_overlayLabel = new TextField();
			_overlayLabel.textColor = 0xFFFFFF;
			_overlayLabel.selectable = false;
			_overlayLabel.backgroundColor = 0x333333;
			_overlayLabel.background = true;
			_overlayLabel.multiline = true;

			var tf:TextFormat = new TextFormat();
			tf.align = TextFormatAlign.CENTER;
			_overlayLabel.setTextFormat(tf);			
			
			_overlay.addChild(_overlayLabel);
			
			addChild(_overlay);
		}
		
		
		private function configLoaded(evt:Event):void {
			_loadedConfig = parseConfig(_configLoader.data as String);
			_configLoading = false;
			for (var i:Number=0; i<_loadedConfig..ad.length(); i++) {
				_loadedConfig..ad[i].@played = false;
			}
			if (_waitingForPreroll) {
				checkPreroll();
			}
		}
		
		private function configFailed(evt:ErrorEvent):void {
			Logger.log("Config could not be loaded: " + evt.text, id);
			_configLoading = false;
			releaseBuffer();
			if (_locking) {
				_player.unlock(this);
			}
		}
		
		public function resize(width:Number, height:Number):void {
			_overlay.graphics.clear();
			_overlay.graphics.beginFill(0, 0.7);
			_overlay.graphics.drawRect(0, 0, width, 20);
			
			_overlayLabel.width = width;
			_overlayLabel.height = 20;
			
			_overlayLabel.x = Math.floor((_overlay.width - _overlayLabel.width) / 2);
			_overlayLabel.y = Math.floor((_overlay.height - _overlayLabel.height) / 2);
		
			var tf:TextFormat = new TextFormat();
			tf.align = TextFormatAlign.CENTER;
			_overlayLabel.setTextFormat(tf);			

		}
		
		public function get id():String {
			return "instreamads";
		}
		
		private function parseConfig(config:String):XML {
			try {
				return new XML(config);
			} catch (e:Error) {
				Logger.log("Error parsing config XML: " + e.message, id);
			}
			return null; 
		}
		
		private function isConfigReady():Boolean {
			return _loadedConfig && !_configLoading;
		}
		
		private function addPlayerListeners():void {
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, resetPlayed);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY, checkPreroll);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, checkMidroll);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, checkPostroll);
		}
		
		private function createAd(ad:XML):Object {
			var ret:Object = {};
			var retNull:Boolean = true;
			
			if (ad.url.length() > 0) {
				retNull = false;
				ret['url'] = ad.url.toString();
			}
			if (ad.link.length() > 0) {
				retNull = false;
				ret['link'] = ad.link.toString(); 
			}
			if (ad.delay.length() > 0) {
				retNull = false;
				ret['delay'] = ad.delay.toString(); 
			}
			
			if (retNull)
				return null;
			else
				return ret;
		}
		
		/********************************/
		/**   Player Event Listeners   **/
		/********************************/
		
		/* When we reach a new playlist item, we should reset the ad schedule */
		private function resetPlayed(evt:PlaylistEvent):void {
			if (isConfigReady()) {
				for (var i:Number=0; i<_loadedConfig..ad.length(); i++) {
					_loadedConfig..ad[i].@played = false;
				}
			}
		}
		
		/* Check for pre-roll */
		private function checkPreroll(evt:MediaEvent=null):void {
			// We only want to check for pre-rolls if the player is currently idle (i.e. not from pause->play) 
			if (_player.state == PlayerState.IDLE) {
				if (isConfigReady()) {
					var ads:XMLList = _loadedConfig.preroll.ad.(@played==false);
					if (ads.length() > 0) {
						queueAds(ads, "preroll");
						if (_locking) {
							loadAds();
						} else {
							_player.lock(this, function():void {
								_locking = true;
								loadAds();
							});
						}
						forceBuffer();
					}
					
				} else {
					waitForPreroll();
				}
			}
		}
		
		private function waitForPreroll():void {
			forceBuffer();
			_waitingForPreroll = true;
			_player.lock(this, function():void {
				_locking = true;
			});
		}
		
		/* Check midroll */
		private function checkMidroll(evt:MediaEvent):void {
			if (isConfigReady()) {
				if (!_midrollAds) {
					_midrollAds = _loadedConfig.midroll.ad;
				}
				
				var unplayed:XMLList = _midrollAds.(@played==false);
				for (var i:Number=0; i < unplayed.length(); i++) {
					if (Number(unplayed[i].@delay) >= (Math.floor(evt.position)-_midrollThreshold) && Number(unplayed[i].@delay) <= Math.floor(evt.position)) {
						Logger.log("Time to load a midroll ad", id);
						queueAds(new XMLList(unplayed[i]), "midroll");
						if (_locking) {
							loadAds();
						} else {
							_player.lock(this, function():void {
								_locking = true;
								forceBuffer();
								loadAds();
							});
						}
					}
				}
			}
		}
		
		
		/* Check for postroll */
		private function checkPostroll(evt:MediaEvent):void {
			// We only want to check for pre-rolls if the player is currently idle (i.e. not from pause->play) 
			if (isConfigReady()) {
				var ads:XMLList = _loadedConfig.postroll.ad.(@played==false);
				if (ads.length() > 0) {
					queueAds(ads, "postroll");
					_player.lock(this, function():void {
						_locking = true;
						loadAds();
					});
					forceBuffer();
				}
			}
		}
		
		/********************************/
		/**         Ad Playback        **/
		/********************************/
		
		/* Force the player to display a buffering state */
		private function forceBuffer():void {
			if (!_forcingBuffer) {
				_forcingBuffer = true;
				Logger.log("Showing fake buffer");
				_player.controls.display.forceState(PlayerState.BUFFERING);
			}
		}

		/* Let the player show its actual state */
		private function releaseBuffer():void {
			if (_forcingBuffer) {
				_forcingBuffer = false;
				Logger.log("Releasing display from fake buffer");
				_player.controls.display.releaseState();
			}
		}
		

		private function queueAds(ads:XMLList, pos:String):void {
			for (var i:Number=0; i < ads.length(); i++) {
				if (ads[i].text().toString()) {
					_adLoadQueue.push({
						ad: ads[i].text().toString(),
						position: pos,
						id: pos+(i+1),
						delay: ads[i].@delay.text().toString()
					});
					ads[i].@played = true;
				}
			}
		}
		
		private function loadAds():void {
			if (_adLoadQueue.length > 0) {
				if (_loadingAd != null) return;
				
				_loadingAd = _adLoadQueue.shift();
				if (_loadingAd && _loadingAd.ad) {
					_adLoader.load(new URLRequest(_loadingAd.ad));
				}
			} else {
				Logger.log("No more ads to load.  Time to start playing ads.", id);
				if (_playingAds.length > 0) {
					playAds();
				}
			}
		}
		
		private function adFailed(evt:ErrorEvent):void {
			_loadingAd = null;
			loadAds();
		}
		
		private function adLoaded(evt:Event):void {
			try {
				var adXML:XML = new XML(_adLoader.data);
				var adObj:Object = createAd(adXML);
				if (adObj) {
					_playingAds.push(adObj);
				}
			} catch(e:Error) {
				Logger.log("Could not parse ad " + _loadingAd.id, id);
			}
			_loadingAd = null;
			loadAds();
		}
		
		private function playAds():void {
			if (_playingAds.length) {
				var nextAd:Object = _playingAds.shift();
				playAd(nextAd);
			} else {
				Logger.log("No more ads to play", id);
				allAdsFinished();
			}
		}		
		
		private function playAd(ad:Object):void {
			if (_currentAd) {
				Logger.log("Can't play ad; already have a playing ad", id);
				return;
			}
			_currentAd = ad;
			Logger.log("Playing an ad: " + _currentAd.url, id);

			if (_loadedConfig.(@simulate == "true").length() > 0) {
				simulateAd();
			} else {
				if (!_currentAd.url) {
					Logger.log("Can't play an ad that doesn't have a URL", id);
					adFinished();
					return;
				}
				var adItem:PlaylistItem = new PlaylistItem({
					file: _currentAd.url,
					duration: 15
				});
				var instream:IInstreamPlayer = _player.loadInstream(this, adItem);
				if (instream) { 
					setupInstreamPlayer(instream);
				} else {
					Logger.log("Could not set up instream player");
					allAdsFinished();
				}
			}
		}
		
		private function setupInstreamPlayer(instream:IInstreamPlayer):void {
			instream.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_CLICKED, adClicked);
			instream.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, adFinished);
		}
		
		private function simulateAd():void {
			var fakeAdTimer:Timer = new Timer(1000, 5);
			fakeAdTimer.addEventListener(TimerEvent.TIMER, function(evt:TimerEvent):void {
				showMessage("Playing " + _currentAd.position + " ad: " + (fakeAdTimer.repeatCount - fakeAdTimer.currentCount) + " of " + fakeAdTimer.repeatCount + " seconds remaining.");
			});
			fakeAdTimer.addEventListener(TimerEvent.TIMER_COMPLETE, function(evt:TimerEvent):void {
				adFinished();
			});
			showMessage("Playing " + _currentAd.position + " ad: " + (fakeAdTimer.repeatCount - fakeAdTimer.currentCount) + " of " + fakeAdTimer.repeatCount + " seconds remaining.");
			fakeAdTimer.start();
		}

		private function adClicked(evt:PlayerEvent=null):void {
			navigateToURL(new URLRequest(_currentAd.link), '_blank');
		}
	
		private function adFinished(evt:PlayerEvent=null):void {
			hideMessage();
			_currentAd = null;
			playAds();
		}
		
		private function allAdsFinished():void {
			releaseBuffer();
			Logger.log("Unlocking player");
			_player.unlock(this);
			_locking = false;
		}
		
		private function showMessage(msg:String):void {
			if (msg) {
				_overlay.visible = true;
				_overlayLabel.text = msg;
				resize(this.width, this.height);
			} 
		}
		
		private function hideMessage():void {
			_overlay.visible = false;
		}
		
	}
}
