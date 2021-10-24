cp -n docker-compose.yml.dist.onpremise docker-compose.yml

if [ ! -d ./configuration ]; then #create configuration folder
  cp -nR ./default-configuration ./configuration
else
  cp -nR ./default-configuration/* ./configuration
fi

docker-compose pull

docker-compose up -d scylladb rabbitmq
sleep 5m #Wait scylladb to startup
docker-compose up -d php
sleep 10m #Wait php to create tables in scylladb

docker-compose up -d
