import Globals from 'services/Globals';

export function addApiUrlIfNeeded(url: string, asCssUrl?: boolean): string {
  function _wrap(url: string): string {
    return asCssUrl ? `url('${url}')` : url;
  }

  if (!url) {
    return _wrap(url);
  }

  if (/^http/.test(url)) {
    return _wrap(url);
  }

  return _wrap(`${Globals.api_root_url}/${url}`);
};

export function getAsFrontUrl(path: string): string {
  return `${(Globals.environment.front_root_url || '')}${path}`;
}

