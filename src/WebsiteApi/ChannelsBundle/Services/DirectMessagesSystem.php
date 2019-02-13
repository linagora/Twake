<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class DirectMessagesSystem extends ChannelSystemAbstract
{

    function __construct($entity_manager)
    {
        parent::__construct($entity_manager);
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
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

        $member = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember")->findBy(
            Array("user" => $current_user, "direct" => true)
//            Array("last_activity" => "DESC"),
//            isset($options["max"]) ? $options["max"] : 20,
//            isset($options["offset"]) ? $options["offset"] : 0
        );

        $result = [];
        foreach ($member as $link) {
            if ($link->getChannel()) {
                $result[] = $link->getChannel()->getAsArray();
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

        $members = $object["members"];
        $members = array_unique($members);
        sort($members);
        $direct_identifier = join("+", $members);

        //No members in direct messages
        if (!$direct_identifier) {
            return false;
        }

        if (!isset($object["id"])) {
            //Search if channel exists for this group of users
            $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("identifier" => $direct_identifier));
            if (!$channel) {
                $channel = new \WebsiteApi\ChannelsBundle\Entity\Channel();
                $channel->setDirect(true);
                $channel->setFrontId($object["front_id"]);
            }
        } else {
            $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace" => $object["original_workspace"]));
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
        $channel->setMembersCount(count($members));

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush($channel);

        $this->updateChannelMembers($channel, $members, $current_user->getId());

        return $channel->getAsArray();
    }

}