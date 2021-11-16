/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { MagicLinksJoinService, MagicLinksJoinResponse } from 'services/MagicLinks/MagicLinks';
import './Join.scss';
import { Layout, Row, Col, Space, Typography, Button, Divider } from 'antd';
import { useParams } from 'react-router-dom';
import RouterService from 'app/services/RouterService';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspaceAPIClient from 'services/workspaces/WorkspaceAPIClient';
import WorkspacesService from 'services/workspaces/workspaces';

const { Title, Text } = Typography;


type PropsType = {
  [key: string]: any;
};

export default (props: PropsType): JSX.Element => {

  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<MagicLinksJoinResponse>();
  const [busy, setBusy] = useState<boolean>(false);

  const params = useParams() as any;
  let service = new MagicLinksJoinService(params.token, (val: boolean) => setBusy(val));

  useEffect(() => {
    service.getInfo().then(info => setInfo(info)).catch(() => setError("This link is not available anymore"));
  }, []);


  const onJoinAccountBtnClick = () => {
    if (!info) return null;

    if (info.auth_url) {
      setBusy(true);
      document.location.href = info.auth_url;
    } else {
      service.join().then(resource => {
        console.log("going to somewhere");
        setBusy(true);
        WorkspaceAPIClient.get(resource.company.id, resource.workspace.id)
          .then(workspace => {
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
          {(!error && !info) && <Text>Loading data</Text>}

          {error && <Space direction="vertical" align="center">
            <Title>{error} <span role="img" aria-label="">✋</span></Title>
            <Text>Ask the person who invited you to join this company for a new link or create your own company</Text>
            <Divider />
            <Button disabled={busy} loading={busy} type="primary" onClick={onCreateCompanyBtnClick}
            >Create the company</Button>
          </Space>}

          {info && <Space direction="vertical" align="center">
            <Title>Linagora</Title>
            <Title>Join {info.workspace.name} from {info.company.name}! <span role="img" aria-label="">👋</span></Title>
            <Text>Twake is an open-source digital workspace built to improve your team productivity</Text>
            <Divider />
            { !info.auth_url ?  
             <Button disabled={busy} loading={busy} type="primary" onClick={onJoinAccountBtnClick}>Join the team</Button>
            :<Button disabled={busy} loading={busy} type="primary" className="gray-btn" onClick={onJoinAccountBtnClick}>Log in or create an account first</Button>
            }
            
          </Space>}
        </Col>
      </Row>
    </Layout.Content>
  </Layout>;
};