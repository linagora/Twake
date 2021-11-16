import React, { Suspense, useEffect, useRef, useState } from 'react';

import { isEqual } from 'lodash';
import { Avatar, Button, Col, Descriptions, Divider, Input, Row, Switch, Typography } from 'antd';

import Languages from 'services/languages/languages';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useCurrentWorkspace';
import AvatarComponent from 'app/components/Avatar/Avatar';
import ModalManager from 'app/components/Modal/ModalManager';
import DeleteWorkspacePopup from './DeleteWorkspacePopup';
import { WorkspaceType } from 'app/models/Workspace';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import UploadService from 'services/uploadManager/uploadManager';

const { Item } = Descriptions;
const { Text, Title, Link } = Typography;
export default () => {
  const uploadInputRef = useRef<HTMLInputElement>();
  const workspace = useCurrentWorkspace();
  const [workspaceName, setWorkspaceName] = useState<string | undefined>(workspace?.name);
  const [disabledLogoSaveButton, setDisabledLogoSaveButton] = useState<boolean>(true);

  const onClickUpdateWorkspace = async (partials: Partial<WorkspaceType>) => {
    const updatedObject: Pick<WorkspaceType, 'name' | 'logo' | 'default' | 'archived'> = {
      name: partials.name || workspace?.name || '',
      default: partials.default || workspace?.default || false,
      logo: partials.logo || workspace?.logo || '',
      archived: partials.archived || workspace?.archived || false,
    };

    if (workspace) {
      try {
        const res = await WorkspaceAPIClient.update(
          workspace.company_id,
          workspace.id,
          updatedObject,
        );

        if (res) {
          setWorkspaceName(res.name);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const onChangeWorkspaceLogo = (e: Event) =>
    UploadService.getFilesTree(e, (tree: File[]) => {
      const file = tree[Object.keys(tree)[0] as any];

      if (file) {
        setDisabledLogoSaveButton(false);
      }
    });

  useEffect(() => {
    uploadInputRef?.current && (uploadInputRef.current.onchange = onChangeWorkspaceLogo);

    return () => (uploadInputRef.current = undefined);
  }, []);

  return (
    <>
      <Title level={1}>{Languages.t('scenes.app.popup.workspaceparameter.pages.title')}</Title>
      <Suspense fallback={<></>}>
        <div>
          <Divider />

          <Descriptions layout="vertical" bordered>
            <Item
              label={Languages.t('scenes.app.popup.workspaceparameter.pages.name_label')}
              span={3}
            >
              <Row align="middle" justify="start" className="small-bottom-margin">
                <Text type="secondary">
                  {Languages.t('scenes.app.popup.workspaceparameter.pages.name_description')}
                </Text>
              </Row>
              <Row align="middle" justify="space-between">
                <Col flex="auto" className="small-right-margin">
                  <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
                </Col>

                <Col>
                  <Button
                    type="primary"
                    disabled={isEqual(workspaceName, workspace?.name)}
                    onClick={() => workspaceName && onClickUpdateWorkspace({ name: workspaceName })}
                  >
                    {Languages.t('general.save')}
                  </Button>
                </Col>
              </Row>
            </Item>

            <Item
              span={3}
              label={Languages.t('scenes.app.popup.workspaceparameter.pages.logo_subtitle')}
            >
              <Row align="middle" justify="start" className="small-bottom-margin">
                <Text type="secondary">
                  {Languages.t('scenes.app.popup.workspaceparameter.pages.logo_modify_description')}
                </Text>
              </Row>

              <Row align="middle" justify="space-between">
                <Col
                  className="workspace-logo-column"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  {workspace?.logo && workspace.logo.length > 0 ? (
                    <AvatarComponent size={64} url={workspace.logo} />
                  ) : (
                    <Avatar
                      size={64}
                      shape="square"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Title level={2} style={{ margin: 0 }} type="secondary">
                        {workspace?.name.split('')[0].toUpperCase()}
                      </Title>
                    </Avatar>
                  )}
                </Col>
                <Col
                  flex="auto"
                  className="small-left-margin"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Text type="secondary">
                    {Languages.t('scenes.app.popup.workspaceparameter.pages.weight_max_small_text')}
                  </Text>

                  {(workspace?.logo && workspace?.logo.length > 0) ||
                    (uploadInputRef?.current?.files && uploadInputRef.current.value && (
                      <Link
                        type="danger"
                        className="small-top-margin"
                        onClick={() => {
                          // If file is not uploaded but in the inputNode value
                          if (uploadInputRef.current?.value) {
                            uploadInputRef.current.value = '';
                          }

                          // TODO delete workspace logo with WorkspaceAPIClient.update()
                          if (workspace?.logo) {
                            console.log(workspace.logo);
                          }

                          setDisabledLogoSaveButton(true);
                        }}
                      >
                        {Languages.t('general.delete')}
                      </Link>
                    ))}
                </Col>

                <Col>
                  <Button
                    type="primary"
                    disabled={disabledLogoSaveButton}
                    onClick={() => {
                      // TODO upload new workspace logo with WorkspaceAPIClient.update()
                      console.log(uploadInputRef.current?.files);
                    }}
                  >
                    {Languages.t('general.save')}
                  </Button>
                </Col>
              </Row>
            </Item>

            <Item
              span={3}
              label={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.workspace_identity.default_workspace.label',
              )}
            >
              <Row wrap={false} align="middle" justify="space-between">
                <Col>
                  <Text type="secondary">
                    {Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.workspace_identity.default_workspace.description',
                    )}
                  </Text>
                </Col>
                <Col>
                  <Switch
                    defaultChecked={workspace?.default}
                    onChange={e => onClickUpdateWorkspace({ default: !workspace?.default })}
                  />
                </Col>
              </Row>
            </Item>
            <Item
              span={3}
              label={Languages.t('scenes.app.popup.workspaceparameter.pages.deleteworkspace')}
            >
              <Row wrap={false} align="middle" justify="space-between">
                <Col>
                  <Text type="secondary">
                    {Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.deleteworkspace_description',
                    )}
                  </Text>
                </Col>

                <Col>
                  <Button
                    type="default"
                    onClick={() =>
                      workspace &&
                      ModalManager.open(<DeleteWorkspacePopup />, {
                        position: 'center',
                        size: { width: '600px' },
                      })
                    }
                    style={{ color: 'var(--error)', border: '1px solid var(--error)' }}
                  >
                    {Languages.t('general.delete')}
                  </Button>
                </Col>
              </Row>
            </Item>
          </Descriptions>
        </div>
        <input
          ref={node => node && (uploadInputRef.current = node)}
          type="file"
          style={{ display: 'none' }}
        />
      </Suspense>
    </>
  );
};
