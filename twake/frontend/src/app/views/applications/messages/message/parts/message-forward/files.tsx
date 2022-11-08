import { Row } from 'antd';
import { MessageFileType } from 'app/features/messages/types/message';
import PossiblyPendingAttachment from '../PossiblyPendingAttachment';

export const ForwardedFiles = (props: { files: MessageFileType[] }) => {
  return (
    <Row justify="start" align="middle" className="small-top-margin" wrap>
      {props.files
        .filter(f => f.metadata)
        .map(file => (
          <PossiblyPendingAttachment
            key={file.metadata?.external_id || file.id}
            type={'message'}
            file={file}
          />
        ))}
    </Row>
  );
};
