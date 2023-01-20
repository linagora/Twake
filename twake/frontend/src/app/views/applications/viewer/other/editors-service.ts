/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';
import { Application } from 'app/features/applications/types/application';
import jwtStorageService from 'app/features/auth/jwt-storage-service';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';

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
  const { workspace } = useCurrentWorkspace();
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
      return;
    }
    const documentId = ''; //TODO

    window.open(getFileUrl(app.display?.twake?.files?.editor?.edition_url, documentId));
  };

  const getPreviewUrl = (documentId: string): string => {
    return getFileUrl(preview_candidate?.[0]?.url as string, documentId);
  };

  const getFileUrl = (url: string, file_id: string): string => {
    const jwt = jwtStorageService.getJWT();

    if (!url) return '';

    return `${url}${url.indexOf('?') > 0 ? '&' : '?'}token=${jwt}&workspace_id=${
      workspace?.id
    }&company_id=${workspace?.company_id}&file_id=${file_id}`;
  };

  return { candidates: editor_candidate, openFile, getPreviewUrl };
};
