import React, { ComponentProps } from 'react';

import { ReactComponent as DismissSvg } from './assets/dismiss.svg';
import { ReactComponent as NotFoundSvg } from './assets/not-found.svg';
import { ReactComponent as FileTypeArchiveSvg } from './assets/file-type-archive.svg';
import { ReactComponent as FileTypeDocumentSvg } from './assets/file-type-document.svg';
import { ReactComponent as FileTypePdfSvg } from './assets/file-type-pdf.svg';
import { ReactComponent as FileTypeSpreadsheetSvg } from './assets/file-type-spreadsheet.svg';
import { ReactComponent as FileTypeUnknownSvg } from './assets/file-type-unknown.svg';
import { ReactComponent as RemoveSvg } from './assets/remove.svg';
import { ReactComponent as SentSvg } from './assets/sent.svg';

export const DismissIcon = (props: ComponentProps<'svg'>) => <DismissSvg {...props} />;
export const NotFoundIcon = (props: ComponentProps<'svg'>) => <NotFoundSvg {...props} />;
export const FileTypeArchiveIcon = (props: ComponentProps<'svg'>) => (
  <FileTypeArchiveSvg {...props} />
);
export const FileTypePdfIcon = (props: ComponentProps<'svg'>) => <FileTypePdfSvg {...props} />;
export const FileTypeDocumentIcon = (props: ComponentProps<'svg'>) => (
  <FileTypeDocumentSvg {...props} />
);
export const FileTypeSpreadsheetIcon = (props: ComponentProps<'svg'>) => (
  <FileTypeSpreadsheetSvg {...props} />
);
export const FileTypeUnknownIcon = (props: ComponentProps<'svg'>) => (
  <FileTypeUnknownSvg {...props} />
);

export const RemoveIcon = (props: ComponentProps<'svg'>) => (
  <RemoveSvg {...props} />
);

export const SentIcon = (props: ComponentProps<'svg'>) => (
  <SentSvg {...props} />
);
