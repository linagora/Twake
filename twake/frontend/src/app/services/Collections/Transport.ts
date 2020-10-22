import { Collection, Resource } from './Collections';

export default class Transport<G extends Resource<any>> {
  constructor(private readonly collection: Collection<G>) {}
}
