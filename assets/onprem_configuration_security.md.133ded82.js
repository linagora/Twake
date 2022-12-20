import{_ as s,c as n,o as a,a as e}from"./app.0ae9291b.js";const d=JSON.parse('{"title":"\u{1F512} Security","description":"You should update this security keys to ship Twake in production.","frontmatter":{"description":"You should update this security keys to ship Twake in production."},"headers":[],"relativePath":"onprem/configuration/security.md"}'),t={name:"onprem/configuration/security.md"},o=e(`<h1 id="\u{1F512}-security" tabindex="-1">\u{1F512} Security <a class="header-anchor" href="#\u{1F512}-security" aria-hidden="true">#</a></h1><blockquote><p>See how to <a href="./">Detach Configuration</a> first.</p></blockquote><p>The following keys must be updated to increase Twake security in /configuration/backend/Parameters.php:</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">&quot;env&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;secret&quot; =&gt; &quot;somesecret&quot;, //Any string</span></span>
<span class="line"><span style="color:#A6ACCD;">],</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"><span style="color:#A6ACCD;">&quot;websocket&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  ...</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;pusher_public&quot; //Generate public and private key</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;pusher_private&quot; //Put private key here</span></span>
<span class="line"><span style="color:#A6ACCD;">],</span></span>
<span class="line"><span style="color:#A6ACCD;">&quot;db&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  ...</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;encryption_key&quot; //Any string</span></span>
<span class="line"><span style="color:#A6ACCD;">]</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"><span style="color:#A6ACCD;">&quot;storage&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  ...</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;drive_salt&quot; =&gt; &quot;SecretPassword&quot;, //Any string</span></span>
<span class="line"><span style="color:#A6ACCD;">],</span></span>
<span class="line"><span style="color:#A6ACCD;">...</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div>`,4),p=[o];function l(c,r,i,u,A,C){return a(),n("div",null,p)}const _=s(t,[["render",l]]);export{d as __pageData,_ as default};
