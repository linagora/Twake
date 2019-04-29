<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
use WebsiteApi\ChannelsBundle\Entity\ChannelTab;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class ChannelSystemAbstract
{
    function __construct($entity_manager, $applicationsApi = null)
    {
        $this->entity_manager = $entity_manager;
        $this->applicationsApi = $applicationsApi;
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
                $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($member_id, $channel_entity);
                $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                $this->entity_manager->persist($member);
            }
        }

        foreach ($current_members as $member_id) {
            if (!in_array($member_id, $members_ids)) {
                $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $usersRepo->find($member_id)));
                if ($member) {
                    $this->entity_manager->remove($member);
                }
            }
        }

        $channel_entity->setMembers($members_ids);
        $this->entity_manager->persist($channel_entity);
        $this->entity_manager->flush();

    }

    public function updateExtChannelMembers($channel_entity, $ext_members, $current_user_id = null)
    {

        $_ext_members = [];
        $members = $channel_entity->getMembers();
        foreach ($ext_members as $ext_member) {
            if (!in_array($ext_member, $members)) {
                $_ext_members[] = $ext_member;
            }
        }

        $current_ext = $channel_entity->getExtMembers();
        $current_ext = $current_ext ? $current_ext : [];

        $membersRepo = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember");
        $usersRepo = $this->entity_manager->getRepository("TwakeUsersBundle:User");

        $did_something = false;

        foreach ($_ext_members as $member_id) {
            if (!in_array($member_id, $current_ext)) {
                $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($member_id, $channel_entity);
                $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                $member->setExterne(true);
                $this->entity_manager->persist($member);
                $did_something = true;

                //TODO Vérifier que l'utilisateur est bien invité au workspace également

            }
        }

        foreach ($current_ext as $member_id) {
            if (!in_array($member_id, $_ext_members)) {
                $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $usersRepo->find($member_id)));
                if ($member) {
                    $this->entity_manager->remove($member);
                }
                $did_something = true;

                //TODO Si utilisateur invité dans aucun channel, supprimer des invités
            }
        }

        if ($did_something) {
            $channel_entity->setExtMembers($_ext_members);

            $this->entity_manager->persist($channel_entity);
            $this->entity_manager->flush();
        }
    }

    public function updateConnectors($channel_entity, $connectors_ids, $current_user_id = null)
    {


        $current_connectors = $channel_entity->getConnectors();
        $current_connectors = $current_connectors ? $current_connectors : [];

        $did_something = false;

        foreach ($connectors_ids as $connector_id) {
            if (!in_array($connector_id, $current_connectors)) {
                $this->applicationsApi->addResource($connector_id, $channel_entity->getOriginalWorkspaceId(), "channel", $channel_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        foreach ($current_connectors as $current_connector_id) {
            if (!in_array($current_connector_id, $connectors_ids)) {
                $this->applicationsApi->removeResource($connector_id, $channel_entity->getOriginalWorkspaceId(), "channel", $channel_entity->getId(), $current_user_id);
                $did_something = true;
            }
        }

        if ($did_something) {
            $channel_entity->setConnectors($connectors_ids);
            $this->entity_manager->persist($channel_entity);
            $this->entity_manager->flush();
        }

    }

    public function updateTabConfiguration($channel_id, $application_id, $tab_id, $configuration)
    {

        $tab = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            return;
        }
        $tab->setConfiguration($configuration);
        $this->entity_manager->persist($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel_id));
        $cached_tabs = $channel->getTabs();
        foreach ($cached_tabs as $k => $cached_tab) {
            if ($cached_tab["id"] == $tab_id) {
                $cached_tabs[$k] = $tab->getAsArray();
            }
        }
        $channel->setTabs($cached_tabs);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush();

    }

    public function renameTab($channel_id, $application_id, $tab_id, $name)
    {

        $tab = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            return;
        }
        $tab->setName($name);
        $this->entity_manager->persist($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel_id));
        $cached_tabs = $channel->getTabs();
        foreach ($cached_tabs as $k => $cached_tab) {
            if ($cached_tab["id"] == $tab_id) {
                $cached_tabs[$k] = $tab->getAsArray();
            }
        }
        $channel->setTabs($cached_tabs);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush();

    }

    public function removeTab($channel_id, $application_id, $tab_id)
    {

        $tab = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            error_log("deleted");
            return;
        }
        $this->entity_manager->remove($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel_id));
        $cached_tabs = $channel->getTabs();
        $cached_tabs_new = [];
        foreach ($cached_tabs as $cached_tab) {
            if ($cached_tab["id"] != $tab_id) {
                $cached_tabs_new[] = $cached_tab;
            }
        }
        $channel->setTabs($cached_tabs_new);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush();

    }

    public function addTab($channel_id, $application_id, $name)
    {

        $tab = new ChannelTab();
        $tab->setAppId($application_id);
        $tab->setChannelId($channel_id);
        $tab->setName($name);

        $this->entity_manager->persist($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel_id));
        $cached_tabs = $channel->getTabs();
        $cached_tabs[] = $tab->getAsArray();
        $channel->setTabs($cached_tabs);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush();

    }

    public function addAllWorkspaceMember($workspace, $channel)
    {
        if ($workspace && $channel) {

            $wuRepo = $this->entity_manager->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $members = $wuRepo->findBy(Array("workspace" => $workspace));
            $ids = Array();
            foreach ($members as $member) {
                if (!$member->getExterne()) {
                    $ids[] = $member->getUser()->getId();
                }
            }
            $this->updateChannelMembers($channel, $ids);

        }
    }

    public function delWorkspaceMember($workspace, $user)
    {
        $membersRepo = $this->entity_manager->getRepository("TwakeChannelsBundle:ChannelMember");
        $channels = $this->entity_manager->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace_id" => $workspace->getId(), "direct" => false)
        );

        foreach ($channels as $channel_entity) {
            $member = $membersRepo->findOneBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $user));
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
                $member = new \WebsiteApi\ChannelsBundle\Entity\ChannelMember($user->getId(), $channel_entity);
                $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                $this->entity_manager->persist($member);
                $channel_entity->setMembers(array_merge($channel_entity->getMembers(), [$user->getId()]));
                $this->entity_manager->persist($channel_entity);
            }
        }
        $this->entity_manager->flush();
    }

}
