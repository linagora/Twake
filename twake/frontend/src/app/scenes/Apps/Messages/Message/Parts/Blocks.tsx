import Twacode from 'app/components/Twacode/Twacode';
import React, { ReactNode, useState } from 'react';

type Props = {
  blocks: any;
  fallback: string | ReactNode;
  onAction: Function;
  allowAdvancedBlocks?: boolean;
};

export default React.memo((props: Props) => {
  return (
    <>
      <Twacode
        content={props.blocks?.[0]?.elements || []}
        isApp={props.allowAdvancedBlocks}
        onAction={(type: string, id: string, context: any, passives: any, evt: any) =>
          props.onAction(type, id, context, passives, evt)
        }
      />
    </>
  );
});
