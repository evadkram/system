'use strict';

var Messenger = function() {};
Messenger.prototype = {

  handleEvent: function(e) {
    if (e.type !== 'message' || e.origin !== this.targetOrigin) {
      return;
    }

    if (!this._firstPingBack) {
      this._firstPingBack = true;
      this.onPingBack();
    }
    if (this.onMessage) {
      this.onMessage(e.data);
    }
  },

  send: function(data) {
    this._targetWindow.postMessage(data, '*');
  },

  start: function(iframe) {
    this._firstPingBack = false;
    this._targetWindow = iframe.contentWindow;
    this.targetOrigin = iframe.getAttribute('origin');
    window.addEventListener('message', this);
    this.send('ping');
  },

  stop: function() {
    window.removeEventListener('message', this);
  }
};

export default Messenger;
