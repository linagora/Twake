cp -n docker-compose.yml.dist docker-compose.yml
cp -nR default-configuration configuration
docker-compose pull
docker-compose up -d