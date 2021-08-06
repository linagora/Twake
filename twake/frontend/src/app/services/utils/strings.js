export default class Strings {
  static verifyMail(email) {
    var re =
      // eslint-disable-next-line no-useless-escape
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  static removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static autoSpaces(element, separator, size, max) {
    if (element.textAreaRef) {
      element = element.textAreaRef;
    }

    if (!element) {
      return;
    }
    if (!separator) {
      separator = ' ';
    }
    if (!size) {
      size = 5;
    }
    if (!max) {
      size = (5 + 1) * 4;
    }
    return;
    /*element.addEventListener('keyup', function (e) {
      var target = e.target,
        position = target.selectionEnd,
        length = target.value.length;
      if (e.which == 8) {
        return;
      }
      if (target.value[target.value.length] == separator) {
        target.value = target.value.substr(0, target.value.length - 1);
      }
      target.value = target.value
        .replace(new RegExp('[^A-Za-z0-9]', 'g'), '')
        .replace(new RegExp('([A-Za-z0-9]{' + size + '})', 'g'), '$1' + separator)
        .trim();
      target.value = target.value.substr(0, max);
    });*/
  }

  static convertBase(src, srctable, desttable) {
    var srclen = srctable.length;
    var destlen = desttable.length;
    // first convert to base 10
    var val = 0;
    var numlen = src.length;
    for (var i = 0; i < numlen; i++) {
      val = val * srclen + srctable.indexOf(src.charAt(i));
    }
    if (val < 0) {
      return 0;
    }
    // then covert to any base
    var r = val % destlen;
    var res = desttable.charAt(r);
    var q = Math.floor(val / destlen);
    while (q) {
      r = q % destlen;
      q = Math.floor(q / destlen);
      res = desttable.charAt(r) + res;
    }
    return res;
  }
}
