docker-compose up -d
docker-compose exec php chmod -R 777 /tmp/
docker-compose exec php chmod -R 777 /twake-core

echo "⏳ Wait for scylladb..."

res=7
while [ "$res" = "7" ]
do
        docker-compose exec php curl -s scylladb:9042 > /dev/null
        res=$?
        sleep 5
done

echo "✅ Twake is running (on port 8000 if default) !"
