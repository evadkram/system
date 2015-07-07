window.addEventListener('load', function loaded() {
  window.removeEventListener('load', loaded);
  window.services = new Services();
  window.services.start();
});
