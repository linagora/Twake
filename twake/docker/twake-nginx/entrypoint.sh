#!/bin/bash


if test -f "/configuration/environment.ts"; then
  cp /configuration/environment.ts /twake-react/src/app/environment/environment.ts
else
  cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
fi

cron -f &
nginx -g "daemon off;"
