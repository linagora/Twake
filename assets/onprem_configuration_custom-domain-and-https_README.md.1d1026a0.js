import{_ as s,c as n,o as a,a as e}from"./app.73ebf130.js";const C=JSON.parse('{"title":"\u{1F517} Custom domain + HTTPS","description":"Use a custom domain with Twake","frontmatter":{"description":"Use a custom domain with Twake"},"headers":[],"relativePath":"onprem/configuration/custom-domain-and-https/README.md"}'),o={name:"onprem/configuration/custom-domain-and-https/README.md"},t=e(`<h1 id="\u{1F517}-custom-domain-https" tabindex="-1">\u{1F517} Custom domain + HTTPS <a class="header-anchor" href="#\u{1F517}-custom-domain-https" aria-hidden="true">#</a></h1><div class="info custom-block"><p class="custom-block-title">INFO</p><p>We do not offer the possibility to edit the nginx configuration present in the docker-compose containers yet. To enable https you first need to install nginx and configure on your machine.</p><p>Your nginx installation will be used to forward the requests from https to the docker-compose http port.</p><p>The last step is to tell Twake that the frontend is accessed from a different domain and protocol to handle the redirections.</p></div><h4 id="use-port-80-or-443-over-https" tabindex="-1">Use port 80 or 443 over https <a class="header-anchor" href="#use-port-80-or-443-over-https" aria-hidden="true">#</a></h4><p>To use 443 create a new nginx install and attach a proxy to port 8000 + certauto.<br> If you use Apache2 go on the <a href="./apache2-configuration.html">Apache2 configuration page</a>.</p><blockquote><p>Follow this thread if you have issues with websockets and reverse proxy: <a href="https://community.twake.app/t/twake-on-docker-behind-apache-proxy/78" target="_blank" rel="noreferrer">https://community.twake.app/t/twake-on-docker-behind-apache-proxy/78</a></p></blockquote><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;"># /etc/nginx/site-enabled/default</span></span>
<span class="line"><span style="color:#A6ACCD;">location / {</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_pass http://127.0.0.1:8000;</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">location /socketcluster/ {</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_pass http://127.0.0.1:8000/socketcluster/;</span></span>
<span class="line"><span style="color:#A6ACCD;">    # this magic is needed for WebSocket</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_http_version  1.1;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_set_header    Upgrade $http_upgrade;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_set_header    Connection &quot;upgrade&quot;;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_set_header    Host $http_host;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_set_header    X-Real-IP $remote_addr;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_connect_timeout 7d;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_send_timeout 7d;</span></span>
<span class="line"><span style="color:#A6ACCD;">    proxy_read_timeout 7d;</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><h4 id="configure-domain-name" tabindex="-1">Configure domain name <a class="header-anchor" href="#configure-domain-name" aria-hidden="true">#</a></h4><p>You must edit the configuration in both <code>configuration/frontend/environment.ts</code> and <code>configuration/backend/Parameters.php</code></p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">//Exemple of environment.ts</span></span>
<span class="line"><span style="color:#A6ACCD;">export default {</span></span>
<span class="line"><span style="color:#A6ACCD;">  env_dev: false,</span></span>
<span class="line"><span style="color:#A6ACCD;">  mixpanel_enabled: false,</span></span>
<span class="line"><span style="color:#A6ACCD;">  sentry_dsn: false,</span></span>
<span class="line"><span style="color:#A6ACCD;">  mixpanel_id: false,</span></span>
<span class="line"><span style="color:#A6ACCD;">  front_root_url: &#39;https://twake.acme.com&#39;,</span></span>
<span class="line"><span style="color:#A6ACCD;">  api_root_url: &#39;https://twake.acme.com&#39;,</span></span>
<span class="line"><span style="color:#A6ACCD;">  websocket_url: &#39;wss://twake.acme.com&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">};</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">//To change in Parameters.php</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"><span style="color:#A6ACCD;">&quot;env&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">    ...</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;server_name&quot; =&gt; &quot;https://twake.acme.com/&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">],</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><blockquote><p>Dont forget to restart your docker-compose \u{1F609} and rebuild the frontend:<br><code>docker-compose exec nginx yarn build</code></p></blockquote>`,11),p=[t];function l(c,r,i,d,h,u){return a(),n("div",null,p)}const m=s(o,[["render",l]]);export{C as __pageData,m as default};
