import Collections, { Collection, Resource } from '../Collections';

export default class CollectionTransport<G extends Resource<any>> {
  constructor(private readonly collection: Collection<G>) {}

  /**
   * This collection is visible, transport must start
   */
  start() {
    console.log('start listening to collection', this.collection.getPath());
    setTimeout(() => {
      Collections.getTransport()
        .getSocket()
        //TODO need to create a type for socket events
        .join(this.collection.getPath(), async (event: any) => {
          setTimeout(async () => {
            if (event.action === 'created' || event.action === 'updated') {
              let localeResource = await this.collection.findOne(event.resource.id);
              if (!localeResource) {
                localeResource = new (this.collection.getType())(event.resource);
              }
              localeResource.setShared();
              console.log(localeResource);
              this.collection.upsert(localeResource, {
                withoutBackend: true,
              });
            }
            if (event.action === 'deleted') {
              let localeResource = await this.collection.findOne(event.resource.id);
              this.collection.remove(localeResource, {
                withoutBackend: true,
              });
            }
          }, 1000);
        });
    }, 1000);
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    console.log('stop listening to collection', this.collection.getPath());
    Collections.getTransport().getSocket().leave(this.collection.getPath());
  }

  async get(options?: any) {
    try {
      return await Collections.getTransport().getHttp().get(this.collection.getPath());
    } catch (err) {
      console.log(err);
      //TODO retry system
    }
  }

  async upsert(resource: G) {
    try {
      return await Collections.getTransport()
        .getHttp()
        .post(this.collection.getPath(), resource.data);
    } catch (err) {
      console.log(err);
      //TODO retry system
    }
  }

  async remove(resource_id: string) {
    try {
      return await Collections.getTransport()
        .getHttp()
        .delete(this.collection.getPath() + resource_id);
    } catch (err) {
      //TODO retry system
      console.log(err);
    }
  }
}
