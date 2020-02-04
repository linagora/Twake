#Force kill any server on 8080
kill $(lsof -i:8080 -t -sTCP:LISTEN)
exec node index.js