import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { Minus, Plus } from 'react-feather';
import './styles.scss';
import PendingFileRow from './PendingFileRow';
import Languages from 'services/languages/languages';
import { PendingFileStateType } from 'app/models/File';
import ChatUploadServiceManager from '../ChatUploads/ChatUploadService';
import { isEqual } from 'lodash';

type PropsType = {
  pendingFilesState: PendingFileStateType[];
};

const { Text } = Typography;
const { Header, Content } = Layout;
export default ({ pendingFilesState }: PropsType) => {
  const chatUploadService = ChatUploadServiceManager.get();
  const [hiddenPendingFiles, setHiddenPendingFiles] = useState<boolean>(false);
  const [counter, setCounter] = useState<{ total: number; completed: number }>({
    total: 0,
    completed: 0,
  });

  useEffect(() => {
    const c = chatUploadService.counter;

    if (!isEqual(counter, c)) {
      setCounter(c);
    }
  }, [chatUploadService.counter, counter]);

  return pendingFilesState.length > 0 ? (
    <Layout className="pending-files-list-layout">
      <Header
        className="pending-files-list-header"
        style={{ borderRadius: hiddenPendingFiles ? 8 : '8px 8px 0 0', cursor: 'pointer' }}
        onClick={() => setHiddenPendingFiles(!hiddenPendingFiles)}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'var(--white)' }}>
              {counter.total > 0 && `${counter.completed}/${counter.total} `}
              {Languages.t('components.drive_dropzone.uploading')}
            </Text>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            {hiddenPendingFiles ? <Plus size={18} /> : <Minus size={18} />}
          </Col>
        </Row>
      </Header>
      {!hiddenPendingFiles && (
        <Content className="pending-files-list-content">
          {pendingFilesState.length > 0 &&
            pendingFilesState.map((pendingFileState, index) => (
              <PendingFileRow
                key={`${pendingFileState.file?.id}-${index}`}
                pendingFileState={pendingFileState}
                pendingFile={chatUploadService.getPendingFile(pendingFileState.id)}
              />
            ))}
        </Content>
      )}
    </Layout>
  ) : (
    <></>
  );
};
