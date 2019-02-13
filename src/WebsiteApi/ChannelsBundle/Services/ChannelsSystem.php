<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class ChannelsSystem extends ChannelSystemAbstract
{

    function __construct($entity_manager)
    {
        parent::__construct($entity_manager);
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in CoreBundle/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        //TODO
        return true;
    }

    public function hasAccess($data, $current_user = null)
    {
        $group = $data["group_id"];
        $workspace = $data["workspace_id"];
        //TODO
        return true;
    }

    public function get($options, $current_user)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $workspace_id = $options["workspace_id"];

        $channels = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace" => $workspace_id, "direct" => false)
        );

        $result = [];
        foreach ($channels as $channel) {
            $ok = true;
            if ($channel->getPrivate()) {
                $res = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember")->findOneBy(Array("user" => $current_user, "channel" => $channel));
                if (!$res) {
                    $ok = false;
                }
            }
            if ($ok) {
                $result[] = $channel->getAsArray();
            }
        }

        return $result;
    }

    public function remove($object, $options, $current_user)
    {
        $options["workspace_id"] = $object["original_workspace"];
        $options["group_id"] = $object["original_group"];
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        return $this->removeGeneralChannel($object);
    }

    public function save($object, $options, $current_user)
    {
        $options["workspace_id"] = $object["original_workspace"];
        $options["group_id"] = $object["original_group"];
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $members = isset($object["members"]) ? $object["members"] : [];
        $members = array_unique($members);
        sort($members);


        if (!isset($object["id"])) {

            if (!$object["original_group"] || !$object["original_workspace"]) {
                return false;
            }

            $group = $this->entity_manager->getRepository("TwakeWorkspacesBundle:Group")->find($object["original_group"]);
            $workspace = $this->entity_manager->getRepository("TwakeWorkspacesBundle:Workspace")->find($object["original_workspace"]);

            $channel = new \WebsiteApi\ChannelsBundle\Entity\Channel();
            $channel->setDirect(false);
            $channel->setFrontId($object["front_id"]);

            $channel->setOriginalGroup($group);
            $channel->setOriginalWorkspace($workspace);

        } else {
            $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace" => $object["original_workspace"]));
            if (!$channel) {
                return false;
            }
        }

        //Not a direct channel
        if ($channel->getDirect()) {
            return false;
        }

        //Modifiy $channel
        $channel->setMembersCount(count($members));
        $channel->setName($object["name"]);
        $channel->setIcon($object["icon"]);
        $channel->setDescription($object["description"]);
        $channel->setChannelGroupName($object["channel_group_name"]);
        $channel->setPrivate($object["private"]);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush($channel);

        $this->updateChannelMembers($channel, $members, $current_user->getId());

        return $channel->getAsArray();
    }

}