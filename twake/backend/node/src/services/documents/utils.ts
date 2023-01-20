import { merge } from "lodash";
import { AccessInformation, DriveFile } from "./entities/drive-file";
import {
  CompanyExecutionContext,
  DriveFileAccessLevel,
  publicAccessLevel,
  RootType,
  TrashType,
} from "./types";
import crypto from "crypto";
import { FileVersion } from "./entities/file-version";
import globalResolver from "../global-resolver";
import Repository from "../../core/platform/services/database/services/orm/repository/repository";
import archiver from "archiver";
import { Readable } from "stream";
import { stopWords } from "./const";
import unoconv from "unoconv-promise";
import {
  writeToTemporaryFile,
  cleanFiles,
  getTmpFile,
  readFromTemporaryFile,
  readableToBuffer,
} from "../../utils/files";
import PdfParse from "pdf-parse";

/**
 * Returns the default DriveFile object using existing data
 *
 * @param {Partial<DriveFile>} item - the partial drive file item.
 * @param {CompanyExecutionContext} context - the company execution context
 * @returns {DriveFile} - the Default DriveFile
 */
export const getDefaultDriveItem = (
  item: Partial<DriveFile>,
  context: CompanyExecutionContext,
): DriveFile => {
  const defaultDriveItem = merge<DriveFile, Partial<DriveFile>>(new DriveFile(), {
    company_id: context.company.id,
    added: item.added || new Date().getTime().toString(),
    creator: item.creator || context.user.id,
    is_directory: item.is_directory || false,
    is_in_trash: false,
    last_user: item.last_user || context.user.id,
    last_modified: new Date().getTime().toString(),
    parent_id: item.parent_id || "root",
    root_group_folder: item.root_group_folder || "",
    attachements: item.attachements || [],
    content_keywords: item.content_keywords || "",
    description: item.description || "",
    access_info: item.access_info || {
      entities: [
        {
          id: "parent",
          type: "folder",
          level: "manage",
        },
        //Folders created in root give access by default to the whole company
        ...((item.parent_id === "root"
          ? [
              {
                id: item.company_id,
                type: "company",
                level: "manage",
              },
            ]
          : []) as AccessInformation["entities"]),
        {
          id: context.user.id,
          type: "user",
          level: "manage",
        },
      ],
      public: {
        level: "none",
        token: generateAccessToken(),
      },
    },
    detached_file: item.detached_file || false,
    extension: item.extension || "",
    external_storage: item.external_storage || false,
    has_preview: item.has_preview || false,
    hidden_data: item.hidden_data || {},
    last_version_cache: item.last_version_cache,
    object_link_cache: item.object_link_cache || "",
    name: item.name || "",
    preview_link: item.preview_link || "",
    shared: item.shared || false,
    size: item.size || 0,
    tags: item.tags || [],
    url: item.url || "",
  });

  if (item.id) {
    defaultDriveItem.id = item.id;
  }

  return defaultDriveItem;
};

/**
 * Returns the default FileVersion item.
 *
 * @param {Partial<FileVersion>} version - the partial version item
 * @param {CompanyExecutionContext} context - the execution context
 * @returns
 */
export const getDefaultDriveItemVersion = (
  version: Partial<FileVersion>,
  context: CompanyExecutionContext,
): FileVersion => {
  const defaultVersion = merge(new FileVersion(), {
    application_id: version.application_id || "",
    creator_id: version.creator_id || context.user.id,
    data: version.data || {},
    date_added: version.date_added || new Date().getTime(),
    file_id: version.file_id || "",
    file_metadata: version.file_metadata,
    file_size: version.file_size || 0,
    filename: version.filename || "",
    key: version.key || "",
    mode: version.mode || "OpenSSL-2",
    provider: version.provider,
    realname: version.realname,
  });

  if (version.id) {
    defaultVersion.id = version.id;
  }

  return defaultVersion;
};

/**
 * Generates a random sha1 access token
 *
 * @returns {String} - the random access token ( sha1 hex digest ).
 */
const generateAccessToken = (): string => {
  const randomBytes = crypto.randomBytes(64);

  return crypto.createHash("sha1").update(randomBytes).digest("hex");
};

/**
 * Checks if the level meets the required level.
 *
 * @param {publicAccessLevel | DriveFileAccessLevel} requiredLevel
 * @param {publicAccessLevel} level
 * @returns {boolean}
 */
export const hasAccessLevel = (
  requiredLevel: publicAccessLevel | DriveFileAccessLevel,
  level: DriveFileAccessLevel,
): boolean => {
  if (requiredLevel === level) return true;

  if (requiredLevel === "write") {
    return level === "manage";
  }

  if (requiredLevel === "read") {
    return level === "manage" || level === "write";
  }

  if (requiredLevel === "none") {
    return level === "manage" || level === "write" || level === "read";
  }

  return false;
};

/**
 * checks the current user is a guest
 *
 * @param {CompanyExecutionContext} context
 * @returns {Promise<boolean>}
 */
export const isCompanyGuest = async (context: CompanyExecutionContext): Promise<boolean> => {
  const userRole = await globalResolver.services.companies.getUserRole(
    context.company.id,
    context.user.id,
  );

  return userRole === "guest";
};

/**
 * Calculates the size of the Drive Item
 *
 * @param {DriveFile} item - The file or directory
 * @param {Repository<DriveFile>} repository - the database repository
 * @param {CompanyExecutionContext} context - the execution context
 * @returns {Promise<number>} - the size of the Drive Item
 */
export const calculateItemSize = async (
  item: DriveFile | TrashType | RootType,
  repository: Repository<DriveFile>,
  context: CompanyExecutionContext,
): Promise<number> => {
  if (item === "trash") {
    let trashSize = 0;
    const trashedItems = await repository.find(
      { company_id: context.company.id, parent_id: "trash" },
      {},
      context,
    );

    trashedItems.getEntities().forEach(child => {
      trashSize += child.size;
    });

    return trashSize;
  }

  if (item === "root" || !item) {
    let rootSize = 0;
    const rootFolderItems = await repository.find(
      { company_id: context.company.id, parent_id: "root" },
      {},
      context,
    );

    await Promise.all(
      rootFolderItems.getEntities().map(async child => {
        rootSize += await calculateItemSize(child, repository, context);
      }),
    );

    return rootSize;
  }

  if (item.is_directory) {
    let initialSize = 0;
    const children = await repository.find(
      {
        company_id: context.company.id,
        parent_id: item.id,
      },
      {},
      context,
    );

    Promise.all(
      children.getEntities().map(async child => {
        initialSize += await calculateItemSize(child, repository, context);
      }),
    );

    return initialSize;
  }

  return item.size;
};

/**
 * Recalculates and updates the Drive item size
 *
 * @param {string} id - the item id
 * @param {Repository<DriveFile>} repository
 * @param {CompanyExecutionContext} context - the execution context
 * @returns {Promise<void>}
 */
export const updateItemSize = async (
  id: string,
  repository: Repository<DriveFile>,
  context: CompanyExecutionContext,
): Promise<void> => {
  if (!id || id === "root" || id === "trash") return;

  const item = await repository.findOne({ id, company_id: context.company.id });

  if (!item) {
    throw Error("Drive item doesn't exist");
  }

  item.size = await calculateItemSize(item, repository, context);

  return await repository.save(item);
};

/**
 * gets the path for the driveitem
 *
 * @param {string} id
 * @param {Repository<DriveFile>} repository
 * @param {boolean} ignoreAccess
 * @param {CompanyExecutionContext} context
 * @returns
 */
export const getPath = async (
  id: string,
  repository: Repository<DriveFile>,
  ignoreAccess?: boolean,
  context?: CompanyExecutionContext,
): Promise<DriveFile[]> => {
  id = id || "root";
  if (id === "root" || id === "trash") return [];

  const item = await repository.findOne({
    id,
    company_id: context.company.id,
  });

  if (!item || (!checkAccess(id, item, "read", repository, context) && !ignoreAccess)) {
    return [];
  }

  return [...(await getPath(item.parent_id, repository, ignoreAccess, context)), item];
};

/**
 * checks if access can be granted for the drive item
 *
 * @param {string} id
 * @param {DriveFile | null} item
 * @param {DriveFileAccessLevel} level
 * @param {Repository<DriveFile>} repository
 * @param {CompanyExecutionContext} context
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const checkAccess = async (
  id: string,
  item: DriveFile | null,
  level: DriveFileAccessLevel,
  repository: Repository<DriveFile>,
  context: CompanyExecutionContext,
  token?: string,
): Promise<boolean> => {
  if (!id || id === "root" || id === "trash") return true;

  try {
    item =
      item ||
      (await repository.findOne({
        id,
        company_id: context.company.id,
      }));

    if (!item) {
      throw Error("Drive item doesn't exist");
    }

    if (token) {
      if (!item.access_info.public.token) {
        return false;
      }

      const { token: itemToken, level: itemLevel } = item.access_info.public;

      if (itemToken === token && hasAccessLevel(itemLevel, level)) {
        return true;
      }
    }

    const entities = (item.access_info.entities || []).sort((a, b): number => {
      if (a.type === "channel" && b.type === "folder") return 1;
      if (a.type === "folder" && b.type === "channel") return -1;
      if (a.type !== "channel" && b.type === "channel") return 1;
      if (a.type !== "folder" && b.type !== "channel") return -1;
      if (a.type === "channel" || a.type === "folder") return -1;
      if (b.type === "channel" || b.type === "folder") return 1;
      if (a.type === b.type) return 0;
    });

    return !!entities.find(async entity => {
      if (!hasAccessLevel(entity.level, level)) return false;

      switch (entity.type) {
        case "user":
          return entity.id === context.user.id;

        case "company":
          if (entity.id === context.company.id) {
            return !isCompanyGuest(context);
          }

          return false;
        case "folder":
          return (
            entity.id !== "root" &&
            entity.id !== "trash" &&
            (await checkAccess(entity.id, null, level, repository, context, token))
          );
        case "channel":
          // TODO: implement it
          return false;
        default:
          return false;
      }
    });
  } catch (error) {
    throw Error(error);
  }
};

/**
 * Adds drive items to an archive recursively
 *
 * @param {string} id - the drive item id
 * @param {DriveFile | null } entity - the drive item entity
 * @param {archiver.Archiver} archive - the archive
 * @param {Repository<DriveFile>} repository - the repository
 * @param {CompanyExecutionContext} context - the execution context
 * @param {string} prefix - folder prefix
 * @returns {Promise<void>}
 */
export const addDriveItemToArchive = async (
  id: string,
  entity: DriveFile | null,
  archive: archiver.Archiver,
  repository: Repository<DriveFile>,
  context: CompanyExecutionContext,
  prefix?: string,
): Promise<void> => {
  const item = entity || (await repository.findOne({ id, company_id: context.company.id }));

  if (!item) {
    throw Error("item not found");
  }

  if (!item.is_directory) {
    const file_id = item.last_version_cache.file_id;
    const file = await globalResolver.services.files.download(file_id, context);

    if (!file) {
      throw Error("file not found");
    }

    archive.append(file.file, { name: file.name, prefix: prefix ?? "" });
  } else {
    const items = await repository.find({
      parent_id: item.id,
      company_id: context.company.id,
    });

    items.getEntities().forEach(child => {
      addDriveItemToArchive(child.id, child, archive, repository, context, `${item.name}/`);
    });
  }
};

/**
 * Extracts the most popular 250 keywords from a text.
 *
 * @param {string} data - file data string.
 * @returns {string}
 */
export const extractKeywords = (data: string): string => {
  const words = data.toLowerCase().split(/[^a-zA-Z']+/);
  const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 3);

  const wordFrequency = filteredWords.reduce((acc: Record<string, number>, word: string) => {
    acc[word] = (acc[word] || 0) + 1;

    return acc;
  }, {});

  const sortedFrequency = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc: Record<string, number>, [key, val]) => {
      acc[key] = val;

      return acc;
    }, {});

  return Object.keys(sortedFrequency).slice(0, 250).join(" ");
};

/**
 * Converts an office file stream into a human readable string.
 *
 * @param {Readable} file - the input file stream.
 * @param {string} extension - the file extension.
 * @returns {Promise<string>}
 */
export const officeFileToString = async (file: Readable, extension: string): Promise<string> => {
  const officeFilePath = await writeToTemporaryFile(file, extension);
  const outputPath = getTmpFile(".pdf");

  try {
    await unoconv.run({
      file: officeFilePath,
      output: outputPath,
    });

    cleanFiles([officeFilePath]);

    return await pdfFileToString(outputPath);
  } catch (error) {
    cleanFiles([officeFilePath]);
    throw Error(error);
  }
};

/**
 * Converts a PDF file stream into a human readable string.
 *
 * @param {Readable | string} file - the input file stream or path.
 * @returns {Promise<string>}
 */
export const pdfFileToString = async (file: Readable | string): Promise<string> => {
  let inputBuffer: Buffer;

  try {
    if (typeof file === "string") {
      inputBuffer = await readFromTemporaryFile(file);
      cleanFiles([file]);
    } else {
      inputBuffer = await readableToBuffer(file);
    }

    const result = await PdfParse(inputBuffer);

    return result.text;
  } catch (error) {
    if (typeof file === "string") {
      cleanFiles([file]);
    }

    throw Error(error);
  }
};
