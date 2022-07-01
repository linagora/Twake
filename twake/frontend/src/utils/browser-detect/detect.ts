import { twakeApplicationUrlScheme } from './common';
import customProtocolCheck from 'custom-protocol-check';

/**
 * checks if the twake app is installed in the system using the browser
 * 
 * @returns {boolean} true if the twake app is installed
 */
export const detect = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    customProtocolCheck(twakeApplicationUrlScheme, () => resolve(false), () => resolve(true), undefined, () => resolve(false));
  });
}
