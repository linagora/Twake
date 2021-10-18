import React, { useEffect, useState } from "react";
import { Col, Divider, Progress, Row, Typography } from "antd";
import "./CompanyMessagesCounter.scss";

import Languages from "services/languages/languages";
import { useRecoilState } from "recoil";
import { CurrentCompanyState } from "app/state/recoil/atoms/CurrentCompany";
import UserAPIClient from "services/user/UserAPIClient";
import MessageHistoryService from "services/Apps/Messages/MessageHistoryService";
import InitService from "services/InitService";


const { Text, Title, Link } = Typography;
const CompanyMessagesCounter = () => {
  const [company] = useRecoilState(CurrentCompanyState);
  const [messagesCount, setMessagesCount] = useState<number>();
  const companyMessagesLimit = MessageHistoryService.getLimitCompanyMessages();

  const companySubscriptionUrl =
    InitService.server_infos?.configuration.accounts.console?.company_subscription_url || '';

  const onClickLink = () => window.open(companySubscriptionUrl, 'blank');

  const formatPrice = (n:number)=>n.toString().split("").reverse().map((n,s)=>~s%3?n:' '+n).reverse().join("").trim();

  useEffect(() => {
    if (companyMessagesLimit && company) {
      UserAPIClient.getCompany(company.id).then(res => setMessagesCount(res.stats?.total_messages || 0));
    }
  }, [company, companyMessagesLimit]);

  return companyMessagesLimit && messagesCount!==undefined ? (
    <>
      <Row
        justify="space-around"
        align="middle"
        wrap={false}
        style={{
          padding: "0px 0px",
          width: "100%"
        }}
      >
        <Col className="small-left-margin companyMessagesCounter" flex={2} style={{ lineHeight: "16px" }}>
          <Title className="title">
            {Languages.t("scenes.app.channelsbar.currentuser.company_messages_counter_header",
              [],
              "Messages number")}
          </Title>
          <Text className="info">
            {Languages.t("scenes.app.channelsbar.currentuser.company_messages_counter_info",
              [formatPrice(companyMessagesLimit)],
              "On the free version of Twake, you cannot access more than the {{$1}} more recent messages")}&nbsp;
          </Text>
          <div className="link">
          <Link onClick={onClickLink}>
            {Languages.t("scenes.app.channelsbar.currentuser.company_messages_counter_link",
              [],
              "Show more plans")}
          </Link>
          </div>
        </Col>
        <Col>
          <Progress
            type="circle"
            format={(percent) => (messagesCount / 1000).toFixed(1) + "k"}
            percent={messagesCount / companyMessagesLimit * 100}
            width={55}
          />
        </Col>
      </Row>
      <Divider />
    </>
  ) : <></>;
};
export default CompanyMessagesCounter;
