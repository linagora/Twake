import Twacode from 'app/components/twacode/twacode';
import React, { ReactNode, Suspense } from 'react';
import Markdown from 'markdown-to-jsx';
import HighlightedCode from 'app/components/highlighted-code/highlighted-code';
import { preparse, preunparse } from './Blocks.utils';
import User from 'components/twacode/blocks/user';
import Chan from 'components/twacode/blocks/chan';
import { blocksToTwacode, formatData } from 'app/components/twacode/blocksCompiler';

type Props = {
  blocks: any;
  fallback: string | ReactNode;
  onAction: Function;
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
  return (
    <a target="_blank" href={href}>
      {children}
    </a>
  );
};

export default React.memo((props: Props) => {
  const flattedBlocks: any[] = [];
  formatData(props.blocks || [], 'content', flattedBlocks);
  const blocks = blocksToTwacode(flattedBlocks);

  if (!props.blocks?.length || !props.allowAdvancedBlocks) {
    return typeof props.fallback === 'string' ? (
      <div className="markdown">
        <Markdown
          options={{
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
        onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
          props.onAction(type, id, context, passives, evt)
        }
      />
    </Suspense>
  );
});
