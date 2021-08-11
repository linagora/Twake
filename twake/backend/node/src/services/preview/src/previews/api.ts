export interface PreviewServiceAPI {
  /**
   * Get a file entity from its id
   *
   * @param mime
   * @param inputPath
   * @param outputPath
   */
  generateThumbnails(
    document: { id: string; path: string; provider: string },
    mime: string,
    numberOfPages: number,
  ): any;
}
