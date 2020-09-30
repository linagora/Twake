#!/bin/sh

if [ "$1" = "dev" ]
then
  if test -f "/twake-node/configuration/configuration.json"; then
    echo "Configuration exists, doing nothing."
  else
    cp /twake-node/configuration/configuration.json.dist /twake-node/configuration/configuration.json
  fi

  npm run start:prod
else
  if test -f "/configuration/configuration.json"; then
    cp /configuration/* /twake-node/configuration/
  else
    cp /twake-node/configuration/configuration.json.dist /twake-node/configuration/configuration.json
  fi

  npm run start:dev
fi

