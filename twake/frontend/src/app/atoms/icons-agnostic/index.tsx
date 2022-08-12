import React, { ComponentProps } from 'react';

import { ReactComponent as CopySvg } from './assets/copy.svg';
import { ReactComponent as DeleteSvg } from './assets/delete.svg';
import { ReactComponent as DownloadSvg } from './assets/download.svg';
import { ReactComponent as UploadSvg } from './assets/upload.svg';
import { ReactComponent as InputClearSvg } from './assets/input-clear.svg';
import { ReactComponent as ShareSvg } from './assets/share.svg';
import { ReactComponent as EyeSvg } from './assets/eye.svg';
import { ReactComponent as UserAddSvg } from './assets/user-add.svg';
import { ReactComponent as CheckSvg } from './assets/check.svg';
import { ReactComponent as ZommInSvg } from './assets/zoom-in.svg';
import { ReactComponent as ZoomOutSvg } from './assets/zoom-out.svg';
import { ReactComponent as VerticalDotsSvg } from './assets/vertical-dots.svg';
import { ReactComponent as RotateCwSvg } from './assets/rotate-cw.svg';

export const CopyIcon = (props: ComponentProps<'svg'>) => <CopySvg {...props} />;
export const DeleteIcon = (props: ComponentProps<'svg'>) => <DeleteSvg {...props} />;
export const DownloadIcon = (props: ComponentProps<'svg'>) => <DownloadSvg {...props} />;
export const EyeIcon = (props: ComponentProps<'svg'>) => <EyeSvg {...props} />;
export const InputClearIcon = (props: ComponentProps<'svg'>) => <InputClearSvg {...props} />;
export const ShareIcon = (props: ComponentProps<'svg'>) => <ShareSvg {...props} />;
export const UserAddIcon = (props: ComponentProps<'svg'>) => <UserAddSvg {...props} />;
export const CheckIcon = (props: ComponentProps<'svg'>) => <CheckSvg {...props} />;
export const ZoomInIcon = (props: ComponentProps<'svg'>) => <ZommInSvg {...props} />;
export const ZoomOutIcon = (props: ComponentProps<'svg'>) => <ZoomOutSvg {...props} />;
export const VerticalDotsIcon = (props: ComponentProps<'svg'>) => <VerticalDotsSvg {...props} />;
export const RotateCwIcon = (props: ComponentProps<'svg'>) => <RotateCwSvg {...props} />;
export const UploadCwIcon = (props: ComponentProps<'svg'>) => <UploadSvg {...props} />;
