#!/bin/bash


<<<<<<< HEAD
if test -f "/configuration/environment.ts"; then
  cp /configuration/environment.ts /twake-react/src/app/environment/environment.ts
else
  cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
fi

=======
if test -f "/configuration/environment.js"; then
  cp /configuration/environment.js /twake-react/src/app/environment/environment.js
else
  cp /twake-react/src/app/environment/environment.js.dist /twake-react/src/app/environment/environment.js
fi

#yarn build-after-sh

>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
cron -f &
nginx -g "daemon off;"
