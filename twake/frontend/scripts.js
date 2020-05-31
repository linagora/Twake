module.exports = [
    {
        name: 'replace-text',
        match: '^.*$',
        hotkey: 'ctrl-f9',
        script: (data) => {
          var editor = atom.workspace.getActivePaneItem();
          var file = editor.buffer.file;
          var path = file.path;
          path = path.replace(/\/[^/]*\.js$/, "");
          path = path.split("src/client/app/")[1];
          path = path.split("/").join(".").toLowerCase();

          var selected = editor.getSelectedText();
          selected = selected.replace(/^"/, "");
          selected = selected.replace(/"$/, "");

          editor.insertText("Languages.t('"+path+"._"+(new Date().getTime())+"', [], \""+selected+"\")");
        }
    }
  ];
