#Force kill any server on 8242
kill $(lsof -i:8242 -t -sTCP:LISTEN)
exec php bin/console gos:websocket:server --env=prod