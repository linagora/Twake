import{_ as s,c as a,o as n,a as o}from"./app.ad4e2cff.js";const C=JSON.parse('{"title":"\u{1F48C} Configure mail server","description":"To configure your mail serveur with Twake.","frontmatter":{"description":"To configure your mail serveur with Twake."},"headers":[],"relativePath":"onprem/configuration/configure-mail-server.md"}'),e={name:"onprem/configuration/configure-mail-server.md"},t=o(`<h1 id="\u{1F48C}-configure-mail-server" tabindex="-1">\u{1F48C} Configure mail server <a class="header-anchor" href="#\u{1F48C}-configure-mail-server" aria-hidden="true">#</a></h1><p>Here is the default mail block in the configuration file to edit (from Parameters.php, see &quot;<a href="./">Configuration page</a>&quot;):</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">&quot;mail&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;sender&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;host&quot; =&gt; &quot;&quot;, //smtp server</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;port&quot; =&gt; &quot;&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;username&quot; =&gt; &quot;&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;password&quot; =&gt; &quot;&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;auth_mode&quot; =&gt; &quot;plain&quot; //plain, login, cram-md5, or null</span></span>
<span class="line"><span style="color:#A6ACCD;">    ],</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;from&quot; =&gt; &quot;noreply@twakeapp.com&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;dkim&quot; =&gt; [ //Optional, to avoid lost emails, configure your dns with dkim</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;private_key&quot; =&gt; &quot;&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;domain_name&quot; =&gt; &#39;&#39;,</span></span>
<span class="line"><span style="color:#A6ACCD;">        &quot;selector&quot; =&gt; &#39;&#39;</span></span>
<span class="line"><span style="color:#A6ACCD;">    ],</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;twake_domain_url&quot; =&gt; &quot;https://twakeapp.com/&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;from_name&quot; =&gt; &quot;Twake&quot;, //Server owner name</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;twake_address&quot; =&gt; &quot;Twake, 54000 Nancy, France&quot;, //Server owner address</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;template_dir&quot; =&gt; &quot;/src/Twake/Core/Resources/views/&quot;, //Must not be modified</span></span>
<span class="line"><span style="color:#A6ACCD;">],</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>\u26A0\uFE0F Once edited, don&#39;t forget to restart docker.</p><p>You can test the good behaviour of emails going into your account parameters, emails, add a secondary email. Or simply try to invite a user using its email.</p>`,5),r=[t];function l(p,i,u,c,q,d){return n(),a("div",null,r)}const A=s(e,[["render",l]]);export{C as __pageData,A as default};
