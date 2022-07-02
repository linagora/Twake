import { atom } from 'recoil';
import LocalStorage from '../../framework/local-storage-service';

export const useWebState = atom<boolean>({
  key: 'useWebState',
  default: true,
});

export const isPreferUserWeb = () => {
  return parseInt(LocalStorage.getItem('prefer_web_to_app_until') || '0') || 0 > Date.now();
};

export const preferUserWeb = (duration = 1000 * 60 * 60 * 24) => {
  return LocalStorage.setItem('prefer_web_to_app_until', Date.now() + duration);
};
