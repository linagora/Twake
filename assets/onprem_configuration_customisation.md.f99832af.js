import{_ as s,c as a,o as n,a as o}from"./app.ad4e2cff.js";const g=JSON.parse('{"title":"\u{1F3A8} Customisation","description":"How to make Twake feel better in your company.","frontmatter":{"description":"How to make Twake feel better in your company."},"headers":[{"level":3,"title":"Customise style and logos","slug":"customise-style-and-logos","link":"#customise-style-and-logos","children":[]},{"level":3,"title":"Customize apps","slug":"customize-apps","link":"#customize-apps","children":[]}],"relativePath":"onprem/configuration/customisation.md"}'),e={name:"onprem/configuration/customisation.md"},t=o(`<h1 id="\u{1F3A8}-customisation" tabindex="-1">\u{1F3A8} Customisation <a class="header-anchor" href="#\u{1F3A8}-customisation" aria-hidden="true">#</a></h1><blockquote><p>Customising Twake on SaaS (web.twake.app) is not available yet, contact sales to install an on-premise Twake version.</p></blockquote><h3 id="customise-style-and-logos" tabindex="-1">Customise style and logos <a class="header-anchor" href="#customise-style-and-logos" aria-hidden="true">#</a></h3><p>You can customise Twake for your brand using the <code>configuration/backend/Parameters.php</code> file.</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">&quot;defaults&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;branding&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;header&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;logo&quot; =&gt; &#39;&#39;, //Some logo used on header coloured background</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;apps&quot; =&gt; [ //A list of apps accessible from header</span></span>
<span class="line"><span style="color:#A6ACCD;">        [</span></span>
<span class="line"><span style="color:#A6ACCD;">          &quot;name&quot;=&gt; &#39;&#39;, //App name</span></span>
<span class="line"><span style="color:#A6ACCD;">          &quot;url&quot;=&gt; &#39;&#39;, //Url to your app</span></span>
<span class="line"><span style="color:#A6ACCD;">          &quot;icon&quot;=&gt; &#39;&#39;, //App icon as image</span></span>
<span class="line"><span style="color:#A6ACCD;">        ],</span></span>
<span class="line"><span style="color:#A6ACCD;">      ],</span></span>
<span class="line"><span style="color:#A6ACCD;">    ],</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;style&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;color&quot; =&gt; &#39;#2196F3&#39;, //Change default main color</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;default_border_radius&quot; =&gt; &#39;2&#39;, //Change default main border-radius</span></span>
<span class="line"><span style="color:#A6ACCD;">    ],</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;name&quot; =&gt; &quot;&quot;, //Brand name</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;enable_newsletter&quot; =&gt; false, //Disable newsletter checkbox on subscribe</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;link&quot; =&gt; &quot;&quot;, //Link to your website (showed on login page)</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;logo&quot; =&gt; &quot;&quot; //Coloured logo (white background)</span></span>
<span class="line"><span style="color:#A6ACCD;">  ]</span></span>
<span class="line"><span style="color:#A6ACCD;">]</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><h3 id="customize-apps" tabindex="-1">Customize apps <a class="header-anchor" href="#customize-apps" aria-hidden="true">#</a></h3><p>You can disable default apps with this command (apps will not be installed on future new companies or workspaces)</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">&quot;defaults&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;applications&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;twake_calendar&quot; =&gt; false, //Not available</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;twake_tasks&quot; =&gt; [ &quot;default&quot; =&gt; false ], //Available but not by default</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;twake_drive&quot; =&gt; [ &quot;default&quot; =&gt; true ], //Available and by default in every new workspaces</span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;connectors&quot; =&gt; [</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;jitsi&quot; =&gt; [ &quot;default&quot; =&gt; true ],</span></span>
<span class="line"><span style="color:#A6ACCD;">      &quot;linshare&quot; =&gt; false</span></span>
<span class="line"><span style="color:#A6ACCD;">    ]</span></span>
<span class="line"><span style="color:#A6ACCD;">  ]</span></span>
<span class="line"><span style="color:#A6ACCD;">]</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>After editing this configuration, <strong>restart docker-compose</strong> (to import new configuration) and type the following command:</p><div class="language-text"><button class="copy"></button><span class="lang">text</span><pre><code><span class="line"><span style="color:#A6ACCD;">#docker-compose restart #To import new configuration</span></span>
<span class="line"><span style="color:#A6ACCD;">docker-compose exec php php bin/console twake:init</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div>`,10),l=[t];function p(c,i,r,u,d,C){return n(),a("div",null,l)}const q=s(e,[["render",p]]);export{g as __pageData,q as default};
