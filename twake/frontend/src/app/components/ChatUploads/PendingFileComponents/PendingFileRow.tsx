import React from 'react';
import { Row, Col, Typography, Divider, Progress, Button, Tooltip } from 'antd';
import { Pause, Play, X } from 'react-feather';
import { PendingFileStateType, PendingFileType } from 'app/models/File';
import {
  isPendingFileStatusError,
  isPendingFileStatusPause,
  isPendingFileStatusSuccess,
} from '../utils/PendingFiles';
import Languages from 'services/languages/languages';
import { useUploadHook } from 'app/state/recoil/hooks/useChatUploadService';

type PropsType = {
  pendingFileState: PendingFileStateType;
  pendingFile: PendingFileType;
};

const { Text } = Typography;
export default ({ pendingFileState, pendingFile }: PropsType) => {
  const { pauseOrResumeUpload, cancelUpload } = useUploadHook();

  const getProgressStrokeColor = (status: PendingFileStateType['status']) => {
    if (isPendingFileStatusError(status)) return 'var(--error)';
    if (isPendingFileStatusPause(status)) return 'var(--warning)';

    return 'var(--success)';
  };

  const setStatus = () => {
    switch (pendingFileState.status) {
      case 'error':
      case 'pause':
        return 'exception';
      case 'pending':
        return 'active';
      case 'success':
        return 'success';
      default:
        return 'normal';
    }
  };

  return (
    <>
      <Row
        justify="space-around"
        align="middle"
        wrap={false}
        style={{
          padding: '4px 4px',
          width: '100%',
        }}
      >
        <Col className="small-left-margin" flex={3} style={{ lineHeight: '16px' }}>
          {pendingFile.originalFile.name ? (
            <Text ellipsis style={{ width: 160, verticalAlign: 'middle' }}>
              {pendingFile.originalFile.name}
            </Text>
          ) : (
            <div
              style={{
                marginTop: 8,
                height: 8,
                maxWidth: 160,
                borderRadius: 8,
                backgroundColor: 'var(--grey-background)',
              }}
            />
          )}
          <Progress
            type="line"
            percent={pendingFileState.progress * 100}
            showInfo={false}
            status={setStatus()}
            strokeColor={getProgressStrokeColor(pendingFileState.status)}
          />
        </Col>

        <Col flex={1} style={{ display: 'flex', alignItems: 'center', lineHeight: '16px' }}>
          {pendingFileState.id ? (
            !isPendingFileStatusSuccess(pendingFileState.status) &&
            !isPendingFileStatusError(pendingFileState.status) ? (
              <Tooltip
                placement="top"
                title={
                  isPendingFileStatusPause(pendingFileState.status)
                    ? Languages.t('general.resume')
                    : Languages.t('general.pause')
                }
              >
                <Button
                  type="link"
                  shape="circle"
                  disabled={isPendingFileStatusError(pendingFileState.status)}
                  icon={
                    isPendingFileStatusPause(pendingFileState.status) ? (
                      <Play size={14} style={{ marginLeft: 4 }} />
                    ) : (
                      <Pause size={14} />
                    )
                  }
                  onClick={() => pauseOrResumeUpload(pendingFileState.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Tooltip>
            ) : (
              <div style={{ width: 32 }} />
            )
          ) : (
            <div
              style={{
                marginTop: 8,
                height: 8,
                maxWidth: 32,
                borderRadius: 8,
                backgroundColor: 'var(--grey-background)',
              }}
            />
          )}
        </Col>

        <Col flex={1} style={{ display: 'flex', alignItems: 'center', lineHeight: '16px' }}>
          {!isPendingFileStatusSuccess(pendingFileState.status) &&
          !isPendingFileStatusError(pendingFileState.status) ? (
            <Tooltip title={Languages.t('general.cancel')} placement="top">
              <Button
                type="link"
                shape="circle"
                icon={<X size={16} color={'var(--error)'} />}
                onClick={() => cancelUpload(pendingFileState.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          ) : (
            <div style={{ width: 32 }} />
          )}
        </Col>
      </Row>
      <Divider style={{ margin: 0 }} />
    </>
  );
};
