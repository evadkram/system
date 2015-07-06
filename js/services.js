/* global ServiceConfig, Promise, Messenger */

'use strict';

(function(exports) {
  /**
   * This module is responsible to create and run services.
   */
  var Services = function() {};
  Services.prototype = {

    _dispatchReady: function() {
      // With all important event handlers in place, we can now notify
      // Gecko that we're ready for certain system services to send us
      // messages (e.g. the radio).
      // Note that shell.js starts listen for the mozContentEvent event at
      // mozbrowserloadstart, which sometimes does not happen till
      // window.onload.
      var evt = new CustomEvent('mozContentEvent', {
        bubbles: true, cancelable: false,
        detail: { type: 'system-message-listener-ready'}
      });
      window.dispatchEvent(evt);
    },

    handleBrowserLoaded: function(instance) {
      if (instance.config.type === 'window' ||
          instance.config.type === 'app') {
        instance.iframe.hidden = false;
        instance.iframe.setVisible(true);
      }

      if (instance.config.type === 'app') {
        // We cannot create messenger for an app since it is at remote
        // process.
        // move focus to foreground window
        document.activeElement.blur();
        instance.iframe.focus();
        // process next one
        this._processCreateQueue();
        return;
      }
      // create messenger
      instance.messenger = new Messenger();
      instance.messenger.start(instance.iframe);
      instance.messenger.onPingBack = function() {
        this.send({
          'log': 'service [' + instance.config.manifestURL + '] pinged'
        });
        if (instance.config.type === 'window') {
          // move focus to pinged window
          document.activeElement.blur();
          instance.iframe.focus();
        }
        // process next one
        this._processCreateQueue();
      }.bind(this);
    },

    handleBrowserError: function(instance) {
      if (instance.config.type === 'window' ||
          instance.config.type === 'app') {
        // move focus to top most window
        document.activeElement.blur();
        var iframe = this._windowContainer.querySelector(
                                                       'iframe:last-child');
        if (iframe) {
          iframe.focus();
        }
      }
      // remove the old one and recreate it.
      instance.messenger.stop();

      instance.iframe.parentElement.removeChild(instance.iframe);
      if (instance.config.autoRestart) {
        this._createService(instance.config);
      }
    },

    handleEvent: function(e) {
      var instance = this._serviceMap[e.target.getAttribute('mozapp')];
      switch(e.type) {
        case 'mozbrowsererror':
          this.handleBrowserError(instance);
          break;
        case 'mozbrowserloadend':
          this.handleBrowserLoaded(instance);
          break;
      }
    },

    _processCreateQueue: function() {
      if (this._clonedConfig.length === 0) {
        this.send({'log': 'all services created'});
        delete this._clonedConfig;
        this._dispatchReady();
        return;
      }
      this._createService(this._clonedConfig.pop());

    },

    _createService: function(s) {
      if (!s) {
        return;
      }
      // create iframe
      var iframe = document.createElement('iframe');
      iframe.setAttribute('mozbrowser', 'true');
      if (s.type === 'app') {
        iframe.setAttribute('remote', 'true');
      }
      iframe.setAttribute('mozapp', s.manifestURL);
      iframe.setAttribute('mozallowfullscreen', 'true');
      iframe.setAttribute('origin', s.origin);
      iframe.src = s.origin + s.launchURL;
      iframe.hidden = true;
      iframe.addEventListener('mozbrowsererror', this);
      iframe.addEventListener('mozbrowserloadend', this);

      // register
      this._serviceMap[s.manifestURL] = {
        'config': s,
        'iframe': iframe
      };
      // put on DOM
      if (s.type === 'window' || s.type === 'app') {
        this._windowContainer.appendChild(iframe);
      } else {
        this._serviceContainer.appendChild(iframe);
      }

      this.send({'log': 'service [' + s.manifestURL + '] created'});
      return this._serviceMap[s.manifestURL];
    },

    send: function(data, targetOrigin) {
      for (var url in this._serviceMap) {
        if (targetOrigin &&
            targetOrigin !== this._serviceMap[url].messenger.targetOrigin) {
          continue;
        }
        // someone who doesn't have message is loading its resource.
        if (this._serviceMap[url].messenger) {
          this._serviceMap[url].messenger.send(data);
        }
      }
    },

    start: function() {
      this._serviceMap = {};
      this._serviceContainer = document.getElementById('service-section');
      this._windowContainer = document.getElementById('window-section');
      // We need to be sure to get the focus in order to wake up the screen
      // if the phone goes to sleep before any user interaction.
      // Apparently it works because no other window
      // has the focus at this point.
      window.focus();

      this._clonedConfig = [].concat(ServiceConfig);
      this._processCreateQueue();
    }
  };

  exports.Services = Services;
}(window));
