<?php


namespace Twake\Channels\Services;

use Twake\Discussion\Entity\Channel;
use App\App;

class DirectMessagesSystem extends ChannelSystemAbstract
{

    public function __construct(App $app)
    {
        $this->messages_service = $app->getServices()->get("app.messages");
        parent::__construct($app);
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        if(!$current_user || is_string($current_user)){
            return false;
        }
        if (str_replace("channels/direct_messages/", "", $route) == $current_user->getId()) {
            return $this->hasAccess($data, $current_user);
        } else {
            return false;
        }
    }

    public function hasAccess($data, $current_user = null)
    {
        if ($current_user) {
            return true;
        } else {
            return false;
        }
    }

    public function get($options, $current_user)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $channelRepo = $this->entity_manager->getRepository("Twake\Channels:Channel");

        $member = $this->entity_manager->getRepository("Twake\Channels:ChannelMember")->findBy(
            Array("user_id" => $current_user->getId(), "direct" => true),
            Array(),
            isset($options["max"]) ? $options["max"] : 40,
            isset($options["offset"]) ? $options["offset"] : 0,
            "last_activity_least_updated",
            0,
            "last_modified_channels"
        );

        $result = [];
        foreach ($member as $link) {
            if ($link->getChannelId()) {
                $channel = $channelRepo->find(Array("direct" => 1, "original_workspace_id" => "", "id" => $link->getChannelId()));
                if ($channel) {
                    $tmp = $channel->getAsArray();
                    $tmp["_user_last_message_increment"] = $link->getLastMessagesIncrement();
                    $tmp["_user_last_quoted_message_id"] = $link->getLastQuotedMessageId();
                    $tmp["_user_last_access"] = $link->getLastAccess() ? $link->getLastAccess()->getTimestamp() : null;
                    $tmp["_user_muted"] = $link->getMuted();
                    $result[] = $tmp;
                }
            }
        }

        return $result;
    }

    public function remove($object, $options, $current_user)
    {
        //TODO verify this channel is ours
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        return $this->removeGeneralChannel($object);
    }

    public function save($object, $options, $current_user)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        if (isset($object["app_id"]) && $object["app_id"]) {

            $object["front_id"] = $object["group_id"] . "_app_" . $object["app_id"] . "_" . $current_user->getId();

            $members = [$current_user->getId()];

            if (isset($object["group_id"])) {
                $app_bot_identifier = $object["group_id"] . "_app_" . $object["app_id"];
            } else if (isset($object["app_bot_identifier"])) {
                $app_bot_identifier = $object["app_bot_identifi er"];
            } else {
                return false;
            }
            $direct_identifier = $app_bot_identifier . "+" . $current_user->getId();

        } else {

            $members = [];
            foreach ($object["members"] as $member) {
                if (strlen($member) > 0) {
                    $members[] = $member;
                }
            }
            $members = array_unique($members);
            sort($members);
            $direct_identifier = join("+", $members);

        }


        //No members in direct messages
        if (!$direct_identifier) {
            return false;
        }

        $did_create = false;
        if (!isset($object["id"])) {
            //Search if channel exists for this group of users
            $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("identifier" => $direct_identifier));
            if (!$channel) {
                $did_create = true;
                $channel = new \Twake\Channels\Entity\Channel();
                $channel->setDirect(true);
                $channel->setFrontId($object["front_id"]);

                if (isset($object["app_id"])) {
                    $channel->setAppId($object["app_id"]);
                    $channel->setAppBotIdentifier($app_bot_identifier);
                    $channel->setAppGroupId($object["group_id"]);
                }
            }
        } else {
            $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace_id" => $object["original_workspace"] ? $object["original_workspace"] : ""));
            if (!$channel) {
                return false;
            }
        }

        //Not a direct channel
        if (!($channel->getDirect() && !$channel->getPrivate())) {
            return false;
        }

        //Modifiy $channel
        $channel->setIdentifier($direct_identifier);

        if (!isset($object["app_id"])) {
            $channel->setMembersCount(count($members));
        }

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush($channel);

        if ($did_create) {
            //Init channel with a first message
            $init_message = Array(
                "channel_id" => $channel->getId(),
                "hidden_data" => Array("type" => "init_channel"),
                "content" => "[]"
            );
            $this->messages_service->save($init_message, Array());
        }

        $this->updateChannelMembers($channel, $members, $current_user->getId());


        return $channel->getAsArray();
    }

}
