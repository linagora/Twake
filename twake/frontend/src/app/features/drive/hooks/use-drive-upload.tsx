import { FileTreeObject } from 'app/components/uploads/file-tree-utils';
import { useUploadZones } from 'app/features/files/hooks/use-upload-zones';
import FileUploadService from 'app/features/files/services/file-upload-service';
import { FileType } from 'app/features/files/types/file';
import { DriveApiClient } from '../api-client/api-client';
import { useDriveChildren } from './use-drive-children';

/**
 * Returns the children of a drive item
 * @param id
 * @returns
 */
export const useDriveUpload = () => {
  const { create } = useDriveChildren();

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
              },
              {
                file_id: file.id,
                provider: 'internal',
                application_id: '',
                file_metadata: {
                  name: file.metadata?.name,
                  size: file.metadata?.size,
                  mime: file.metadata?.mime,
                  thumbnails: file.metadata?.thumbnails,
                  source: 'internal',
                  external_id: { id: file.id, company_id: file.company_id },
                },
              },
            );
          }
        },
      });
    }
  };

  return { uploadTree };
};
