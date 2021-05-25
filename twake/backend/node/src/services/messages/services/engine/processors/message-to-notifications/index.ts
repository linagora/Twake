import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import { logger } from "../../../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../../../core/platform/services/pubsub/api";

export class MessageToNotificationsProcessor {
  private name = "MessageToNotificationsProcessor";

  constructor(
    readonly database: DatabaseServiceAPI,
    private pubsub: PubsubServiceAPI,
    readonly service: MessageServiceAPI,
  ) {}

  async init() {}

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    logger.debug(`${this.name} - Share message with notification microservice`);
    try {
      /*
        $messageArray = $message->getAsArray();

        $senderName = "";
        if($messageArray["sender"]){
            $sender_user = $this->em->getRepository("Twake\Users:User")->findOneBy(Array("id" => $messageArray["sender"]));
            $senderName = $sender_user ? $sender_user->getFullName() : "";
        }

        $title = "";
        $text = $this->buildShortText($message);
        $body = $text; // we need original body just in case text gets updated further on
        if ($channel->getData()["is_direct"]) {
            $title = $senderName . " in " . $channel->getData()["company_name"];
        }else{
            $title = $channel->getData()["name"];
            $title .= " in " . $channel->getData()["company_name"] . " • " . $channel->getData()["workspace_name"];
            $text = $senderName . ": " . $text;
        }

        if($channel){

            $md2text_options = Array("keep_mentions" => true);
            $text_content = $this->mdToText($message->getContent(), $md2text_options);
            preg_match_all("/@[^: ]+:([0-f-]{36})/m", $text_content, $users_output);
            preg_match_all("/(^| )@(all|here|channel|everyone)[^a-z]/m", $text_content, $global_output);
            $mentions = [
                "users" => $users_output[1],
                "specials" => $global_output[2]
            ];
            $rabbitData = [
                "company_id" => $channel->getData()["company_id"],
                "workspace_id" => $channel->getData()["workspace_id"] ?: "direct",
                "channel_id" => $messageArray["channel_id"],
                "thread_id" => $messageArray["parent_message_id"],
                "id" => $messageArray["id"],
                "sender" => $messageArray["sender"],
                "creation_date" => $messageArray["creation_date"] * 1000,
                "mentions" => $mentions,

                "sender_name" => $senderName,
                "channel_name" => $channel->getData()["name"],
                "company_name" => $channel->getData()["workspace_name"],
                "workspace_name" => $channel->getData()["company_name"],

                "title" => $title,
                "text" => $text
            ];
            $rabbitChannelData = [
                "company_id" => $channel->getData()["company_id"],
                "workspace_id" => $channel->getData()["workspace_id"] ?: "direct",
                "channel_id" => $messageArray["channel_id"],
                "date" => $messageArray["creation_date"] * 1000,
                "sender" => $messageArray["sender"],
                "sender_name" => $senderName, // username, because it's not convenient to make request to find out username by id
                "title" => $title, 
                "text" => $text,
                "body" => $body // original body of the message without sender
            ];

            if($messageArray["message_type"] != 2){ //Ignore system messages
                if($did_create){
                    $this->queues->push("channel:activity", $rabbitChannelData, ["exchange_type" => "fanout"]);
                    $this->queues->push("message:created", $rabbitData, ["exchange_type" => "fanout"]);
                }else{
                    $this->queues->push("message:updated", $rabbitData, ["exchange_type" => "fanout"]);
                }
            }
        }
      */
      /*
      await this.pubsub.publish<ActivityPublishedType>("channel:activity_message", {
        data: {
          channel_id: channel.id,
          workspace_id: channel.workspace_id,
          company_id: channel.company_id,
          activity: data,
        },
      });
      */
    } catch (err) {
      logger.warn({ err }, `${this.name} - Error while publishing`);
    }
  }
}
