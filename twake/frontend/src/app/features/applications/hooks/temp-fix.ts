import { Application } from '../types/application';

export const replaceOnlyOfficeForCanary = (applications: Application[]) => {
  return applications.map(application => {
    if (
      application?.identity?.code === 'only_office' &&
      !application.display?.twake?.files?.editor?.preview_url?.includes('plugins.twake.app')
    ) {
      return {
        ...application,
        display: {
          twake: {
            version: 1,
            files: {
              editor: {
                preview_url: 'https://plugins.twake.app/plugins/onlyoffice/?preview=1',
                edition_url: 'https://plugins.twake.app/plugins/onlyoffice/',
                empty_files: [
                  {
                    url: 'https://plugins.twake.app/plugins/onlyoffice/assets/empty.docx',
                    filename: 'Untitled.docx',
                    name: 'ONLYOFFICE Word Document',
                  },
                  {
                    url: 'https://plugins.twake.app/plugins/onlyoffice/assets/empty.xlsx',
                    filename: 'Untitled.xlsx',
                    name: 'ONLYOFFICE Excel Document',
                  },
                  {
                    url: 'https://plugins.twake.app/plugins/onlyoffice/assets/empty.pptx',
                    filename: 'Untitled.pptx',
                    name: 'ONLYOFFICE PowerPoint Document',
                  },
                ],
                extensions: [
                  'xlsx',
                  'pptx',
                  'docx',
                  'xls',
                  'ppt',
                  'doc',
                  'odt',
                  'ods',
                  'odp',
                  'txt',
                  'html',
                  'csv',
                ],
              },
            },
          },
        },
      };
    }
    return application;
  });
};
