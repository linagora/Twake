export default class Numbers {
  static unid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  static humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    var units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }

  static hexToBase64(str) {
    return btoa(
      String.fromCharCode.apply(
        null,
        str
          .replace(/\r|\n/g, '')
          .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
          .replace(/ +$/, '')
          .split(' '),
      ),
    );
  }

  static timeuuidToDate(time_str) {
    if (!time_str) {
      return 0;
    }
    var uuid_arr = time_str.split('-'),
      time_str = [uuid_arr[2].substring(1), uuid_arr[1], uuid_arr[0]].join('');
    return parseInt(time_str, 16);
  }

  static compareTimeuuid(a, b) {
    return Numbers.timeuuidToDate(a) - Numbers.timeuuidToDate(b);
  }

  static minTimeuuid(a, b) {
    if (!a) return b;
    if (!b) return a;
    return Numbers.compareTimeuuid(a, b) > 0 ? b : a;
  }

  static maxTimeuuid(a, b) {
    if (!a) return b;
    if (!b) return a;
    return Numbers.compareTimeuuid(a, b) > 0 ? a : b;
  }

  static convertBases(src, srcAlphabet, dstAlphabet) {
    // orion elenzil
    // 20080905

    var getValueOfDigit = function (digit, alphabet) {
      var pos = alphabet.indexOf(digit);
      return pos;
    };

    var srcBase = srcAlphabet.length;
    var dstBase = dstAlphabet.length;

    var wet = src;
    var val = 0;
    var mlt = 1;

    while (wet.length > 0) {
      var digit = wet.charAt(wet.length - 1);
      val += mlt * getValueOfDigit(digit, srcAlphabet);
      wet = wet.substring(0, wet.length - 1);
      mlt *= srcBase;
    }

    wet = val;
    var ret = '';

    while (wet >= dstBase) {
      var digitVal = wet % dstBase;
      var digit = dstAlphabet.charAt(digitVal);
      ret = digit + ret;
      wet /= dstBase;
    }

    var digit = dstAlphabet.charAt(wet);
    ret = digit + ret;

    return ret;
  }
}
