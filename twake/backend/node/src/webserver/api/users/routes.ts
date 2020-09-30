import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { UserParams, CreateUserBody } from "./types";
import * as controller from "./controller";
import User from '../../../core/user/models';

export default (router: FastifyInstance) => {

  router.get('/users', async (req, _res): Promise<User[]> => {
    req.log.info('Get users');

    return controller.getUsers();
  });

  router.get<{
    Params: UserParams,
  }>('/users/:id', async (req, _res): Promise<User> => {
    req.log.info(`Get user ${req.params.id}`);
    return controller.getUser(req.params.id);
  });

  const opts: RouteShorthandOptions = {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: {
            type: 'string'
          }
        }
      }
    }
  };

  router.post<{
    Body: CreateUserBody
  }>('/users', opts, async (req, _res): Promise<User> => {
    req.log.info(`Creating user ${JSON.stringify(req.body)}`);
    return new User('1');
  });
}
