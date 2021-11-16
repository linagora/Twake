export default class Numbers {
  static unid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  static humanFileSize(bytes: number, si: boolean) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    var units = si
      ? ['kb', 'mb', 'gb', 'gb', 'pb', 'eb', 'zb', 'yb']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return `${bytes.toFixed(1)}${units[u]}`;
  }

  static hexToBase64(str: string) {
    return btoa(
      String.fromCharCode.apply(
        null,
        str
          .replace(/\r|\n/g, '')
          .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
          .replace(/ +$/, '')
          .split(' ')
          .map(s => parseInt(s)),
      ),
    );
  }

  static timeuuidToDate(time_str: string) {
    if (!time_str) {
      return 0;
    }
    var uuid_arr = time_str.split('-'),
      // eslint-disable-next-line no-redeclare
      time_str = [uuid_arr[2].substring(1), uuid_arr[1], uuid_arr[0]].join('');
    return parseInt(time_str, 16);
  }

  static compareTimeuuid(a?: string, b?: string) {
    return Numbers.timeuuidToDate(a || '') - Numbers.timeuuidToDate(b || '');
  }

  static minTimeuuid(a?: string, b?: string) {
    if (!a) return b || '';
    if (!b) return a || '';
    return (Numbers.compareTimeuuid(a, b) > 0 ? b : a) || '';
  }

  static maxTimeuuid(a?: string, b?: string) {
    if (!a) return b || '';
    if (!b) return a || '';
    return (Numbers.compareTimeuuid(a, b) > 0 ? a : b) || '';
  }

  static convertBases(src: string, srcAlphabet: string, dstAlphabet: string) {
    // orion elenzil
    // 20080905

    var getValueOfDigit = function (digit: string, alphabet: string) {
      var pos = alphabet.indexOf(digit);
      return pos;
    };

    var srcBase = srcAlphabet.length;
    var dstBase = dstAlphabet.length;

    var wet = src;
    var val = 0;
    var mlt = 1;

    while (src.length > 0) {
      var digit = src.charAt(src.length - 1);
      val += mlt * getValueOfDigit(digit, srcAlphabet);
      src = src.substring(0, src.length - 1);
      mlt *= srcBase;
    }

    var wetint = val;
    var ret = '';

    while (wetint >= dstBase) {
      var digitVal = wetint % dstBase;
      // eslint-disable-next-line no-redeclare
      var digit = dstAlphabet.charAt(digitVal);
      ret = digit + ret;
      wetint /= dstBase;
    }

    // eslint-disable-next-line no-redeclare
    var digit = dstAlphabet.charAt(wetint);
    ret = digit + ret;

    return ret;
  }
}
