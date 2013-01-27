var Ad = {

  adVar1: 'foo',
  adVar2: 'bar',
  adWidth: '',
  adHeight: '',
  interactionAction: 'click' || 'touchend',
  online: navigator.onLine,
  DNT: navigator.doNotTrack,
  isMobile: navigator.userAgent.toLowerCase().indexOf('mobile'),
  isAndroid: navigator.userAgent.toLowerCase().indexOf('android') > -1,
  publisher: window.location.hostname,
  mraid: false,
  safeFrame: false,

  // The one function that will get called to kick things off - NOTE: Try to keep the initial load around 75-100k

  init: function(params) {
    var mainScope = this;//get reference to AD object

    //pixel density check
    console.log('Device Pixel Density: ' + mainScope.getDevicePixelRatio());

    //get device orientation
    window.onorientationchange = mainScope.setOrientation;

    //need location?
    if(navigator.geolocation) {
      mainScope.getUserLocation();
    } else {
      console.warn('Browser does not support geolocation')
    }

    //create ad border (optional)
    var ad = document.querySelector('.adContainer');
    var adW = window.getComputedStyle(ad,null).getPropertyValue('width');
    var adH = window.getComputedStyle(ad,null).getPropertyValue('height');
    ad.style.border = '1px solid #000';
    ad.style.width = adW;
    ad.style.height = adH;


    //detect page visibility - sam dutton (google)
    var hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") {
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
      hidden = "mozHidden";
      visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }
    if (typeof document.addEventListener === "undefined" || typeof hidden === "undefined") {
      console.warn("This demo requires a browser such as Google Chrome that supports the Page Visibility API.");
    } else {
       document.addEventListener(visibilityChange, mainScope.handleVisibilityChange, false);
    }

    //accelerometer
    if (window.DeviceOrientationEvent || window.OrientationEvent) {
      mainScope.tiltHandler();
    } else {
      console.warn('Browser does not support orientation');
    }

    //IAB's Rich Media API's (MRAID & SAFEFRAMES)
    if (params.mraid) {
      mainScope.mraid = params.mraid;
      var mScript = document.createElement('script');
      mScript.type = 'text/javascript';
      mScript.src = 'js/mraidClient.js';
      document.getElementsByTagName('head')[0].appendChild(mScript);

      window.addEventListener('doneLoading', console.log('MRAID API Installed'), false);
    } else if(params.safeFrame) {
      //IAB safe frame support coming soon.
      //post message to communicate to the pub page iFrame
      console.log('SafeFrames API installed');
    }

    if (params.expand) {
      console.log('Ad is an expand');
      mainScope.bindExpandActions();
    } else {
      console.log('Ad is an interstital');
      //wire up global click interaction for ad
      ad.addEventListener(mainScope.interactionAction, function () {
        var url = document.querySelector('body').getAttribute('data-clickTag');
        mainScope.openURL(url);
      }, false);

    }

    console.log(adW + ' ' +  adH + ' ad on ' + mainScope.publisher + ' with DNT set to ' + mainScope.DNT);

  },



  //Interactions
  //-------------------------------

  bindExpandActions: function() {
    //buttons for rich media expand
    var adButtons = document.querySelectorAll('button');
    var action = this.interactionAction;
    for (var i = 0; i < adButtons.length; i++) {
      adButtons[i].removeAttribute('hidden');
      adButtons[i].addEventListener(action, this.buttonHandler(event), false);
    }

  },

  buttonHandler: function(event) {
    console.log(event)
  },

  tiltHandler: function(event) {
    var mainScope = this;
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (eventData) {
          // gamma is the left-to-right tilt in degrees, where right is positive
          var tiltLR = eventData.gamma;
          // beta is the front-to-back tilt in degrees, where front is positive
          var tiltFB = eventData.beta;
          // alpha is the compass direction the device is facing in degrees
          var dir = eventData.alpha
          // deviceorientation does not provide this data
          var motUD = null;
          // call our orientation event handler
          mainScope.deviceOrientationHandler(tiltLR, tiltFB, dir, motUD);
        }, false);
    } else if (window.OrientationEvent) {
        window.addEventListener('MozOrientation', function (eventData) {
          // x is the left-to-right tilt from -1 to +1, so we need to convert to degress
          var tiltLR = eventData.x * 90;
          // y is the front-to-back tilt from -1 to +1, so we need to convert to degress
          // We also need to invert the value so tilting the device towards us (forward)
          // results in a positive value.
          var tiltFB = eventData.y * -90;
          // MozOrientation does not provide this data
          var dir = null;
          // z is the vertical acceleration of the device
          var motUD = eventData.z;
          mainScope.deviceOrientationHandler(tiltLR, tiltFB, dir, motUD);
        }, false);
    }
  },



  //Layout
  //-------------------------------

  deviceOrientationHandler: function(tiltLR, tiltFB, dir, motionUD) {
    // Apply the transform to the dummy image
    var vid = document.querySelector('body');
    vid.style.webkitTransform = 'rotate(' + tiltLR + 'deg) rotate3d(1,0,0, ' + (tiltFB * -1) + 'deg)';
    vid.style.MozTransform = 'rotate(' + tiltLR + 'deg)';
    vid.style.transform = 'rotate(' + tiltLR + 'deg) rotate3d(1,0,0, ' + (tiltFB * -1) + 'deg)';
  },

  setOrientation: function(o) {
    var orientation = window.orientation;
    if (orientation != orientation1) {
        switch (orientation) {
          case 0:
              console.log('makePortrait');
              break;
          case 90:
              console.log('makeLandscape');
              break;
          case -90:
              console.log('makeLandscape');
              break;
          case 180:
              console.log('makePortrait');
              break;
        }
    }
    orientation1 = orientation;
    console.log('o' + orientation)
  },


  //Rich Media Ad Handlers
  //-------------------------------

  openURL: function (url) {
    if(this.mraid) {
      mraid.launchURL(url);
    } else {
      window.open(url);
    }
  },

  expandAd: function() {
    if(this.mraid) {
      mraid.expandAd(this.adWidth, this.adHeight);
    }
    console.log('Ad Expand');
    toggleLayer('bannerDiv', 'panelDiv');
  },

  closeAd: function() {
    if(this.mraid) {
      mraid.closeAd();
    }
    console.log('Ad Closed');
    toggleLayer('panelDiv', 'bannerDiv');
  },

  toggleLayer: function(fromLayer, toLayer) {
    var fromElem, toElem, fromElemStyle, toElemStyle;

    fromElem = document.querySelector(fromLayer);
    fromElem.style.display = 'none';

    toElem = document.querySelector(toLayer);
    toElem.style.display = 'block';
  },


  //Location
  //-------------------------------

  getUserLocation: function() {
    // The one function that will get called to kick things off
    navigator.geolocation.getCurrentPosition(this.handleGeolocationQuery, this.handleLocationErrors);
  },

  handleLocationErrors: function (error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
          console.error('Error :>> user did not share geolocation data');
          break;
      case error.POSITION_UNAVAILABLE:
          console.error('Error :>> could not detect current position');
          break;
      case error.TIMEOUT:
          console.error('Error :>> retrieving position timed out');
          break;
      default:
          console.error('Error :>> unknown error');
          break;
    }
  },

  handleGeolocationQuery: function(position) {
    myLat = position.coords.latitude;
    myLong = position.coords.longitude;
    console.log('Lat = ' + myLat + ' Long = ' + myLong);

    //do something with the location data here
  },


  //Utils
  //-------------------------------

  // Query the device pixel ratio.
  getDevicePixelRatio: function () {
    if(window.devicePixelRatio === undefined) {
      return 1; // No pixel ratio available. Assume 1:1.
    } else {
      return window.devicePixelRatio;
    }
  },

  handleVisibilityChange: function () {
    if (document[this.hidden]) {
      console.warn('Pause Ad Rendering');
    } else {
      console.warn('Resume Ad Rendering');
    }
  }

};
