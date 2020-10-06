export default class Channel {
  constructor(
    protected id: string,
    protected name?: string,
    protected secret?: string
  ) {}
}
