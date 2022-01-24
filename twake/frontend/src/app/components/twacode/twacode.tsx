import React, { useState, useEffect } from 'react';

import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import Compile from './compile';
import './twacode.scss';

type Props = {
  className?: string;
  content: any;
  before?: any;
  after?: any;
  isApp?: boolean;
  simple?: boolean;
  onPassiveChange?: (type: string, id: string, context: any, value: any) => void;
  onAction?: (type: string, id: string, context: any, value: any, evt: any) => void;
};

export default React.memo((props: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let container: any = null;
  let passives: any = {};
  let loadingInteraction_timeout: any = 0;
  let saved_stringified: string = '';

  const [loadingInteraction, setLoadingInteraction] = useState(false);

  const event_container = {
    onAction: (type: string, id: string, context: any, value: any, evt: any) => {
      //Button pressed
      if (type === 'interactive_action') {
        if (props.onAction) {
          setLoadingInteraction(true);
          clearTimeout(loadingInteraction_timeout);
          loadingInteraction_timeout = setTimeout(() => {
            saved_stringified = '';
            setLoadingInteraction(false);
          }, 5000);
          props.onAction(type, id, context, JSON.parse(JSON.stringify(passives)), evt);
        }
      }

      //Input changed
      if (type === 'interactive_change') {
        passives[id] = value;
        if (props.onPassiveChange) {
          props.onPassiveChange(type, id, context, value);
        }
      }
    },
  };

  useEffect(() => {
    var stringified = JSON.stringify([props.content]);
    if (stringified !== saved_stringified) {
      clearTimeout(loadingInteraction_timeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      saved_stringified = stringified;
      setLoadingInteraction(false);
    }
    return () => {
      //Called when element is unmounted
      clearTimeout(loadingInteraction_timeout);
    };
  }, [props.content]);

  return (
    <div
      ref={node => (container = node)}
      {...props}
      className={'markdown ' + (loadingInteraction ? 'loadingInteraction ' : '') + props.className}
    >
      {!!props.simple &&
        PseudoMarkdownCompiler.compileToSimpleHTML(props.content, true || props.isApp)}
      {!props.simple && (
        <Compile
          content={props.content}
          isApp={true || props.isApp}
          eventContainer={event_container}
        />
      )}
    </div>
  );
});
