import Strings from 'features/global/utils/strings';

export const highlightText = (text?: string, highlight?: string) => {
  if (!text || !highlight) {
    return '';
  }
  const reg = new RegExp('(' + Strings.removeAccents(highlight) + ')', 'ig');
  return Strings.removeAccents(text).replace(reg, "<span class='highlight'>$1</span>");
};
