<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class ChannelSystemAbstract
{
    function __construct($entity_manager)
    {
        $this->entity_manager = $entity_manager;
    }

    public function removeGeneralChannel($object)
    {

        $object = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->find($object["id"]);
        if ($object) {
            $this->entity_manager->remove($object);

            $members = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember")->findBy(Array("channel" => $object));
            foreach ($members as $member) {
                $this->entity_manager->remove($member);
            }

            $this->entity_manager->flush();
        }

        return $object;

    }

    public function updateChannelMembers($channel_entity, $members_ids, $current_user_id = null)
    {

        if ($current_user_id && !in_array($current_user_id, $members_ids)) {
            $members_ids[] = $current_user_id;
        }

        $current_members = $channel_entity->getMembers();

        $membersRepo = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember");
        $usersRepo = $this->entity_manager->getRepository("TwakeUsersBundle:User");

        foreach ($members_ids as $member_id) {
            if (!in_array($member_id, $current_members)) {
                $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($usersRepo->find($member_id), $channel_entity);
                $this->entity_manager->persist($member);
            }
        }

        foreach ($current_members as $member_id) {
            if (!in_array($member_id, $members_ids)) {
                $member = $membersRepo->findOneBy(Array("channel" => $object, "user" => $usersRepo->find($member_id)));
                $this->entity_manager->remove($member);
            }
        }

        $channel_entity->setMembers($members_ids);
        $this->entity_manager->persist($channel_entity);
        $this->entity_manager->flush();

    }

}