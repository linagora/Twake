/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { Button, Col, Divider, Layout, Row, Space, Typography } from 'antd';

import { MagicLinksJoinResponse, MagicLinksJoinService } from 'services/MagicLinks/MagicLinks';
import Languages from 'services/languages/languages';
import RouterService from 'services/RouterService';
import InitService from 'services/InitService';

import './styles.scss';

const { Title, Text } = Typography;

type PropsType = {
  [key: string]: any;
};

type JoinError = {
  title: string;
  description: string;
};

export default (props: PropsType): JSX.Element => {
  const [error, setError] = useState<JoinError>();
  const [info, setInfo] = useState<MagicLinksJoinResponse>();
  const [busy, setBusy] = useState<boolean>(false);
  const [cookies, setCookie] = useCookies(['pending-redirect']);

  const params = useParams() as any;
  let service = new MagicLinksJoinService(params.token, (val: boolean) => setBusy(val));

  useEffect(() => {
    service
      .getInfo()
      .then(info => {
        setInfo(info);
      })
      .catch(() =>
        setError({
          title: Languages.t('scenes.join.wrong_link_title'),
          description: Languages.t('scenes.join.wrong_link_description'),
        }),
      );
  }, []);

  const onJoinAccountBtnClick = () => {
    if (!info) return null;

    if (info.auth_required) {
      const origin = document.location.origin;
      const currentPage = document.location.href;
      const authUrl = `${InitService.server_infos?.configuration?.accounts?.console?.authority}/oauth2/authorize?invite=0&redirect_uri=${origin}`;
      setCookie('pending-redirect', currentPage, { path: '/', maxAge: 60 * 60 });
      setBusy(true);
      document.location.href = authUrl;
    } else {
      service
        .join()
        .then(resource => {
          setBusy(true);
          document.location.replace(
            RouterService.generateRouteFromState({
              workspaceId: resource.workspace.id,
              companyId: resource.company.id,
            }),
          );
        })
        .catch(err => {
          setError(err.message);
        });
    }
  };

  const onCreateCompanyBtnClick = () => {
    console.log('onCreateCompanyBtnClick');
  };

  return (
    <Layout className="joinPage">
      <Layout.Content>
        <Row justify="center" align="middle" style={{ height: '100%' }}>
          <Col>
            {!error && !info && <Text>{Languages.t('scenes.join.loading')}</Text>}

            {error && (
              <Space direction="vertical" align="center">
                <Title>
                  {error.title}{' '}
                  <span role="img" aria-label="">
                    ✋
                  </span>
                </Title>
                <Text>{error.description}</Text>
                <Divider />
                <Button
                  disabled={busy}
                  loading={busy}
                  type="primary"
                  onClick={onCreateCompanyBtnClick}
                >
                  {Languages.t('scenes.join.create_the_company_button')}
                </Button>
              </Space>
            )}

            {info && (
              <Space direction="vertical" align="center">
                <Title>
                  {Languages.t('scenes.join.join_workspace_from_company', [
                    info.company.name,
                    info.workspace.name,
                  ])}{' '}
                  <span role="img" aria-label="">
                    👋
                  </span>
                </Title>
                <Text>{Languages.t('scenes.join.twake_description')}</Text>
                <Divider />
                {info.auth_required ? (
                  <Button
                    disabled={busy}
                    loading={busy}
                    type="primary"
                    className="gray-btn"
                    onClick={onJoinAccountBtnClick}
                  >
                    {Languages.t('scenes.join.login_first_button')}
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    loading={busy}
                    type="primary"
                    onClick={onJoinAccountBtnClick}
                  >
                    {Languages.t('scenes.join.join_the_team_button')}
                  </Button>
                )}
              </Space>
            )}
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  );
};
