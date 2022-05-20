import ffmpeg from "fluent-ffmpeg";
import { PreviewPubsubRequest, temporaryThumbnailFile, ThumbnailResult } from "../../types";
import { cleanFiles, getTmpFile } from "../../utils";
import fs from "fs";

/**
 * Generate thumbnails for given video files.
 *
 * @param {String[]} videoPaths - the input video paths
 * @param { PreviewPubsubRequest["output"]} options - the options for the thumbnails
 * @returns {Promise<ThumbnailResult[]>} - resolves when the thumbnails are generated
 */
export async function generateVideoPreview(
  videoPaths: string[],
  options: PreviewPubsubRequest["output"],
): Promise<ThumbnailResult[]> {
  const output: ThumbnailResult[] = [];

  for (const videoPath of videoPaths) {
    const { fileName, folder, filePath } = getTemporaryThumbnailFile();

    try {
      await takeVideoScreenshot(videoPath, folder, fileName, options);
      output.push(getThumbnailInformation(filePath, options));
    } catch (error) {
      cleanFiles([filePath]);
      throw Error(`failed to generate video preview: ${error}`);
    }
  }

  return output;
}

/**
 * Generate one thumbnail from a single video file.
 * the thumbnail is the first frame from the video
 *
 * @param {String} inputPath  - the input video Path
 * @param {String} outputFolder - the output folder
 * @param {String} outputFile  - the output file name
 * @returns {Primise} - resolves when the thumbnail is generated
 */
const takeVideoScreenshot = async (
  inputPath: string,
  outputFolder: string,
  outputFile: string,
  options: PreviewPubsubRequest["output"],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshot({
        count: 1,
        filename: outputFile,
        folder: outputFolder,
        timemarks: ["0"],
        size: `${options.width || 320}x${options.height || 240}`,
      })
      .on("end", () => {
        resolve();
      })
      .on("error", error => {
        reject(error);
      });
  });
};

/**
 * Get the generated thumbnail information.
 *
 * @param {String} path - the path to the thumbnail
 * @param {PreviewPubsubRequest["output"]} options - the options for the thumbnails
 * @returns {ThumbnailResult} - the thumbnail information
 */
const getThumbnailInformation = (
  path: string,
  options: PreviewPubsubRequest["output"],
): ThumbnailResult => {
  const { width, height } = options;
  const stats = fs.statSync(path);

  return {
    width: width || 320,
    height: height || 240,
    type: "image/png",
    path: path,
    size: stats.size,
  };
};

/**
 * generate a temporary thumbnail file.
 *
 * @returns {temporaryThumbnailFile} - the temporary thumbnail file information
 */
const getTemporaryThumbnailFile = (): temporaryThumbnailFile => {
  const filePath = `${getTmpFile()}.png`;
  const fileName = filePath.split("/").pop();
  const folder = filePath.substring(0, filePath.lastIndexOf("/"));

  return {
    folder,
    fileName,
    filePath,
  };
};
