import { Col, Row } from 'antd';
import { Search } from 'react-feather';
import RouterServices from 'app/features/router/services/router-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import Languages from 'app/features/global/services/languages-service';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { Button } from '@atoms/button/button';
import { SearchIcon } from '@heroicons/react/solid';
import { Input } from '@atoms/input/input-text';
import { InputDecorationIcon } from 'app/atoms/input/input-decoration-icon';
import { useRecoilValue } from 'recoil';
import { SearchInputState } from 'app/features/search/state/search-input';

export default (): JSX.Element => {
  const { workspaceId, companyId } = RouterServices.getStateFromRoute();
  const { setOpen } = useSearchModal();
  const searchState = useRecoilValue(SearchInputState);

  const disable = !(
    AccessRightsService.hasLevel(workspaceId, 'member') &&
    AccessRightsService.getCompanyLevel(companyId) !== 'guest'
  );

  return (
    <>
      <Col xs={0} sm={0} md={0} lg={6} xl={5} xxl={4}>
        <Row justify="center">
          <Col flex="none" style={{ width: 200 }}>
            <div style={{ height: 40 }}>
              {!disable && (
                <InputDecorationIcon
                  prefix={SearchIcon}
                  input={({ className }) => (
                    <Input
                      value={searchState.query}
                      className={className + ' text-zinc-500'}
                      maxLength={0}
                      readOnly
                      placeholder={Languages.t('scenes.client.main_view.main_header.search_input')}
                      onClick={() => setOpen(true)}
                    />
                  )}
                />
              )}
            </div>
          </Col>
        </Row>
      </Col>

      <Col xs={1} sm={1} md={1} lg={0} xl={0} xxl={0}>
        <div style={{ height: 40 }}>
          {!disable && (
            <Button
              theme="outline"
              size="sm"
              className="rounded-full"
              icon={SearchIcon}
              onClick={() => setOpen(true)}
            />
          )}
        </div>
      </Col>
    </>
  );
};
