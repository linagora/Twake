import React, { useState } from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { Minus, Plus } from 'react-feather';
import './styles.scss';
import PendingFileRow from './PendingFileRow';
import Languages from 'services/languages/languages';
import { PendingFileRecoilType } from 'app/models/File';
import { useUploadHook } from 'app/state/recoil/hooks/useUploadHook';
import classNames from 'classnames';

type PropsType = {
  pendingFilesState: PendingFileRecoilType[];
};

const { Text } = Typography;
const { Header, Content } = Layout;
export default ({ pendingFilesState }: PropsType) => {
  const { getOnePendingFile, currentTask } = useUploadHook();
  const [hiddenPendingFiles, setHiddenPendingFiles] = useState<boolean>(false);

  return pendingFilesState.length > 0 ? (
    <Layout className="pending-files-list-layout">
      <Header
        className={classNames('pending-files-list-header', {
          hidden: hiddenPendingFiles,
        })}
        onClick={() => setHiddenPendingFiles(!hiddenPendingFiles)}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'var(--white)' }}>
              {currentTask.total > 0 && `${currentTask.uploaded}/${currentTask.total} `}
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
                pendingFile={getOnePendingFile(pendingFileState.id)}
              />
            ))}
        </Content>
      )}
    </Layout>
  ) : (
    <></>
  );
};
