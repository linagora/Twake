/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { MagicLinksJoinService, MagicLinksJoinResponse } from 'services/MagicLinks/MagicLinks';
import './Join.scss';
import { Layout, Row, Col, Space, Typography, Button, Divider, message } from 'antd';
import { useParams } from 'react-router-dom';
import WorkspaceAPIClient from 'services/workspaces/WorkspaceAPIClient';
import WorkspacesService from 'services/workspaces/workspaces';
import Languages from 'services/languages/languages';

const { Title, Text } = Typography;


type PropsType = {
  [key: string]: any;
};

type JoinError = {
  title: string,
  description: string
}

export default (props: PropsType): JSX.Element => {

  const [error, setError] = useState<JoinError>();
  const [info, setInfo] = useState<MagicLinksJoinResponse>();
  const [busy, setBusy] = useState<boolean>(false);

  const params = useParams() as any;
  let service = new MagicLinksJoinService(params.token, (val: boolean) => setBusy(val));

  useEffect(() => {
    service.getInfo().then(info => setInfo(info)).catch(() => setError({title: Languages.t("scenes.join.wrong_link_title"), description: Languages.t("scenes.join.wrong_link_description")}));
  }, []);


  const onJoinAccountBtnClick = () => {
    if (!info) return null;

    if (info.auth_url) {
      setBusy(true);
      document.location.href = info.auth_url;
    } else {
      service.join().then(resource => {
        setBusy(true);
        WorkspaceAPIClient.get(resource.company.id, resource.workspace.id)
          .then(workspace => {
            WorkspacesService.addToUser(workspace); 
            WorkspacesService.select(workspace);
          });

      }).catch(err => { setError(err.message); });
    }
  };

  const onCreateCompanyBtnClick = () => {
    console.log('onCreateCompanyBtnClick');
  };

  return <Layout className="joinPage">
    <Layout.Content>
      <Row justify="center" align="middle" style={{ height: '100%' }}>
        <Col>
          {(!error && !info) && <Text>{Languages.t("scenes.join.loading")}</Text>}

          {error && <Space direction="vertical" align="center">
            <Title>{error.title} <span role="img" aria-label="">✋</span></Title>
            <Text>{error.description}</Text>
            <Divider />
            <Button disabled={busy} loading={busy} type="primary" onClick={onCreateCompanyBtnClick}
            >{Languages.t("scenes.join.create_the_company_button")}</Button>
          </Space>}

          {info && <Space direction="vertical" align="center">
            <Title>{Languages.t("scenes.join.join_workspace_from_company", [info.company.name, info.workspace.name])} <span role="img" aria-label="">👋</span></Title>
            <Text>{Languages.t("scenes.join.twake_description")}</Text>
            <Divider />
            {info.auth_url
              ? <Button disabled={busy} loading={busy} type="primary" className="gray-btn" onClick={onJoinAccountBtnClick}>{Languages.t("scenes.join.login_first_button")}</Button>
              : <Button disabled={busy} loading={busy} type="primary" onClick={onJoinAccountBtnClick}>{Languages.t("scenes.join.join_the_team_button")}</Button>
            }

          </Space>}
        </Col>
      </Row>
    </Layout.Content>
  </Layout>;
};