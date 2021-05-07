import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Paginable,
  SaveResult,
} from "../../../../core/platform/framework/api/crud-service";
import { TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadsServiceAPI } from "../../api";
import { ParticipantObject, Thread, ThreadPrimaryKey } from "../../entities/threads";
import { CompanyExecutionContext } from "../../types";
import { Message } from "../../entities/messages";
import _ from "lodash";

export class ThreadsService
  implements MessageThreadsServiceAPI, CRUDService<Thread, ThreadPrimaryKey, ExecutionContext> {
  version: "1";
  repository: Repository<Thread>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Thread>("threads", Thread);
    return this;
  }

  async save(
    item: Pick<Thread, "company_id" | "id"> & {
      participants: Pick<ParticipantObject, "id" | "type">[];
    },
    options?: { participants?: ParticipantOperation; message?: Message },
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<Thread>> {
    if (item.id) {
      //Update
      const participantsOperation: ParticipantOperation = options.participants || {
        add: [],
        remove: [],
      };

      const thread = await this.repository.findOne({ company_id: context.company.id, id: item.id });

      // Add the created_by information
      participantsOperation.add = (participantsOperation.add || []).map(p => {
        return {
          created_by: context.user.id,
          created_at: new Date().getTime(),
          ...p,
        };
      }) as ParticipantObject[];

      thread.participants = _.uniqBy(
        _.differenceBy(
          [...thread.participants, ...participantsOperation.add],
          participantsOperation.remove || [],
          p => p.id,
        ),
        p => p.id,
      ) as ParticipantObject[];

      this.repository.save(thread);

      //TODO ensure the thread is in all participants (and removed from deleted participants)

      return new SaveResult("thread", thread, OperationType.UPDATE);
    } else {
      //Creation

      //Enforce current user in the participants list and add the created_by information
      const participants: ParticipantObject[] = [
        { type: "user", id: context.user.id },
        ...item.participants,
      ].map(p => {
        return {
          created_by: context.user.id,
          created_at: new Date().getTime(),
          ...p,
        };
      }) as ParticipantObject[];

      const message: Message | null = options.message || null;

      const thread = new Thread();
      thread.company_id = context.company.id;
      thread.created_at = new Date().getTime();
      thread.last_activity = thread.created_at;
      thread.answers = 0;
      thread.created_by = context.user.id;
      thread.participants = _.uniqBy(participants, p => p.id);

      this.repository.save(thread);

      //TODO create the message

      return new SaveResult("thread", thread, OperationType.CREATE);
    }
  }

  get(pk: Pick<Thread, "company_id" | "id">, context?: ExecutionContext): Promise<Thread> {
    throw new Error("Method not implemented.");
  }
  delete(
    pk: Pick<Thread, "company_id" | "id">,
    context?: ExecutionContext,
  ): Promise<DeleteResult<Thread>> {
    throw new Error("Method not implemented.");
  }
  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Thread>> {
    throw new Error("Method not implemented.");
  }
}

type ParticipantOperation = {
  add: Pick<ParticipantObject, "id" | "type">[];
  remove: Pick<ParticipantObject, "id" | "type">[];
};
