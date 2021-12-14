import Twacode from 'app/components/Twacode/Twacode';
import React, { ReactNode } from 'react';
import Markdown from 'markdown-to-jsx';

type Props = {
  blocks: any;
  fallback: string | ReactNode;
  onAction: Function;
  allowAdvancedBlocks?: boolean;
};

export default React.memo((props: Props) => {
  if (!props.blocks?.length || !props.allowAdvancedBlocks) {
    return typeof props.fallback === 'string' ? (
      <Markdown options={{ disableParsingRawHTML: true }}>{props.fallback}</Markdown>
    ) : (
      <>{props.fallback}</>
    );
  }

  return <>{props.fallback}</>;

  return (
    <Twacode
      content={props.blocks?.[0]?.elements || []}
      isApp={props.allowAdvancedBlocks}
      onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
        props.onAction(type, id, context, passives, evt)
      }
    />
  );
});
