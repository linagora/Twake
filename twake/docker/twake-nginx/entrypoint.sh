#!/bin/bash


if test -f "/configuration/environment.js"; then
  cp /configuration/environment.js /twake-react/src/app/environment/environment.js
else
  cp /twake-react/src/app/environment/environment.js.dist /twake-react/src/app/environment/environment.js
fi

#yarn build-after-sh

cron -f &
nginx -g "daemon off;"
