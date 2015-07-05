/* global BaseModule */
'use strict';

(function(exports) {
  /**
   * This module is responsible to read all boot up related
   * configurations and asks other launcher to launch
   * at the correct timing by the configurations.
   */
  var Launcher = function() {};
  Launcher.prototype = {
    FILES: ['js/cpu_manager.js'],

    start: function() {
      // We need to be sure to get the focus in order to wake up the screen
      // if the phone goes to sleep before any user interaction.
      // Apparently it works because no other window
      // has the focus at this point.
      window.focus();
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

      LazyLoader.load(this.FILES).then(() => {
        // Listen for wakelock events
        window.cpuManager = new CpuManager();
        window.cpuManager.start();

        // Disable cpuSleepAllowed, need to be explicitely run by user
        navigator.mozPower.cpuSleepAllowed = false;

        // Turn the screen on
        navigator.mozPower.screenBrightness = 0.9;

        setTimeout(function () {
          navigator.mozPower.screenEnabled = true;
          navigator.mozPower.screenBrightness = 1;
        }, 100);
      });

      // lean cover loader
      var content = document.getElementById('windows');
      content.innerHTML = '<h1>OS loaded</h1>';
      document.body.style.background = 'white';

      return Promise.resolve();
    }
  };

  exports.Launcher = Launcher;
}(window));
