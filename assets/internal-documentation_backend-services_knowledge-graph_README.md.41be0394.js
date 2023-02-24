import{_ as e,c as a,o as n,a as s}from"./app.73ebf130.js";const C=JSON.parse('{"title":"Knowledge-graph","description":"","frontmatter":{},"headers":[{"level":2,"title":"Twake to Knowledge-graph events","slug":"twake-to-knowledge-graph-events","link":"#twake-to-knowledge-graph-events","children":[]},{"level":2,"title":"Knowledge-graph to Twake REST","slug":"knowledge-graph-to-twake-rest","link":"#knowledge-graph-to-twake-rest","children":[]}],"relativePath":"internal-documentation/backend-services/knowledge-graph/README.md"}'),l={name:"internal-documentation/backend-services/knowledge-graph/README.md"},p=s(`<h1 id="knowledge-graph" tabindex="-1">Knowledge-graph <a class="header-anchor" href="#knowledge-graph" aria-hidden="true">#</a></h1><h2 id="twake-to-knowledge-graph-events" tabindex="-1">Twake to Knowledge-graph events <a class="header-anchor" href="#twake-to-knowledge-graph-events" aria-hidden="true">#</a></h2><p>Twake can send events to the knowledge graph following this documentation:</p><p><a href="./pushed-from-twake.html">Events from Twake</a></p><h2 id="knowledge-graph-to-twake-rest" tabindex="-1">Knowledge-graph to Twake REST <a class="header-anchor" href="#knowledge-graph-to-twake-rest" aria-hidden="true">#</a></h2><p>The knowledge graph can send us event at the following endpoint: <code>POST https://api.twake.app/internal/services/knowledge-graph/v1/push</code></p><p>Authorized by a Token authorization header: <code>Authorization: Token {some token defined together}</code></p><p>And with the following data in JSON:</p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{</span></span>
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
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div>`,11),t=[p];function o(r,c,i,d,h,g){return n(),a("div",null,t)}const w=e(l,[["render",o]]);export{C as __pageData,w as default};
