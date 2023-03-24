import { Button } from 'app/atoms/button/button';
import LockedOnlyOfficePopup from 'app/components/locked-features-components/locked-only-office-popup/locked-only-office-popup';
import MenuManager from 'components/menus/menus-manager';
import ModalManager from 'app/components/modal/modal-manager';
import Languages from 'app/features/global/services/languages-service';
import FeatureTogglesService, {
  FeatureNames,
} from 'app/features/global/services/feature-toggles-service';
import { useEditors } from './editors-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';

export default (props: { name: string }) => {
  const extension = props.name.split('.').pop();
  const { candidates, openFile } = useEditors(extension || '');

  const companyId = useRouterCompany();
  const previewOnly = AccessRightsService.getCompanyLevel(companyId) !== 'guest';

  if (previewOnly) {
    return <></>;
  }

  return (
    <>
      {candidates.length === 1 && (
        <Button
          className="ml-4"
          theme="dark"
          onClick={() => {
            if (FeatureTogglesService.isActiveFeatureName(FeatureNames.EDIT_FILES)) {
              openFile(candidates[0]);
            } else {
              ModalManager.open(
                <LockedOnlyOfficePopup />,
                {
                  position: 'center',
                  size: { width: '600px' },
                },
                false,
              );
            }
          }}
        >
          {Languages.t('scenes.apps.drive.viewer.edit_with_button', [candidates[0].name])}
        </Button>
      )}
      {candidates.length > 1 && (
        <Button
          className="ml-4"
          theme="dark"
          onClick={e => {
            e.stopPropagation();
            MenuManager.openMenu(
              candidates.map((editor: { [key: string]: any }) => {
                return {
                  type: 'menu',
                  text: editor?.app?.identity?.name || editor?.app?.name || editor.name,
                  onClick: () => {
                    openFile(editor);
                  },
                };
              }),
              (window as any).getBoundingClientRect(e.target),
              'top',
              { margin: 0 },
            );
          }}
        >
          {Languages.t('scenes.apps.drive.viewer.open_with_button')}
        </Button>
      )}
    </>
  );
};
