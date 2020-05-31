import * as SCSocket from 'socketcluster-client';
import Globals from 'services/Globals.js';

class SocketClusterInstance {
  constructor() {
    this.connection = null;
    this.listeners = {};
  }

  connect() {
    var url = Globals.window.websocket_url;
    url = url.split('://');
    var method = 'ws';
    if (url.length > 1) {
      method = url[0];
      url = url[1];
    } else {
      url = url[0];
    }

    url = url.split(':');
    var domain = url;
    var port = method == 'ws' ? '80' : '443';
    if (url.length > 1) {
      domain = url[0];
      port = url[1];
    }

    this.connection = SCSocket.create({
      hostname: domain,
      port: port,
      secure: method == 'wss',
    });

    (async () => {
      const iterator = this.connection.listener('message');
      while (true) {
        const { value, done } = await iterator.next();
        if (done) break;
        var packet = value.message;
        try {
          if (typeof packet == 'string') {
            packet = JSON.parse(packet);
          }
          if (packet.event == '#publish' && packet.data) {
            var channel = packet.data.channel;
            var data = packet.data.data;

            if (this.listeners[channel]) {
              this.listeners[channel](channel, data);
            }
          }
        } catch (e) {}
      }
    })();

    return this;
  }

  on(event, cb) {
    if (event == 'socket/connect') {
      if (this.connection.state == 'open') {
        if (cb) cb(this);
      }
      (async () => {
        const iterator = this.connection.listener('connect');
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (cb && !this.disable_events) cb(this);
          console.log('connected to ws', value);
        }
      })();
    }
    if (event == 'socket/disconnect') {
      (async () => {
        const iterator = this.connection.listener('close');
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (cb && !this.disable_events) cb(value);
          console.log('disconnected from ws', value);
        }
      })();
    }
  }

  subscribe(route, cb) {
    let channel = this.connection.subscribe(route);
    channel
      .listener('subscribe')
      .once()
      .then(data => {
        this.listeners[route] = cb;
      });
  }

  unsubscribe(route, cb) {
    let channel = this.connection.unsubscribe(route);
    delete this.listeners[route];
  }

  publish(route, value, cb) {
    try {
      this.connection.invokePublish(route, value).then(cb ? cb : () => {});
    } catch (error) {
      console.log(error);
    }
  }

  call(route, value) {
    return this.connection.invoke(route, value);
  }

  close() {
    this.disable_events = true;
    this.connection.disconnect();
  }
}

class SocketCluster {
  connect() {
    return new SocketClusterInstance().connect();
  }
}

var sc = new SocketCluster();
export default sc;
