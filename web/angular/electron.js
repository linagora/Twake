if (typeof module === 'object') {
  window.module = module; module = undefined;
  window.electron = true;

  window.macos = process.platform == "darwin";
  window.windows = !window.macos;

  window.getFocused = function(){
    return require('electron').remote.BrowserWindow.getFocusedWindow();
  }

}
