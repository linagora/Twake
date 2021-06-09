import { TwakeServiceProvider, Initializable } from "../../../../core/platform/framework";
import {
  CRUDService,
  ExecutionContext,
} from "../../../../core/platform/framework/api/crud-service";
import {
  PhpMessage,
  PhpMessagePrimaryKey,
} from "../../../../cli/cmds/migration_cmds/php-message/php-message-entity";

export interface PhpMessagesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<PhpMessage, PhpMessagePrimaryKey, ExecutionContext> {}
