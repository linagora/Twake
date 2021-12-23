import Twacode from 'app/components/Twacode/Twacode';
import React, { ReactNode, Suspense } from 'react';
import Markdown from 'markdown-to-jsx';
import HighlightedCode from 'app/components/HighlightedCode/HighlightedCode';

type Props = {
  blocks: any;
  fallback: string | ReactNode;
  onAction: Function;
  allowAdvancedBlocks?: boolean;
};

const Code = ({ className, children }: { className: string; children: string }) => {
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
  if (!props.blocks?.length || !props.allowAdvancedBlocks) {
    return typeof props.fallback === 'string' ? (
      <div className="markdown">
        <Markdown
          options={{
            disableParsingRawHTML: true,
            overrides: {
              code: {
                component: Code,
              },
              a: {
                component: Link,
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
          {(props.fallback || '')
            //Fix markdown simple line break
            .replace(/\n/g, '  \n')}
        </Markdown>
      </div>
    ) : (
      <>{props.fallback}</>
    );
  }

  return (
    <Suspense fallback={<></>}>
      <Twacode
        content={props.blocks?.[0]?.elements || []}
        isApp={props.allowAdvancedBlocks}
        onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
          props.onAction(type, id, context, passives, evt)
        }
      />
    </Suspense>
  );
});
