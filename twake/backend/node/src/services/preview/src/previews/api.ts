export interface PreviewServiceAPI {
  /**
   * Get a file entity from its id
   *
   * @param mime
   * @param inputPath
   * @param outputPath
   */
  generateThumbnails(
    mime: string,
    inputPath: string,
    outputPath: string,
    outputExtension: string,
    numberOfPages: number,
  ): any;
}
