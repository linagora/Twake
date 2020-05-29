import anchorme from 'anchorme';
import emojione from 'emojione';
import showdown from 'showdown';

import Globals from 'services/Globals.js';

class MarkDownParsing {
  constructor() {
    this.converter = new showdown.Converter();
    this.converter.setOption('excludeTrailingPunctuationFromURLs', 'true');
    this.converter.setOption('strikethrough', 'true');
    this.converter.setOption('simpleLineBreaks', 'true');
    this.converter.setOption('requireSpaceBeforeHeadingText', 'true');
    this.converter.setOption('underline', 'true');

    Globals.window.parser = this;
  }
  isImage(file) {
    if (!file.isDirectory) {
      var name = file.name;
      var nameParts = name.split('.');
      if (nameParts.length === 2) {
        return ['png', 'jpg', 'jpeg', 'gif', 'tiff'].indexOf(nameParts[1].toLowerCase()) > -1;
      }
      return false;
    }
    return false;
  }
  preparse(text) {
    if (text == 'twake--breakall') {
      $('*').css({ backgroundColor: '#0F0', color: '#F00', border: '1px solid #00F' });
      return false;
    }
    if (text == 'twake--bored') {
      var elem = document.createElement('iframe');
      elem.setAttribute('src', 'https://game.crisp.chat');
      elem.setAttribute('id', 'iambored');
      elem.style.cssText =
        'border:0;border-radius:20px;position:absolute;width:500px;height:500px;top:0;right:0;bottom:0;left:0;opacity:0.5;z-index:100;margin:auto';
      var elem2 = document.createElement('div');
      elem2.setAttribute('id', 'notbored');
      elem2.style.cssText =
        'position:absolute;width:100%;height:100%;top:0;right:0;bottom:0;left:0;opacity:0;z-index:99;margin:auto';
      elem2.addEventListener(
        'click',
        function() {
          var destroy = document.getElementById('iambored');
          destroy.parentNode.removeChild(destroy);
          var destroy2 = document.getElementById('notbored');
          destroy2.parentNode.removeChild(destroy2);
        },
        false,
      );
      document.body.appendChild(elem);
      document.body.appendChild(elem2);
      return false;
    }
    return text;
  }
  parse(text) {
    var that = this;

    text = text.replace(/>/g, '&gt;').replace(/</g, '&lt;');

    /*Fix code entities*/
    var regAvCode = new RegExp('&amp;', 'g');
    var text = text.replace(regAvCode, '&amp;amp;');

    text = this.converter.makeHtml(text);
    text = text.replace(/<h[1-6]\b[^>]*>(.*?)<\/h[1-6]>/i, '$1'); // Remove hN
    text = text.replace(/<a\b[^>]*>(.*?)<\/a>/i, ' $1 '); // Remove links
    text = text.replace(/<p>(.*?)<\/p>/i, '$1'); // Remove <p>s

    /*Links*/
    text = anchorme(text, {
      truncate: [26, 15],
      attributes: [
        function(urlObj) {
          if (urlObj.protocol !== 'mailto:') {
            if (urlObj.raw.substr(0, 7) === 'http://' || urlObj.raw.substr(0, 8) === 'https://') {
              return {
                name: 'onClick',
                value: "href.goInNewTabExternal('" + urlObj.raw + "')",
              };
            } else {
              return {
                name: 'onClick',
                value: "href.goInNewTabExternal('http://" + urlObj.raw + "')",
              };
            }
          }
        },
        {
          name: 'class',
          value: 'mlink',
        },
      ],
      exclude: function(urlObj) {
        var url = urlObj.raw.toLowerCase();
        if (!url.startsWith('http')) return true;
        if (url.endsWith('.png')) return true;
        if (url.endsWith('.svg')) return true;
        if (url.endsWith('.jpg')) return true;
        if (url.endsWith('.jpeg')) return true;
        if (url.endsWith('.gif')) return true;
        if (url.endsWith('.tiff')) return true;
      },
    });

    text = text.replace(new RegExp('<a href=', 'g'), "<a target='_blank' href=");

    /* Img */
    var regImg = new RegExp(
      '((?:[ \r\n\\.>]+|^))(http[^ \r\n\\/]+/(?:(?!\\.png)|(?!\\.jpeg)|(?!\\.jpg)|(?!\\.tiff)|(?!\\.gif)|(?!\\.svg)[^ \r\n])+(?:\\.png|\\.tiff|\\.jpeg|\\.jpg|\\.svg|\\.gif))',
      'g',
    );
    var text = text.replace(
      regImg,
      "$1<a target='_blank' href='$2' style='display:block;height: 140px;' class='image'><img style='max-height:140px;'  src='$2'/></a>",
    );

    /*Hexa color*/
    var regHexa = new RegExp(
      '((?:^| |\n|\t|>))#([0-9abcdef]{3}([0-9abcdef]{3})?)([^a-z0-9]|$|^)',
      'gi',
    );
    var text = text.replace(
      regHexa,
      "$1<span class='msg-color' style='background: #$2'><span class='in' style='background: #$2'></span></span>#$2 ",
    );

    /*Pseudo user*/
    var regPseudo = new RegExp('((?:^| |>))@([A-Za-z0-9_-]*)', 'g');
    //var text = text.replace(regPseudo, "<a onClick='href.goInNewTab(\"/user/$1\")'>@$1</a>");
    var text = text.replace(
      regPseudo,
      "$1<span style='display: inline-block;' class='popupMessageProfil' data-name='$2'><b><i>@$2</i></b></span>",
    );

    var regHeart = new RegExp('( |^)&lt;3( |$)', 'g');
    var text = text.replace(regHeart, ' :heart: ');

    /*Fix code entities*/
    var regCode = new RegExp('&amp;', 'g');
    //var text = text.replace(regPseudo, "<a onClick='href.goInNewTab(\"/user/$1\")'>@$1</a>");
    var text = text.replace(regCode, '&');

    //Activate :) -> :smile:
    emojione.ascii = true;
    text = emojione.toImage(text);
    Globals.window.emojione = emojione;

    /*Add linebreak*/
    /*text = text.replace(/(\n|\r)/g, "<br>");
      text = that.keepLinebreak(text);*/
    return text;
  }
}

var parser = new MarkDownParsing();
export default parser;
