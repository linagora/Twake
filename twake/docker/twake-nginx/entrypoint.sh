#!/bin/bash

if [ "$1" = "dev" ]
then
  if test -f "/twake-react/src/app/environment/environment.ts"; then
    echo "Configuration exists, doing nothing."
  else
    cp /twake-react/src/app/environment/environment.ts.dist.dev /twake-react/src/app/environment/environment.ts
  fi
else
  if test -f "/configuration/environment.ts"; then
    cp /configuration/environment.ts /twake-react/src/app/environment/environment.ts
  else
    cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
  fi
fi

cron -f &
nginx -g "daemon off;"
