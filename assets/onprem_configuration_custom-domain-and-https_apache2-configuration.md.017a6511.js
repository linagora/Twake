import{_ as s,c as a,o as n,a as e}from"./app.73ebf130.js";const h=JSON.parse('{"title":"Apache2 configuration","description":"\u{1F64F} From Dahpril (community) https://github.com/TwakeApp/Twake/issues/76","frontmatter":{"description":"\u{1F64F} From Dahpril (community) https://github.com/TwakeApp/Twake/issues/76"},"headers":[],"relativePath":"onprem/configuration/custom-domain-and-https/apache2-configuration.md"}'),o={name:"onprem/configuration/custom-domain-and-https/apache2-configuration.md"},t=e(`<h1 id="apache2-configuration" tabindex="-1">Apache2 configuration <a class="header-anchor" href="#apache2-configuration" aria-hidden="true">#</a></h1><h4 id="apache-vhost" tabindex="-1">Apache vhost <a class="header-anchor" href="#apache-vhost" aria-hidden="true">#</a></h4><p>You need to create a vhost listening on port 443.</p><p><em>For exemple with certbot :</em></p><p><em>1. Create a vhost listening on port 80 with ServerName equals to your custom domain. Don&#39;t define any document root. 2. Then, use certbot to get a certificate and automatically create your vhost listening on port 443</em></p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">sudo certbot --apache --email your_email -d your_domain --agree-tos --redirect --noninteractive</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><h4 id="reverse-proxy" tabindex="-1">Reverse proxy <a class="header-anchor" href="#reverse-proxy" aria-hidden="true">#</a></h4><p>You have now to configure your reverse proxy directive. Head up to your 443 vhost configuration file and paste those directives (place them after server and ssl directives) :</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">RewriteEngine on</span></span>
<span class="line"><span style="color:#A6ACCD;">RewriteCond \${HTTP:Upgrade} websocket [NC]</span></span>
<span class="line"><span style="color:#A6ACCD;">RewriteCond \${HTTP:Connection} upgrade [NC]</span></span>
<span class="line"><span style="color:#A6ACCD;">RewriteRule .* &quot;wss://127.0.0.1:8000/$1&quot; [P,L]</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">ProxyRequests off</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;Location /&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPass http://127.0.0.1:8000/</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPassReverse http://127.0.0.1:8000/</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPreserveHost On</span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;/Location&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;Location /socketcluster&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPass ws://127.0.0.1:8000/socketcluster</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPassReverse ws://127.0.0.1:8000/socketcluster</span></span>
<span class="line"><span style="color:#A6ACCD;">    ProxyPreserveHost On</span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;/Location&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;Proxy *&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">    AllowOverride All</span></span>
<span class="line"><span style="color:#A6ACCD;">    Order allow,deny</span></span>
<span class="line"><span style="color:#A6ACCD;">    Allow from All</span></span>
<span class="line"><span style="color:#A6ACCD;">&lt;/Proxy&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">RequestHeader set X-Forwarded-port &quot;80&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>Be careful to NOT type trailing slash for ws location (it won&#39;t work).</p><p>I&#39;m not sure that all directives are needed, but this configuration works for me.</p><h4 id="configuring-remoteip" tabindex="-1">Configuring remoteip <a class="header-anchor" href="#configuring-remoteip" aria-hidden="true">#</a></h4><p>You also need to configure remoteip mod from apache with this command :</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">a2enmod remoteip</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>Then, edit /etc/apache2/conf-available/remoteip.conf to fit with this content :</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">RemoteIPHeader X-Real-IP</span></span>
<span class="line"><span style="color:#A6ACCD;">RemoteIPTrustedProxy 127.0.0.1 ::1</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>You can now enable the configuration of remoteip and restart Apache :</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">a2enconf remoteip</span></span>
<span class="line"><span style="color:#A6ACCD;">service apache2 restart</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>Return to the section &quot;Configure domain name&quot; of <a href="./README.html#configure-domain-name">Custom domain + HTTPS</a> page to continue the configuration.</p>`,19),p=[t];function l(r,c,i,d,u,A){return n(),a("div",null,p)}const y=s(o,[["render",l]]);export{h as __pageData,y as default};
