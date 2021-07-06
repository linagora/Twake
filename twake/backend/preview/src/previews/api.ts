export interface PreviewServiceAPI {
  /**
   * Save a file and returns its entity
   *
   * @param id
   * @param file
   * @param options
   * @param context
   */
  save(id: string): Promise<File>;

  /**
   * Get a file as readable and metadata information from its ID
   *
   * @param id
   * @param context
   */
  download(
    id: string,
    context: any
  ): Promise<{ file: any; name: string; mime: string; size: number }>;

  /**
   * Get a file entity from its id
   *
   * @param id
   * @param context
   */
  get(): Promise<File>;
}
