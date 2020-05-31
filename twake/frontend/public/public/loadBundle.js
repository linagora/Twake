window.loadBundle = (url, onProgress, onSuccess) => {
  var req = new XMLHttpRequest();

  url = url + '?v=' + (window.version_detail || new Date().getTime());

  // report progress events
  req.addEventListener('progress', onProgress, false);

  // load responseText into a new script element
  req.addEventListener(
    'load',
    function(event) {
      var e = event.target;
      var s = document.createElement('script');
      s.innerHTML = e.responseText;
      // or: s[s.innerText!=undefined?"innerText":"textContent"] = e.responseText
      document.documentElement.appendChild(s);

      if (onSuccess) onSuccess();

      s.addEventListener('load', function() {
        var where = document.body;
        var script = where.ownerDocument.createElement('script');
        script.src = url;
      });
    },
    false,
  );

  req.open('GET', url);
  req.send();
};

history.pushState(null, null, location.href);
window.onpopstate = function(event) {
  history.go(1);
};
