export default class Strings {
  static verifyMail(email: string) {
    const re =
      // eslint-disable-next-line no-useless-escape
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  static removeAccents(str: string) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static autoSpaces(element: any, separator: any, size: any, max: any) {
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
  }

  static convertBase(src: any, srctable: any, desttable: any) {
    const srclen = srctable.length;
    const destlen = desttable.length;
    // first convert to base 10
    let val = 0;
    const numlen = src.length;
    for (let i = 0; i < numlen; i++) {
      val = val * srclen + srctable.indexOf(src.charAt(i));
    }
    if (val < 0) {
      return 0;
    }
    // then covert to any base
    let r = val % destlen;
    let res = desttable.charAt(r);
    let q = Math.floor(val / destlen);
    while (q) {
      r = q % destlen;
      q = Math.floor(q / destlen);
      res = desttable.charAt(r) + res;
    }
    return res;
  }
}

export const distanceFromQuery = (candidate: string, query: string) => {
  let score = 1000;
  query.split(' ').forEach(word => {
    candidate.split(' ').map(field => {
      if (field?.trim()) {
        const dist = Strings.removeAccents(field)
          .toLocaleLowerCase()
          .replace(Strings.removeAccents(word).toLocaleLowerCase(), '').length;
        if (dist < score) score = dist;
      }
    });
  });

  return score;
};
