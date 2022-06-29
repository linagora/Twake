import React, { ComponentProps } from 'react';

import { ReactComponent as CopySvg } from './assets/copy.svg';
import { ReactComponent as DeleteSvg } from './assets/delete.svg';
import { ReactComponent as DownloadSvg } from './assets/download.svg';
import { ReactComponent as InputClearSvg } from './assets/input-clear.svg';
import { ReactComponent as ShareSvg } from './assets/share.svg';
import { ReactComponent as EyeSvg } from './assets/eye.svg';
import { ReactComponent as UserAddSvg } from './assets/user-add.svg';
import { ReactComponent as CheckSvg } from './assets/check.svg';

export const CopyIcon = (props: ComponentProps<'svg'>) => <CopySvg {...props} />;
export const DeleteIcon = (props: ComponentProps<'svg'>) => <DeleteSvg {...props} />;
export const DownloadIcon = (props: ComponentProps<'svg'>) => <DownloadSvg {...props} />;
export const EyeIcon = (props: ComponentProps<'svg'>) => <EyeSvg {...props} />;
export const InputClearIcon = (props: ComponentProps<'svg'>) => <InputClearSvg {...props} />;
export const ShareIcon = (props: ComponentProps<'svg'>) => <ShareSvg {...props} />;
export const UserAddIcon = (props: ComponentProps<'svg'>) => <UserAddSvg {...props} />;
export const CheckIcon = (props: ComponentProps<'svg'>) => <CheckSvg {...props} />;
