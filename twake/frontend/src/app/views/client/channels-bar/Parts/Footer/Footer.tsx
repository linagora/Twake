import { useEffect } from 'react';

import './Footer.scss';

import A from 'app/atoms/link';
import Icon from 'app/components/icon/icon.js';
import Version from 'app/environment/version';
import InitService from 'app/features/global/services/init-service';
import Languages from 'app/features/global/services/languages-service';
import Menu from 'components/menus/menu.js';

export default (props: { onClickHelp: Function; onClickDocumentation: Function }) => {
  const onpremise = !!InitService.server_infos?.branding?.name;

  const menu = [
    { type: 'text', text: `Twake v${Version.version_detail}` },
    {
      type: 'menu',
      text: Languages.t('general.help.support', [], 'Support'),
      icon: 'comment',
      onClick: props.onClickHelp,
    },
    {
      type: 'menu',
      text: Languages.t('general.help.documentation', [], 'Documentation'),
      icon: 'book',
      onClick: props.onClickDocumentation,
    },
  ];

  useEffect(() => {
    try {
      if (!onpremise) {
        const config = {
          selector: '#changelog_text',
          account: '7L9kKJ',
          translations: {
            title: 'Twake Changelog',
            readMore: 'Read more',
            footer: 'View more changes',
          },
        };
        if (typeof (window as any)?.Headway != 'undefined') {
          (window as any).Headway.init(config);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div className="channel_footer -mx-3 -mb-3">
      <div className="line_2">
        {props.onClickHelp && (
          <Menu menu={menu} className="options" position="top">
            <A className="help">
              <Icon type="question-circle" />
              {Languages.t('general.help', [], 'Help')}
            </A>
          </Menu>
        )}
        <div className="grow" />
        {!onpremise && (
          <A
            className="help"
            style={{ textAlign: 'right', flex: 1, position: 'relative' }}
            id="changelog_text"
          >
            Changelog
          </A>
        )}
        {onpremise && (
          <div className={'plan'}>{InitService.server_infos?.branding?.name} Server</div>
        )}
      </div>
    </div>
  );
};
