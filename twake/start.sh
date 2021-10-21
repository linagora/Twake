#!/bin/sh
set -e

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

cp -n docker-compose.onpremise.yml docker-compose.yml

if [ ! -d ./configuration ]; then #create configuration folder
  cp -nR ./default-configuration ./configuration
else
  cp -nR ./default-configuration/* ./configuration
fi

data_folders=(./docker-data ./docker-data/documents ./docker-data/drive ./docker-data/drive-preview \
			  ./docker-data/fpm ./docker-data/letsencrypt ./docker-data/logs ./docker-data/logs/nginx \
			  ./docker-data/scylladb ./docker-data/uploads ./connectors)
for folder in "${data_folders[@]}"; do if [ ! -d "$folder" ]; then mkdir "$folder"; fi; done #create mounted folders

docker-compose pull

docker-compose up -d scylladb rabbitmq
sleep 5m #Wait scylladb to startup
docker-compose up -d php
sleep 10m #Wait php to create tables in scylladb

docker-compose up -d
