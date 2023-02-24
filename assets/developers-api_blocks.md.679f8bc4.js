import{_ as s,c as a,o as n,a as l}from"./app.73ebf130.js";const A=JSON.parse('{"title":"\u{1F9F1} Blocks","description":"","frontmatter":{},"headers":[{"level":2,"title":"Introduction:","slug":"introduction","link":"#introduction","children":[]},{"level":2,"title":"Write your first block:","slug":"write-your-first-block","link":"#write-your-first-block","children":[{"level":3,"title":"1. Take a look at slack block kit documentation","slug":"_1-take-a-look-at-slack-block-kit-documentation","link":"#_1-take-a-look-at-slack-block-kit-documentation","children":[]},{"level":3,"title":"2. Try your first block","slug":"_2-try-your-first-block","link":"#_2-try-your-first-block","children":[]},{"level":3,"title":"3. Twake block","slug":"_3-twake-block","link":"#_3-twake-block","children":[]}]}],"relativePath":"developers-api/blocks.md"}'),e={name:"developers-api/blocks.md"},o=l(`<h1 id="\u{1F9F1}-blocks" tabindex="-1">\u{1F9F1} Blocks <a class="header-anchor" href="#\u{1F9F1}-blocks" aria-hidden="true">#</a></h1><h2 id="introduction" tabindex="-1">Introduction: <a href="#introduction" id="introduction"></a> <a class="header-anchor" href="#introduction" aria-hidden="true">#</a></h2><p>This guide will introduce you to use blocks to custom Twake messages. Twake allows application to send customs messages. This customs messages offer the possibility for an application to easily format the text your application wants to send and/or display UI components like button, input or iframe. </p><h2 id="write-your-first-block" tabindex="-1">Write your first block: <a href="#introduction" id="introduction"></a> <a class="header-anchor" href="#write-your-first-block" aria-hidden="true">#</a></h2><h3 id="_1-take-a-look-at-slack-block-kit-documentation" tabindex="-1">1. Take a look at slack block kit documentation <a class="header-anchor" href="#_1-take-a-look-at-slack-block-kit-documentation" aria-hidden="true">#</a></h3><ul><li>Go to this page: <a href="https://api.slack.com/block-kit" target="_blank" rel="noreferrer">Slack Block kit</a></li><li>Understand basic layers of block: <ul><li><p>Block</p><p>First layer object, defining the use case of the current block (Actions, Context, Header, Files...). It can contain block elements and Composition object. </p></li><li><p>Block elements</p><p>Second layer object, defining complex element that will be display in a block (Button, Menus, Input...). It can contain composition object</p></li><li><p>Composition object </p><p>Third layer object, formatting the data to display in both block and/or block elements</p></li></ul></li></ul><h3 id="_2-try-your-first-block" tabindex="-1">2. Try your first block <a class="header-anchor" href="#_2-try-your-first-block" aria-hidden="true">#</a></h3><ul><li>Go to this page: <a href="https://app.slack.com/block-kit-builder" target="_blank" rel="noreferrer">Block Kit Builder</a></li><li>Try to add/remove block </li><li>Start writing block and check your result</li></ul><h3 id="_3-twake-block" tabindex="-1">3. Twake block <a class="header-anchor" href="#_3-twake-block" aria-hidden="true">#</a></h3><p>Twake have some blocks that are not implemented in slack block kit (iframes, progress bar and copiable). To use them please follow this: </p><h4 id="iframe" tabindex="-1">iframe <a class="header-anchor" href="#iframe" aria-hidden="true">#</a></h4><p>An iframe is <strong>Block</strong> allowing you to display an html page in twake.</p><p>How to use it: </p><ul><li>Iframe type: </li></ul><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">type BlockIframe = { </span></span>
<span class="line"><span style="color:#A6ACCD;">          type: &quot;iframe&quot;;</span></span>
<span class="line"><span style="color:#A6ACCD;">          iframe_url: string; </span></span>
<span class="line"><span style="color:#A6ACCD;">          width: number; </span></span>
<span class="line"><span style="color:#A6ACCD;">          height: number; </span></span>
<span class="line"><span style="color:#A6ACCD;">     };</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><ul><li>type: always &quot;iframe&quot;</li><li>iframe_url: the URL of the web page you want to display </li><li>width: the with that you iframe will take</li><li>height: the height that you iframe will take</li></ul><p>Example: </p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{ </span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;blocks&quot;: [ </span></span>
<span class="line"><span style="color:#A6ACCD;">        { </span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;type&quot;: &quot;iframe&quot;, </span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;iframe_url&quot;: &quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">            https://twake.app</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;, </span></span>
<span class="line"><span style="color:#A6ACCD;">            width: &quot;40vh&quot;, </span></span>
<span class="line"><span style="color:#A6ACCD;">            height: &quot;40vh&quot; </span></span>
<span class="line"><span style="color:#A6ACCD;">        }</span></span>
<span class="line"><span style="color:#A6ACCD;">    ]</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><h4 id="copiable" tabindex="-1">Copiable <a class="header-anchor" href="#copiable" aria-hidden="true">#</a></h4><p>A copiable is <strong>Block element</strong> is a readable only input allowing you to copy string with a button.</p><p>How to use it: </p><ul><li>Copiable type: it is a plain text input block element with readonly and copiable set to true</li></ul><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">type BlockElementPlaintextInput = {</span></span>
<span class="line"><span style="color:#A6ACCD;">  type: &quot;plain_text_input&quot;;</span></span>
<span class="line"><span style="color:#A6ACCD;">  action_id: string;</span></span>
<span class="line"><span style="color:#A6ACCD;">  placeholder?: CompositionPlainTextObject;</span></span>
<span class="line"><span style="color:#A6ACCD;">  initial_value?: string;</span></span>
<span class="line"><span style="color:#A6ACCD;">  multiline?: boolean;</span></span>
<span class="line"><span style="color:#A6ACCD;">  min_length?: number;</span></span>
<span class="line"><span style="color:#A6ACCD;">  max_length?: number;</span></span>
<span class="line"><span style="color:#A6ACCD;">  dispatch_action_config?: DispatchActionConfiguration;</span></span>
<span class="line"><span style="color:#A6ACCD;">  readonly?: boolean;</span></span>
<span class="line"><span style="color:#A6ACCD;">  copiable?: boolean;</span></span>
<span class="line"><span style="color:#A6ACCD;">};</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><ul><li>type: always <code>&quot;plain_text_input&quot;</code></li><li>readonly: always <code>true</code></li><li>copiable: always <code>true</code></li></ul><p>Example : </p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{ </span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;blocks&quot;: [ </span></span>
<span class="line"><span style="color:#A6ACCD;">        {</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;type&quot;: &quot;input&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;element&quot;: {</span></span>
<span class="line"><span style="color:#A6ACCD;">                &quot;type&quot;: &quot;plain_text_input&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">                &quot;action_id&quot;: &quot;plain_text_input-action&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">                &quot;initial_value&quot;: &quot;https://twake.app&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">                &quot;readonly&quot;: true,</span></span>
<span class="line"><span style="color:#A6ACCD;">                &quot;copiable&quot;: true,</span></span>
<span class="line"><span style="color:#A6ACCD;">            },</span></span>
<span class="line"><span style="color:#A6ACCD;">        }</span></span>
<span class="line"><span style="color:#A6ACCD;">    ]</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><h4 id="progress-bar" tabindex="-1">Progress bar <a class="header-anchor" href="#progress-bar" aria-hidden="true">#</a></h4><p>A Progess bar is <strong>Block element</strong> that display a progress bar.</p><p>How to use it: </p><ul><li>Progress bar type:</li></ul><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">export type BlockElementProgressBar = {</span></span>
<span class="line"><span style="color:#A6ACCD;">  type: &quot;progress_bar&quot;;</span></span>
<span class="line"><span style="color:#A6ACCD;">  value: number; </span></span>
<span class="line"><span style="color:#A6ACCD;">  title: string;</span></span>
<span class="line"><span style="color:#A6ACCD;">};</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><ul><li>type: always <code>&quot;progress_bar&quot;</code></li><li>value: the value of your progress between 0 and 100</li><li>title: the title associate to your progress bar</li></ul><p>Example : </p><div class="language-"><button class="copy"></button><span class="lang"></span><pre><code><span class="line"><span style="color:#A6ACCD;">{ </span></span>
<span class="line"><span style="color:#A6ACCD;">    &quot;blocks&quot;: [ </span></span>
<span class="line"><span style="color:#A6ACCD;">        {</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;type&quot;: &quot;progress_bar&quot;,</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;value&quot;: 50,</span></span>
<span class="line"><span style="color:#A6ACCD;">            &quot;title&quot;: &quot;Chargement&quot; </span></span>
<span class="line"><span style="color:#A6ACCD;">            </span></span>
<span class="line"><span style="color:#A6ACCD;">        }</span></span>
<span class="line"><span style="color:#A6ACCD;">    ]</span></span>
<span class="line"><span style="color:#A6ACCD;">}</span></span>
<span class="line"><span style="color:#A6ACCD;"></span></span></code></pre></div><p></p>`,35),t=[o];function p(i,c,r,u,d,C){return n(),a("div",null,t)}const h=s(e,[["render",p]]);export{A as __pageData,h as default};
