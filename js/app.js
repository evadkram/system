/* global BaseModule, LazyLoader, applications */
'use strict';

(function(exports) {
  /**
   * The entry point of the whole system app.
   * It's duty is to prepare everything ready to launch
   * the application core (core.js).
   *
   * Core could run without App, but it is expected to be slower
   * because App will prepare the launch config for it with
   * Launcher's help (launcher.js).
   *
   * In Launcher it will read the launch configurations and put
   * some requests according to the config in the Service. When
   * the relative modules which are started by Core is started,
   * they could just fetch the launch config sychronously to
   * fasten to launch progress.
   *
   * If Launcher does not prepare the value for them,
   * the modules who are started by the Core will still get
   * the values asynchronously.
   */
  var App = function() {};
  App.prototype = {
    FILES: ['js/single_purpose/launcher.js'],
    start: function() {
      window.performance.mark('loadEnd');
      return LazyLoader.load(this.FILES).then(() => {
        return this.bootstrap();
      });
    },
    bootstrap: function() {
      if (this._booted) {
        throw new Error('App: bootstrap should not be called twice.');
      }
      this._booted = true;
      window.launcher = new Launcher();
      return Promise.all([
        window.launcher.start()
      ]).then(() => {
        // To let integration test know we are ready to test.
        document.body.setAttribute('ready-state', 'fullyLoaded');
        window.performance.mark('fullyLoaded');
      });
    }
  };

  exports.App = App;
}(window));
