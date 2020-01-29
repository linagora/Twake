#!/bin/bash

chmod -R 777 /tmp/
cron -f &
php /twake-core/bin/console g:w:s --env=prod -p 1238 -vvv &
sleep 5
docker-php-entrypoint curl -i --no-buffer -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:8080" -H "Origin: http://localhost:8080" -H "Sec-WebSocket-Key: 3kATaBNFAtVDtR1JRYDG+A==" -H "Sec-WebSocket-Protocol: wamp" -H "Sec-WebSocket-Version: 13" localhost:8080/
