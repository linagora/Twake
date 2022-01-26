import { useEffect } from 'react';

import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import Globals from 'app/features/global/services/globals-twake-app-service';
import Logger from 'app/features/global/framework/logger-service';

let initiatedService = false;
const logger = Logger.getLogger(`app/features/global/use-usetiful`);
export default function useUsetiful() {
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user && !initiatedService) {
      initiatedService = true;

      if (Globals.environment.usetiful_token?.length) {
        (window as any).usetifulTags = user.id;
        (function (w, d, s) {
          var a = d.getElementsByTagName('head')[0];
          var r = d.createElement('script');
          r.async = true;
          r.src = s;
          r.setAttribute('id', 'usetifulScript');
          r.dataset.token = Globals.environment.usetiful_token;
          a.appendChild(r);
        })(window, document, 'https://www.usetiful.com/dist/usetiful.js');
      }
    } else {
      if (!initiatedService) {
        logger.warn(`Usetiful not enabled`);
      }
    }
  }, [user]);
}
