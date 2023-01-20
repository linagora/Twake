import{_ as s,c as n,o as a,a as e}from"./app.62fc67bd.js";const u=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"internal-documentation/backend-services/knowledge-graph/README.md"}'),l={name:"internal-documentation/backend-services/knowledge-graph/README.md"},p=e(`<p>The knowledge graph can send us event at the following endpoint: <code>POST https://api.twake.app/internal/services/knowledge-graph/v1/push</code></p><p>Authorized by a Token authorization header: <code>Authorization: Token {some token defined together}</code></p><p>And with the following data in JSON:</p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">  events: [KnowledgeGraphCallbackEvent, KnowledgeGraphCallbackEvent, KnowledgeGraphCallbackEvent, ...]</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;">type KnowledgeGraphCallbackEvent = {</span></span>
<span class="line"><span style="color:#A6ACCD;">  recipients: {</span></span>
<span class="line"><span style="color:#A6ACCD;">    type: &quot;user&quot;;</span></span>
<span class="line"><span style="color:#A6ACCD;">    id: string; // KG user id which is a md5 of the email</span></span>
<span class="line"><span style="color:#A6ACCD;">  }[];</span></span>
<span class="line"><span style="color:#A6ACCD;">  event: {</span></span>
<span class="line"><span style="color:#A6ACCD;">    type: &quot;user_tags&quot;; //More events will be added later</span></span>
<span class="line"><span style="color:#A6ACCD;">    data: {</span></span>
<span class="line"><span style="color:#A6ACCD;">      //For user_tags event only</span></span>
<span class="line"><span style="color:#A6ACCD;">      tags?: {</span></span>
<span class="line"><span style="color:#A6ACCD;">        value: string;</span></span>
<span class="line"><span style="color:#A6ACCD;">        weight: number;</span></span>
<span class="line"><span style="color:#A6ACCD;">      }[];</span></span>
<span class="line"><span style="color:#A6ACCD;">    };</span></span>
<span class="line"><span style="color:#A6ACCD;">  };</span></span>
<span class="line"><span style="color:#A6ACCD;">};</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p>The reply will be if everything was alright:</p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">  &quot;status&quot;: &quot;success&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div>`,6),o=[p];function t(c,r,i,A,C,d){return a(),n("div",null,o)}const h=s(l,[["render",t]]);export{u as __pageData,h as default};
