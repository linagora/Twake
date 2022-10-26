import { Button } from 'app/atoms/button/button';
import React, { useState } from 'react';
import { CopyIcon } from '@atoms/icons-agnostic';
import { Link } from 'react-feather';
import { Base } from 'app/atoms/text';
import { useInvitation } from 'app/features/invitation/hooks/use-invitation';
import Languages from 'app/features/global/services/languages-service';

export default (): React.ReactElement => {
  const { generateInvitationLink } = useInvitation();
  const [loading, setLoading] = useState<boolean>(false);

  const copyLink = async () => {
    setLoading(true);
    const link = await generateInvitationLink();

    if (link) {
      navigator.clipboard.writeText(link);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-row mt-4 space-x-2 bg-zinc-200 py-1 mx-2 px-3  rounded-md border-transparent w-full">
      <div className="my-2">
        <Link color="gray" size={16} />
      </div>
      <div className="my-1">
        <Base>
          {Languages.t(
            'components.invitation.workspace_link.text',
            [],
            'Workspace invitation link',
          )}
        </Base>
      </div>
      <div className="flex-grow">
        <Button
          className="h-7 mx-2 float-right border-transparent bg-transparent hover:bg-transparent"
          theme="secondary"
          icon={CopyIcon}
          onClick={() => copyLink()}
          loading={loading}
          disabled={loading}
        >
          {Languages.t('components.invitation.workspace_link.copy', [], 'Copy')}
        </Button>
      </div>
    </div>
  );
};
