php_parameters_dist=backend/core/app/Configuration/Parameters.php.dist
react_parameters_dist=frontend/src/app/environment/environment.js.dist
docker_compose_dist=docker-compose.yml.dist.localhost

#Check dependencies
if ! command -v yarn >/dev/null 2>&1 ; then
    echo "Please install yarn"
    exit 1
fi
if ! command -v docker-compose >/dev/null 2>&1 ; then
    echo "Please install docker and docker-compose"
    exit 1
fi

#Start installation
php_parameters=backend/core/app/Configuration/Parameters.php
react_parameters=frontend/src/app/environment/environment.js

if test -f "docker-compose.yml"; then
  echo "ℹ️ $docker_compose_dist already exists, skiping default docker-compose."
else
  cp $docker_compose_dist docker-compose.yml
fi

if test -f "$php_parameters"; then
  echo "ℹ️ $php_parameters already exists, skiping default configuration."
else
  cp $php_parameters_dist $php_parameters
fi

if test -f "$react_parameters"; then
  echo "ℹ️ $react_parameters already exists, skiping default configuration."
else
  cp $react_parameters_dist $react_parameters
fi

echo "⏳ Building frontend..."

cd frontend
chmod -R 777 .
yarn install --silent
yarn build-after-sh
cd ../

echo "⬆️ Increase vm.max_map_count..."

sudo sysctl -w vm.max_map_count=262144

echo "⏳ Install/Update docker..."

docker-compose pull
docker-compose up -d


echo "⏳ Install backend..."

docker-compose exec php chmod -R 777 /tmp/
docker-compose exec php php composer.phar install

echo "⏳ Now waiting for scylladb"
res=7
while [ "$res" = "7" ]
do
        docker-compose exec php curl -s scylladb:9042 > /dev/null
        res=$?
        sleep 5
done

echo "⏳ Now waiting for elasticsearch"
res=7
while [ "$res" = "7" ]
do
        docker-compose exec php curl -s elasticsearch:9200 > /dev/null
        res=$?
        sleep 5
done

echo "⏳ Init or update scylladb..."

docker-compose exec php php bin/console twake:schema:update
docker-compose exec php php bin/console twake:mapping
docker-compose exec php php bin/console twake:init

docker-compose exec php chmod -R 777 /tmp/
docker-compose exec php chmod -R 777 /twake-core

docker-compose stop

echo "✅ Twake is ready, run start.sh to start Twake."
