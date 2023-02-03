import { FileTreeObject } from 'app/components/uploads/file-tree-utils';
import FileUploadService from 'app/features/files/services/file-upload-service';
import { DriveApiClient } from '../api-client/api-client';
import { useDriveActions } from './use-drive-actions';

/**
 * Returns the children of a drive item
 * @param id
 * @returns
 */
export const useDriveUpload = () => {
  const { create } = useDriveActions();

  const uploadVersion = async (file: File, context: { companyId: string; id: string }) => {
    return new Promise(r => {
      FileUploadService.upload([file], {
        context: {
          companyId: context.companyId,
          id: context.id,
        },
        callback: async (file, context) => {
          if (file) {
            const version = {
              drive_item_id: context.id,
              provider: 'internal',
              application_id: '',
              file_metadata: {
                name: file.metadata?.name,
                size: file.upload_data?.size,
                mime: file.metadata?.mime,
                thumbnails: file?.thumbnails,
                source: 'internal',
                external_id: file.id,
              },
            };
            await DriveApiClient.createVersion(context.companyId, context.id, version);
          }
          r(true);
        },
      });
    });
  };

  const uploadTree = async (
    tree: FileTreeObject,
    context: { companyId: string; parentId: string },
  ) => {
    const filesPerParentId: { [key: string]: File[] } = {};

    // Create all directories
    const createDirectories = async (tree: FileTreeObject['tree'], parentId: string) => {
      for (const directory of Object.keys(tree)) {
        if (tree[directory] instanceof File) {
          if (!filesPerParentId[parentId]) filesPerParentId[parentId] = [];
          filesPerParentId[parentId].push(tree[directory] as File);
        } else {
          const driveItem = await create(
            {
              company_id: context.companyId,
              parent_id: parentId,
              name: directory,
              is_directory: true,
            },
            {},
          );
          if (driveItem?.id) {
            await createDirectories(tree[directory] as FileTreeObject['tree'], driveItem.id);
          } else {
            throw new Error('Could not create directory');
          }
        }
      }
    };
    await createDirectories(tree.tree, context.parentId);

    // Upload files into directories
    for (const parentId of Object.keys(filesPerParentId)) {
      FileUploadService.upload(filesPerParentId[parentId], {
        context: {
          companyId: context.companyId,
          parentId: parentId,
        },
        callback: (file, context) => {
          console.log('created file: ', file);
          if (file) {
            create(
              {
                company_id: context.companyId,
                workspace_id: 'someid',
                parent_id: context.parentId,
                name: file.metadata?.name,
                size: file.upload_data?.size,
              },
              {
                provider: 'internal',
                application_id: '',
                file_metadata: {
                  name: file.metadata?.name,
                  size: file.upload_data?.size,
                  mime: file.metadata?.mime,
                  thumbnails: file?.thumbnails,
                  source: 'internal',
                  external_id: file.id,
                },
              },
            );
          }
        },
      });
    }
  };

  return { uploadTree, uploadVersion };
};
