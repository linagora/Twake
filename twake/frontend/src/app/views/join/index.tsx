/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { Button, Col, Divider, Layout, Row, Space, Typography } from 'antd';

import {
  MagicLinksJoinResponse,
  MagicLinksJoinService,
} from 'app/features/workspaces/services/magic-links-service';
import Languages from 'app/features/global/services/languages-service';
import RouterService from 'app/features/router/services/router-service';
import InitService from 'app/features/global/services/init-service';
import LockedInviteAlert from 'app/components/locked-features-components/locked-invite-alert';
import FeatureTogglesService, {
  FeatureNames,
} from 'app/features/global/services/feature-toggles-service';

import './styles.scss';
import LocalStorage from 'app/features/global/framework/local-storage-service';

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

      //Save requested URL for after redirect / sign-in
      //Fixme this is code duplication from auth service
      LocalStorage.setItem('requested_url', {
        url: document.location.href,
        time: new Date().getTime(),
      });

      const authUrl = `${
        InitService.server_infos?.configuration?.accounts?.console?.authority
      }/oauth2/authorize?invite=1&redirect_uri=${encodeURIComponent(origin)}`;
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
    if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
      return document.location.replace(
        InitService.server_infos?.configuration?.accounts?.console?.account_management_url || '',
      );
    } else {
      document.location.replace('/');
    }
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

                {info?.company &&
                !FeatureTogglesService.isActiveFeatureName(FeatureNames.COMPANY_INVITE_MEMBER) ? (
                  <div style={{ maxWidth: 400 }}>
                    <LockedInviteAlert company={info?.company} magicLink />
                  </div>
                ) : (
                  <></>
                )}
                <Divider />
                {info.auth_required ? (
                  <Button
                    disabled={
                      busy ||
                      !FeatureTogglesService.isActiveFeatureName(FeatureNames.COMPANY_INVITE_MEMBER)
                    }
                    loading={busy}
                    type="primary"
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
