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

        $object = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace_id" => $object["original_workspace"]));
        if ($object) {
            $this->entity_manager->remove($object);

            $members = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember")->findBy(Array("channel_id" => $object->getId()));
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
                $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user" => $usersRepo->find($member_id)));
                $this->entity_manager->remove($member);
            }
        }

        $channel_entity->setMembers($members_ids);
        $this->entity_manager->persist($channel_entity);
        $this->entity_manager->flush();

    }

    public function addAllWorkspaceMember($workspace, $channel)
    {
        if ($workspace && $channel) {

            $wuRepo = $this->entity_manager->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $members = $wuRepo->findBy(Array("workspace" => $workspace));
            $ids = Array();
            foreach ($members as $member) {
                $ids[] = $member->getUser()->getId();
            }
            $this->updateChannelMembers($channel, $ids);

        }
    }

    public function delWorkspaceMember($workspace, $user)
    {
        $channels = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace_id" => $workspace->getId(), "direct" => false)
        );

        foreach ($channels as $channel_entity) {
            $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user" => $user));
            $this->entity_manager->remove($member);
            $channel_entity->setMembers(array_diff($channel_entity->getMembers(), [$user->getId()]));
            $this->entity_manager->persist($channel_entity);
        }
        $this->entity_manager->flush();
    }

    public function addWorkspaceMember($workspace, $user)
    {
        $channels = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace_id" => $workspace->getId(), "direct" => false)
        );

        foreach ($channels as $channel_entity) {
            if (!$channel_entity->getPrivate()) {
                $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($user, $channel_entity);
                $this->entity_manager->persist($member);
                $channel_entity->setMembers(array_merge($channel_entity->getMembers(), [$user->getId()]));
                $this->entity_manager->persist($channel_entity);
            }
        }
        $this->entity_manager->flush();
    }

}