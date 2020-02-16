const http = require("http");
const socketClusterServer = require("socketcluster-server");

let httpServer = http.createServer();
let agServer = socketClusterServer.attach(httpServer);
let port = 8080;

(async () => {
    console.log("Listening on port " + port);

    for await (let {socket} of agServer.listener("connection")) {
        console.log("new co");
        (async () => {
            for await (let req of socket.procedure("ping/ping")) {
                req.end("OK");
            }
        })();
    }
})();


(async () => {
    for await (let event of agServer.listener("connectionAbort")) {
        console.log("event", event);
    }
})();


httpServer.listen(port);
