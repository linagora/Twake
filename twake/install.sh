echo "⬆️ Increase vm.max_map_count..."

sudo sysctl -w vm.max_map_count=262144

echo "⏳ Install/Update docker..."

docker-compose pull

echo "✅ Twake is ready, run start.sh to start Twake."
