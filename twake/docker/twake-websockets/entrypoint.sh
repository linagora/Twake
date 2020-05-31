#!/bin/bash

ls -l
npm install -no-cache
node index.js
sleep 5
curl -i --no-buffer -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:8080" -H "Origin: http://localhost:8080" -H "Sec-WebSocket-Key: 3kATaBNFAtVDtR1JRYDG+A==" -H "Sec-WebSocket-Protocol: wamp" -H "Sec-WebSocket-Version: 13" localhost:8080/
watch ls