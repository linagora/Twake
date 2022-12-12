import Twacode from 'app/components/twacode/twacode';
import React, { ReactNode, Suspense } from 'react';
import Markdown from 'markdown-to-jsx';
import HighlightedCode from 'app/components/highlighted-code/highlighted-code';
import { preparse, preunparse } from './Blocks.utils';
import User from 'components/twacode/blocks/user';
import Chan from 'components/twacode/blocks/chan';
import { blocksToTwacode, formatData } from 'app/components/twacode/blocksCompiler';
import environment from 'app/environment/environment';
import { Block } from 'app/components/twacode/types';

type Props = {
  blocks: unknown[];
  fallback: string | ReactNode;
  onAction: (type: string, id: string, context: unknown, passives: unknown, evt: unknown) => void;
  allowAdvancedBlocks?: boolean;
};

const Code = ({ className, children }: { className: string; children: string }) => {
  children = preunparse(children);
  if (children.split('\n').length === 1) {
    return <code>{children}</code>;
  }
  return <HighlightedCode className={className + ' multiline-code'} code={children} />;
};

const Link = ({ href, children }: { href: string; children: string }) => {
  let target = '_blank';
  if (!href) {
    return <a href="#">{children}</a>;
  }
  //If same domain, stay on the same tab
  if (
    href
      ?.replace(/https?:\/\//g, '')
      ?.split('/')[0]
      ?.toLocaleLowerCase() ===
    environment.front_root_url
      .replace(/https?:\/\//g, '')
      .split('/')[0]
      ?.toLocaleLowerCase()
  ) {
    target = '_self';
  }

  return (
    <a target={target} rel="noreferrer" href={href?.replace(/^javascript:/, '')}>
      {children}
    </a>
  );
};

export default React.memo((props: Props) => {
  const flattedBlocks: Block[] = [];
  formatData(props.blocks || [], 'content', flattedBlocks);
  const blocks = blocksToTwacode(flattedBlocks);

  if (!props.blocks?.length || !props.allowAdvancedBlocks) {
    return typeof props.fallback === 'string' ? (
      <div className="markdown">
        <Markdown
          options={{
            forceBlock: true,
            overrides: {
              code: {
                component: Code,
              },
              a: {
                component: Link,
              },
              user: {
                component: ({ id }) => (
                  <>
                    <User hideUserImage={false} username={id} />{' '}
                  </>
                ),
              },
              channel: {
                component: ({ id }) => (
                  <>
                    <Chan id={id} name={id} />{' '}
                  </>
                ),
              },
              h1: ({ children }) => children,
              h2: ({ children }) => children,
              h3: ({ children }) => children,
              h4: ({ children }) => children,
              h5: ({ children }) => children,
              h6: ({ children }) => children,
            },
          }}
        >
          {preparse(props.fallback || '')}
        </Markdown>
      </div>
    ) : (
      <>{props.fallback}</>
    );
  }

  return (
    <Suspense fallback={<></>}>
      <Twacode
        content={blocks}
        isApp={props.allowAdvancedBlocks}
        onAction={(type: string, id: string, context: unknown, passives: unknown, evt: unknown) =>
          props.onAction(type, id, context, passives, evt)
        }
      />
    </Suspense>
  );
});
