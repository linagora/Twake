import { Button, Col, Row, Typography } from 'antd';
import React, { useState } from 'react';
import AutoHeight from '../../AutoHeight/AutoHeight';
import ObjectModal from '../../ObjectModal/ObjectModal';
import Languages from 'services/languages/languages.js';
import ModalManager from 'app/components/Modal/ModalManager';
import ConsoleService from 'app/services/ConsoleService';
import RouterServices from 'services/RouterService';

type PropsType = {};

const AddMailsInWorkspace = ({}: PropsType) => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();
  const [emails, setEmails] = useState<string[]>([]);
  const [fullString, setFullString] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const stringToArray = (str: string) => {
    let regex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gm;
    let mailToArray: string[] = [];
    const stringToArray = str.match(regex);

    (stringToArray || []).map((item: any) => mailToArray.push(item.toLocaleLowerCase()));

    const array = mailToArray.filter((elem, index, self) => index === self.indexOf(elem));

    setEmails(array);
  };

  const onClickButton = async () => {
    setLoading(true);

    return await ConsoleService.addMailsInWorkspace({
      workspace_id: workspaceId || "",
      company_id: companyId || "",
      emails,
    }).finally(() => {
      setLoading(false);
      return ModalManager.close();
    });
  };

  return (
    <ObjectModal
      title={Languages.t('components.add_mails_workspace.title_1')}
      closable
      style={{ height: 600 }}
      titleLevel={2}
      titleCenter
      hideFooterDivider
      footerAlign="center"
      footer={
        <Row className="x-margin" justify="center">
          <Button onClick={onClickButton} type="primary" size="large" loading={loading}>
            {Languages.t('components.add_mails_workspace.button')}
          </Button>
        </Row>
      }
    >
      <Row
        className="x-margin"
        style={{ padding: '0 16px', marginTop: 16, marginBottom: 62 }}
        justify="center"
      >
        <Typography.Text
          style={{ textAlign: 'center', width: '464px', fontSize: 17, height: '44px' }}
        >
          {Languages.t('components.add_mails_workspace.title_2')}
        </Typography.Text>
      </Row>

      <Row className="x-margin" style={{ marginBottom: 12, paddingTop: 32 }} justify="center">
        <Col style={{ width: 400 }}>
          <AutoHeight
            minHeight="110px"
            maxHeight="300px"
            value={fullString}
            onChange={(e: { target: { value: string } }) => {
              setFullString(e.target.value);
              stringToArray(e.target.value);
            }}
            placeholder={Languages.t('components.add_mails_workspace.text_area_placeholder')}
          />
        </Col>
      </Row>

      <Row className="x-margin" style={{ display: 'flex', justifyContent: 'center' }}>
        <Typography.Text type="secondary" style={{ width: 380, fontSize: 13, height: 32 }}>
          {Languages.t('components.add_mails_workspace.text_secondary')}
        </Typography.Text>
      </Row>
    </ObjectModal>
  );
};

export default AddMailsInWorkspace;
