<?php


namespace Twake\Discussion\Services;

use App\App;
use Twake\Discussion\Entity\Call;
use Twake\Discussion\Entity\Channel;
use Twake\Discussion\Entity\Message;
use Twake\Discussion\Entity\MessageLike;
use Twake\Discussion\Entity\MessageReaction;
use Twake\Discussion\Model\MessagesSystemInterface;
use Twake\GlobalSearch\Entity\Bloc;

class MessageSystem
{

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->applications_api = $app->getServices()->get("app.applications_api");
        $this->websockets_service = $app->getServices()->get("app.websockets");
        $this->message_notifications_center_service = $app->getServices()->get("app.channels.notifications");
        $this->access_manager = $app->getServices()->get("app.accessmanager");
        $this->queues = $app->getServices()->get('app.queues')->getAdapter();
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        $route = explode("/", $route);
        $channel_id = isset($route[1]) ? $route[1] : null;

        if (!$channel_id) {
            return false;
        }

        return $this->hasAccess([
            "channel_id" => $channel_id
        ], $current_user);
    }

    public function hasAccess($data, $current_user = null, $message = null)
    {
        if ($current_user === null) {
            return true;
        }
        if (!is_string($current_user)) {
            $current_user = $current_user->getId();
        }

        //Verify message access
        if ($message) {
            if ($current_user && $message->getSender() && $message->getSender()->getId() != $current_user) {
                return false; //Not my message
            }
        }

        $channel_id = $data["channel_id"];
        return $this->access_manager->has_access($current_user, [
            "type" => "Channel",
            "edition" => false,
            "object_id" => $channel_id
        ]);
    }

    public function get($options, $current_user)
    {
        $channel_id = $options["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $message_repo = $this->em->getRepository("Twake\Discussion:Message");

        $offset = isset($options["offset"]) ? $options["offset"] : null;
        $limit = isset($options["limit"]) ? $options["limit"] : 60;
        $parent_message_id = isset($options["parent_message_id"]) ? $options["parent_message_id"] : "";

        $messages_ent = $message_repo->findBy(Array("channel_id" => $channel_id, "parent_message_id" => $parent_message_id), Array(), $limit, $offset, ["parent_message_id", "id"], ["ASC", "DESC"]);

        $messages_ent = array_reverse($messages_ent);

        $messages = [];
        foreach ($messages_ent as $message) {
            if ($parent_message_id == "" && $message->getResponsesCount() > 0) {
                $messages_responses_ent = $message_repo->findBy(Array("channel_id" => $channel_id, "parent_message_id" => $message->getId()), Array(), 10, null, "id", "DESC");
                if (count($messages_responses_ent) == 0) {
                    $message->setResponsesCount(0);
                    $this->em->persist($message);
                    $this->em->flush();
                }
                foreach ($messages_responses_ent as $message_response) {
                    $messages[] = $message_response->getAsArray();
                }
            }

            $messages[] = $message->getAsArray();
        }

        //Add my reaction if necessary
        foreach ($messages as $id => $message) {

            //If possible, show only current user content !
            if ($current_user && isset($message["user_specific_content"][$current_user->getId()])) {
                $tmp = Array();
                $tmp[$current_user->getId()] = $message["user_specific_content"][$current_user->getId()];
                $message["user_specific_content"] = $tmp;
            }

            if ($current_user && count($message["reactions"]) > 0) {
                $message_reaction_repo = $this->em->getRepository("Twake\Discussion:MessageReaction");
                $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $current_user->getId(), "message_id" => $message["id"]));
                if ($message_reaction) {
                    $messages[$id]["_user_reaction"] = $message_reaction->getReaction();
                }
            }

        }

        $channel = $this->em->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));
        $this->message_notifications_center_service->read($channel, $current_user);

        return $messages;
    }

    public function remove($object, $options, $current_user = null)
    {
        $channel_id = $object["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$object["parent_message_id"]) {
            $object["parent_message_id"] = "";
        }

        $message_repo = $this->em->getRepository("Twake\Discussion:Message");
        $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => $object["parent_message_id"], "id" => $object["id"]));

        if (!$message) {
            return false;
        }

        //TODO for allow_delete == "administrators" implement user access verification
        if (!($this->hasAccess($message->getAsArray(), $current_user, $message) || $message->getAsArray()["hidden_data"]["allow_delete"] == "everyone" || $message->getAsArray()["hidden_data"]["allow_delete"] == "administrators")) {
            return false;
        }

        if ($message->getResponsesCount() > 0) {
            return false;
        }

        if ($message->getParentMessageId()) {
            $parent_message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $message->getParentMessageId()));
            $parent_message->setResponsesCount($parent_message->getResponsesCount() - 1);
            $this->em->persist($parent_message);
        }

        $channel_repo = $this->em->getRepository("Twake\Channels:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));
        $channel->setMessagesCount($channel->getMessagesCount() - 1);

        $this->em->persist($channel);

        $array_before_delete = $message->getAsArray();

        $this->em->remove($message);
        $this->em->flush();

        $this->deleteInBloc($message);

        return $array_before_delete;

    }

    public function deleteInBloc($message)
    {

        $bloc = $this->em->getRepository("Twake\GlobalSearch:Bloc")->findOneBy(Array("id" => $message->getBlockId()));

        if (!$bloc) {
            return false;
        }

        try {
            $bloc->removeMessage($message->getId());

            $this->em->persist($bloc);
            $this->em->flush();

            if ($bloc->getLock() == true) {
                $this->em->es_put($bloc, $bloc->getEsType());
            }

        } catch (\Exception $e) {
            error_log($e->getMessage());
        }

    }

    /**
     * @param $object
     * @param $options
     * @param null $user
     * @param null $application
     * @return array
     */
    public function save($object, $options, $user = null, $application = null)
    {

        $channel_id = $object["channel_id"];
        if (!$channel_id) {
            return false;
        }

        if (!$object["parent_message_id"]) {
            $object["parent_message_id"] = "";
        }

        $ephemeral = (isset($object["_once_ephemeral_message"]) && $object["_once_ephemeral_message"] || isset($object["ephemeral_id"]) && $object["ephemeral_id"]);
        if ($ephemeral) {
            unset($object["id"]);
        }

        $message_repo = $this->em->getRepository("Twake\Discussion:Message");

        $channel_repo = $this->em->getRepository("Twake\Channels:Channel");
        $channel = $channel_repo->findOneBy(Array("id" => $object["channel_id"]));

        $did_create = false;

        $message = null;

        if (isset($object["id"])) {
            $message = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => isset($object["_once_replace_message_parent_message"]) ? $object["_once_replace_message_parent_message"] : $object["parent_message_id"], "id" => $object["id"]));

            if (!$message) {
                $message = $message_repo->findOneBy(Array("id" => $object["id"]));
                if ($message) {
                    if (isset($object["channel_id"]) && $object["channel_id"] != $message->getChannelId()) {
                        return false;
                    }
                    if (isset($object["_once_replace_message_parent_message"]) && $object["_once_replace_message_parent_message"] != $message->getParentMessageId()) {
                        return false;
                    } else if (isset($object["parent_message_id"]) && $object["parent_message_id"] != $message->getParentMessageId()) {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            //Verify can modify this message
            if ($message && !$this->hasAccess($object, $current_user, $message)) {
                return false;
            }

            if (!$message) {
                return false;
            }

            foreach ($message->getAsArray() as $key => $value) {
                if (!isset($object[$key])) {
                    $object[$key] = $value;
                }
            }

        }

        if ($message == null) {

            //Verify can create in channel
            if (!$this->hasAccess($object, $current_user)) {
                return false;
            }


            if (!$ephemeral && $object["parent_message_id"]) {
                //Increment parent
                $new_parent = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
                if (!$new_parent) {
                    $object["parent_message_id"] = "";
                } else {
                    $new_parent->setResponsesCount($new_parent->getResponsesCount() + 1);
                    $this->em->persist($new_parent);
                    $this->share($new_parent);
                }
            }

            //Create a new message
            $message = new Message($object["channel_id"], $object["parent_message_id"], $channel);

            $message->setModificationDate(new \DateTime());
            if ($object["front_id"]) {
                $message->setFrontId($object["front_id"]);
            }

            if ($object["ephemeral_id"]) {
                $message->setId($object["ephemeral_id"]);
                $message->setFrontId($object["ephemeral_id"]);
            }

            $did_create = true;

        } else if ($message->getContent() != $object["content"]) {
            $message->setEdited(true);
            $message->setModificationDate(new \DateTime());
        }

        //Move message
        if (!$ephemeral && isset($object["_once_replace_message_parent_message"])) {
            $new_parent = null;
            if ($object["parent_message_id"]) {
                $new_parent = $message_repo->findOneBy(Array("channel_id" => $object["channel_id"], "parent_message_id" => "", "id" => $object["parent_message_id"]));
            }
            $this->moveMessageToNewParent($message, $new_parent);
        }

        if ($did_create) {
            //Set message type
            if ($application) {
                $message->setMessageType(1);
                $message->setApplicationId($application->getId());
                if ($user) {
                    $message->setSender($user);
                }
            } else if (!$user && !$application) {
                $message->setMessageType(2);
            } else if ($user && !$application) {
                $message->setMessageType(0);
            }
        }

        //If no sender set, update sender (can be modified after)
        if (!$message->getSender() && $message->getMessageType() == 0) {
            $message->setSender($user);
        }


        //Update message values
        if ($application && isset($object["_once_user_specific_update"])) {
            $specific_data = $message->getUserSpecificContent();
            if (!$specific_data) {
                $specific_data = Array();
            }
            $updates = $object["_once_user_specific_update"];
            if ($updates["user_id"]) {
                $updates = Array($updates);
            }
            foreach ($updates as $update) {
                $user_id = $update["user_id"];
                $modifiers = $update["modifiers"];
                $replace_all_keys = $update["replace_all"];
                if ($replace_all_keys) {
                    $specific_data[$user_id] = $modifiers;
                } else {
                    foreach ($modifiers as $key => $data) {
                        $specific_data[$user_id][$key] = $data;
                    }
                }
            }
            $message->setUserSpecificContent($specific_data);
        }

        $message->setHiddenData($object["hidden_data"]);
        $message->setContent($object["content"]);
        $message->setPinned($object["pinned"]);


        //Update reactions
        if (isset($object["_user_reaction"]) && $user && $message->getId()) {
            $message_reaction_repo = $this->em->getRepository("Twake\Discussion:MessageReaction");
            $message_reaction = $message_reaction_repo->findOneBy(Array("user_id" => $user->getId(), "message_id" => $message->getId()));
            $current_reactions = $message->getReactions();
            $user_reaction = $object["_user_reaction"];
            $reaction = Array();

            /*if($current_reactions && !(is_array($current_reactions[0]))){
                $reacttochangeformat = Array();
                $allreactionppl = $message_reaction_repo->findBy(Array("message_id" => $message->getId()));
                foreach ($allreactionppl as $ppl){
                    $reacttochangeformat[$ppl->getReaction()]["users"][]= $ppl->getUserId() ;
                    if($reacttochangeformat[$ppl->getReaction()]["count"]){
                        $reacttochangeformat[$ppl->getReaction()]["count"]++;
                    }
                    else{
                        $reacttochangeformat[$ppl->getReaction()]["count"] = 1 ;
                    }
                }
                $current_reactions = $reacttochangeformat;
            }*/

            if ($message_reaction) {
                if ($user_reaction == $message_reaction->getReaction()) {
                    //Noop
                } else if (!$user_reaction) {
                    $this->em->remove($message_reaction);
                    $reaction["remove"] = Array($message_reaction->getReaction() => Array("user" => $user->getId()));
                } else {
                    $reaction["remove"] = Array($message_reaction->getReaction() => Array("user" => $user->getId()));
                    $reaction["add"] = Array($user_reaction => $user->getId());

                    $message_reaction->setReaction($user_reaction);
                    $this->em->persist($message_reaction);
                }

            } else if ($user_reaction) {
                $message_reaction = new MessageReaction($message->getId(), $user->getId());
                $reaction["add"] = Array($user_reaction => Array("user" => $user->getId()));
                $message_reaction->setReaction($user_reaction);
                $this->em->persist($message_reaction);
            }

            if (isset($reaction["add"])) {
                $key_first = array_keys($reaction["add"])[0];
                if (array_key_exists($key_first, $current_reactions)) {
                    $current_reactions[$key_first]["users"][] = $user->getId();
                } else {
                    $current_reactions[$key_first]["users"] = Array($user->getId());
                }
                $current_reactions[$key_first]["count"]++;
            }
            if (isset($reaction["remove"])) {
                $key_first = array_keys($reaction["remove"])[0];
                if (array_key_exists($key_first, $current_reactions)) {
                    $keytoremove = array_search($user->getId(), $current_reactions[$key_first]["users"]);
                    unset($current_reactions[$key_first]["users"][$keytoremove]);
                    $current_reactions[$key_first]["count"]--;
                    if ($current_reactions[$key_first]["count"] == 0) {
                        unset($current_reactions[$key_first]);
                    }
                }
            }

            $message->setReactions($current_reactions);
        }

        if (isset($object["tags"])) {
            $message->setTags($object["tags"]);
        }

        //Generate an ID
        $this->em->persist($message);

        if ($ephemeral) {
            $this->em->remove($message);
        } else {

            try {
                $this->indexMessage($message, $channel->getOriginalWorkspaceId(), $object["channel_id"]);
            } catch (\Exception $e) {
                error_log("ERROR WITH MESSAGE SAVE INSIDE A BLOC");
            }

            $init_channel = isset($object["hidden_data"]["type"]) && $object["hidden_data"]["type"] == "init_channel";
            if ($channel && $did_create && !$init_channel) {
                $channel->setLastActivity(new \DateTime());
                $channel->setMessagesIncrement($channel->getMessagesIncrement() + 1);
                $this->em->persist($channel);
                
                //Sender autoread the channel
                if($user){
                    $membersRepo = $this->em->getRepository("Twake\Channels:ChannelMember");
                    $member = $membersRepo->findOneBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId(), "user_id" => $user->getId()));
                    $member->setLastMessagesIncrement($channel->getMessagesIncrement());
                    $this->em->persist($member);
                }

                try{
                    $this->queues->push("message_dispatch_queue", [
                        "channel" => $channel->getId(),
                        "message_id" => $message->getId(),
                        "application_id" => $application ? $application->getId() : null,
                        "user_id" => $user ? $user->getId() : null,
                    ]);
                }catch(\Exception $err){
                    error_log($err->getMessage());
                }
            }

            $this->em->flush();

            //Notify connectors
            if ($channel->getOriginalWorkspaceId()) {
                if ($channel->getAppId()) {
                    $apps_ids = [$channel->getAppId()];
                } else {
                    $resources = $this->applications_api->getResources($channel->getOriginalWorkspaceId(), "channel", $channel->getId());
                    $resources = array_merge($resources, $this->applications_api->getResources($channel->getOriginalWorkspaceId(), "workspace", $channel->getOriginalWorkspaceId()));
                    $apps_ids = [];
                    foreach ($resources as $resource) {
                        if ($resource->getResourceId() == $channel->getOriginalWorkspaceId() && !in_array("message_in_workspace", $resource->getApplicationHooks())) {
                            continue; //Si resource sur tout le workspace et qu'on a pas le hook new_message_in_workspace on a pas le droit
                        }
                        if (in_array("message", $resource->getApplicationHooks()) || in_array("message_in_workspace", $resource->getApplicationHooks())) {
                            $apps_ids[] = $resource->getApplicationId();
                        }
                    }
                }
                if (count($apps_ids) > 0) {
                    foreach ($apps_ids as $app_id) {
                        if ($app_id) {
                            $data = Array(
                                "message" => $message->getAsArray(),
                                "channel" => $channel->getAsArray()
                            );
                            if ($did_create) {
                                $this->applications_api->notifyApp($app_id, "hook", "new_message", $data);
                            } else if ($channel->getAppId()) { //Only private channels with app can receive edit hook
                                $this->applications_api->notifyApp($app_id, "hook", "edit_message", $data);
                            }
                        }
                    }
                }
            }

        }

        $array = $message->getAsArray();

        if ($ephemeral) {
            $array["ephemeral_id"] = $message->getId();
            $array["_user_ephemeral"] = true;
            if (isset($object["ephemeral_message_recipients"])) {
                $array["ephemeral_message_recipients"] = $object["ephemeral_message_recipients"];
            }
        }
        return $array;
    }

    public function dispatchMessage($channel_id, $application_id, $user_id, $message_id){

        $message = $this->em->getRepository("Twake\Discussion:Message")->findOneBy(Array("id" => $message_id));

        if($message){
            $sender_application = $application_id ? $this->em->getRepository("Twake\Market:Application")->findOneBy(Array("id" => $application_id)) : null;
            $sender_user = $user_id ? $this->em->getRepository("Twake\Users:User")->findOneBy(Array("id" => $user_id)) : null;
            $channel = $this->em->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));

            $this->message_notifications_center_service->newElement($channel, $sender_application, $sender_user, $this->mdToText($message->getContent()), $message);
        }

    }

    private function share($message)
    {

        if (!$message) {
            return;
        }

        $event = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $message->getAsArray()
        );
        $this->websockets_service->push("messages/" . $message->getChannelId(), $event);

    }

    private function moveMessageToNewParent(Message $messageA, $messageB, $flush = true)
    {

        if (!$messageA->getParentMessageId() && !$messageB || $messageB && $messageA->getParentMessageId() == $messageB->getId()) {
            return;
        }

        $this->em->remove($messageA);
        $this->em->flush();

        $new_parent_message_id = $messageB ? $messageB->getId() : "";

        $messageA->setParentMessageId($new_parent_message_id);

        if ($messageA->getResponsesCount() > 0) {
            $message_repo = $this->em->getRepository("Twake\Discussion:Message");

            //Move all children to the same parent message id
            $others = $message_repo->findBy(Array("channel_id" => $messageA->getChannelId(), "parent_message_id" => $messageA->getId()));

            foreach ($others as $message) {
                $this->moveMessageToNewParent($message, $messageB, false);
            }

        }

        if ($messageB) {
            $messageB->setResponsesCount($messageB->getResponsesCount() + 1);
        }

        $messageA->setResponsesCount(0);
        $this->em->persist($messageA);

        $this->share($messageA);

        if ($flush) {
            $this->share($messageB);
            $this->em->flush();
        }

        return $messageA;

    }

    public function indexMessage($message, $workspace_id, $channel_id)
    {
        if (!$workspace_id) {
            $workspace_id = "00000000-0000-1000-0000-000000000000";
        }

        $blocbdd = null;
        if ($message->getBlockId()) {
            $blocbdd = $this->em->getRepository("Twake\GlobalSearch:Bloc")->findOneBy(Array("id" => $message->getBlockId()));
        }

        if (!$blocbdd) {

            $lastbloc = $this->em->getRepository("Twake\GlobalSearch:Bloc")->findOneBy(Array("workspace_id" => $workspace_id, "channel_id" => $channel_id));

            if (isset($lastbloc) == false || $lastbloc->getLock() == true) {

                $messages = Array();
                $id_messages = Array();
                $blocbdd = new Bloc($workspace_id, $channel_id, $messages, $id_messages);

            } else {

                $blocbdd = $lastbloc;

            }

        }

        if (!$blocbdd) {
            return false;
        }

        try {

            $options = Array("keep_mentions" => true);
            $content_id = $this->mdToText($message->getContent(), $options);
            $content = $this->mdToText($message->getContent());

            $blocbdd->addOrUpdateMessage($message, $content, $content_id);

            if ($blocbdd->getNbMessage() >= 10) {
                $blocbdd->setLock(true);
            }

            $this->em->persist($blocbdd);
            $message->setBlockId($blocbdd->getId() . "");

            $this->em->persist($message);
            $this->em->flush();

            if ($blocbdd->getLock()) {
                $this->em->es_put($blocbdd, $blocbdd->getEsType());
            }

        } catch (\Exception $e) {
            error_log($e->getMessage());
        }

    }

    private function mdToText($array, $options = null)
    {

        if (!$array) {
            return "";
        }

        if (is_string($array)) {
            $array = [$array];
        }

        if (isset($array["fallback_string"])) {
            $result = $array["fallback_string"];
        } else if (isset($array["original_str"])) {
            $result = $array["original_str"];
        } else {

            if (isset($array["type"]) || isset($array["start"])) {
                $array = [$array];
            }

            $result = "";

            try {
                foreach ($array as $item) {
                    if (is_string($item)) {
                        $result .= $item;
                    } else if (isset($item["type"])) {
                        if (in_array($item["type"], Array("underline", "strikethrough", "bold", "italic", "mquote", "quote", "email", "url", "", "nop", "br", "system"))) {
                            if ($item["type"] == "br") {
                                $result .= " ";
                            }
                            $result .= $this->mdToText($item["content"]);
                        }
                    } else {
                        $result .= $this->mdToText($item["content"]);
                    }
                }

            } catch (\Exception $e) {
                return "Open Twake to see this message.";
            }

        }
        if (!(isset($options["keep_mentions"]) && $options["keep_mentions"] == true)) {
            $result = preg_replace("/@(.*?):.*?(( |$))/", "@$1$2", $result);
            $result = preg_replace("/#(.*?):.*?(( |$))/", "#$1$2", $result);
        }

        return $result;

    }


}
