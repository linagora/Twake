import DriveService from 'app/deprecated/Apps/Drive/Drive.js';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';
import { Application } from 'app/features/applications/types/application';

type EditorType = {
  url?: string;
  is_url_file?: boolean;
  name?: string;
  app?: Application;
};

export const useEditors = (
  extension: string,
  options?: { preview_url?: string; editor_url?: string; editor_name?: string; url?: string },
) => {
  const { applications } = useCompanyApplications();
  const apps = applications.filter(
    app =>
      app.display?.twake?.files?.editor?.preview_url ||
      app.display?.twake?.files?.editor?.edition_url,
  );

  const preview_candidate: EditorType[] = [];
  const editor_candidate: EditorType[] = [];

  if (options?.preview_url) {
    preview_candidate.push({
      url: options?.preview_url,
    });
  }
  if (options?.editor_url) {
    editor_candidate.push({
      is_url_file: true,
      url: options?.editor_url,
      name: options?.editor_name || 'web link',
    });
  }

  //Primary exts
  apps.forEach(app => {
    if (
      (app.display?.twake?.files?.editor?.extensions || []).indexOf(
        ((extension || '') + (options?.url ? '.url' : '')).toLocaleLowerCase(),
      ) >= 0
    ) {
      if (app.display?.twake?.files?.editor?.edition_url) {
        editor_candidate.push({ app });
      }
      if (app.display?.twake?.files?.editor?.preview_url) {
        preview_candidate.push({
          url: app.display?.twake?.files?.editor?.preview_url,
          app: app,
        });
      }
    }
  });

  const openFile = (app: any) => {
    if (app.url && app.is_url_file) {
      window.open(app.url);
    }
    DriveService.getFileUrlForEdition(
      app.display?.twake?.files?.editor?.edition_url,
      app,
      '', //TODO: this.viewed_document.id,
      (url: string) => window.open(url),
    );
  };

  const getPreviewUrl = () => preview_candidate?.[0]?.url;

  return { candidates: editor_candidate, openFile, getPreviewUrl };
};
