import { NodeMessage } from 'app/features/messages/types/message';
import routerService from 'app/features/router/services/router-service';

/**
 * Go to a specific message
 * 
 * @param {Message} message - The message to scroll to
 */
export const gotoMessage = (message: NodeMessage, companyId: string, channelId: string, workspaceId: string): void => {
  routerService.push(
    routerService.generateRouteFromState({
      companyId,
      channelId,
      workspaceId,
      threadId: message.thread_id,
    }),
  );
};
