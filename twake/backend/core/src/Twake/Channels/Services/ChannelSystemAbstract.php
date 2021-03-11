<?php


namespace Twake\Channels\Services;

use Twake\Channels\Entity\ChannelTab;
use Twake\Discussion\Entity\Channel;
use App\App;

class ChannelSystemAbstract
{
    private $workspaceUser;

    public function __construct(App $app)
    {
        $this->entity_manager = $app->getServices()->get("app.twake_doctrine");
        $this->applicationsApi = $app->getServices()->get("app.applications_api");
        $this->workspaceUser = $app->getServices()->get("app.workspace_members");
    }

    public function removeGeneralChannel($object)
    {

        $object = $this->entity_manager->getRepository("Twake\Channels:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace_id" => $object["original_workspace"]));
        if ($object) {
            $this->entity_manager->remove($object);

            $members = $this->entity_manager->getRepository("Twake\Channels:ChannelMember")->findBy(Array("channel_id" => $object->getId()));
            foreach ($members as $member) {
                $this->entity_manager->remove($member);
                $linkWorkspaceUser = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace_id" => $object->getOriginalWorkspaceId(), "user_id" => $member->getUserId()));
                if ($linkWorkspaceUser && $linkWorkspaceUser->getExterne() && !$linkWorkspaceUser->getAutoAddExterne()) {
                    $this->removeExterneIfNotAnymoreInChannel($object->getOriginalWorkspaceId(), $object->getId(), $member->getUserId());
                }
            }


            $this->entity_manager->flush();
        }

        return $object;

    }

    public function removeExterneIfNotAnymoreInChannel($workspaceId, $channelId, $userId)
    {
        $channel_in_current_workspace = $this->entity_manager->getRepository("Twake\Channels:Channel")->findBy(Array("direct" => false, "original_workspace_id" => $workspaceId));
        $isInChannel = false;
        foreach ($channel_in_current_workspace as $chan) {
            $link_user_channel = $this->entity_manager->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => 0, "user_id" => $userId, "channel_id" => $chan->getId()));
            if ($link_user_channel && $link_user_channel->getChannelId() != $channelId) {
                $isInChannel = true;
                break;
            }
        }
        if (!$isInChannel) {
            $linkUserWorkspace = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace_id" => $workspaceId, "user_id" => $userId));
            if ($linkUserWorkspace) {
                $this->workspaceUser->removeMember($workspaceId, $userId);
            }
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

        $tab = $this->entity_manager->getRepository("Twake\Channels:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            return;
        }
        $tab->setConfiguration($configuration);
        $this->entity_manager->persist($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));
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

        $tab = $this->entity_manager->getRepository("Twake\Channels:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            return;
        }
        $tab->setName($name);
        $this->entity_manager->persist($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));
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

        $tab = $this->entity_manager->getRepository("Twake\Channels:ChannelTab")->findOneBy(Array("channel_id" => $channel_id, "app_id" => $application_id, "id" => $tab_id));
        if (!$tab) {
            return;
        }
        $this->entity_manager->remove($tab);
        $this->entity_manager->flush();

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));
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

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel_id));
        $cached_tabs = $channel->getTabs();
        $cached_tabs[] = $tab->getAsArray();
        $channel->setTabs($cached_tabs);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush();

        return $tab;

    }

    public function addAllWorkspaceMember($workspace, $channel)
    {
        if ($workspace && $channel) {

            $wuRepo = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser");
            $members = $wuRepo->findBy(Array("workspace_id" => $workspace->getId()));
            $idsMembers = Array();
            $idsExt = Array();
            foreach ($members as $member) {
                if($member->getUser($this->entity_manager)){
                    if (!$member->getExterne()) {
                        $idsMembers[] = $member->getUser($this->entity_manager)->getId();
                    } elseif ($member->getAutoAddExterne()) {
                        $idsExt[] = $member->getUser($this->entity_manager)->getId();
                    }
                }
            }
            $this->updateChannelMembers($channel, $idsMembers);
            $this->updateExtChannelMembers($channel, $idsExt);

        }
    }

    public function updateChannelMembers($channel_entity, $members_ids, $current_user_id = null)
    {

        if ($current_user_id && !in_array($current_user_id, $members_ids)) {
            $members_ids[] = $current_user_id;
        }

        $members_ids = array_unique($members_ids);
        $final_members_ids = [];

        $current_members = $channel_entity->getMembers();

        $membersRepo = $this->entity_manager->getRepository("Twake\Channels:ChannelMember");
        $usersRepo = $this->entity_manager->getRepository("Twake\Users:User");

        foreach ($members_ids as $member_id) {
            if (!in_array($member_id, $current_members)) {
                //Check if user is in workspace
                $canBeAdded = true;
                if(!$channel_entity->getDirect()){
                    $wuRepo = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser");
                    $canBeAdded = !!$wuRepo->findBy(Array("workspace_id" => $channel_entity->getOriginalWorkspaceId()."", "user_id" => $member_id.""));
                }
                if($canBeAdded){
                    $member = new \Twake\Channels\Entity\ChannelMember($member_id . "", $channel_entity);
                    $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                    $this->entity_manager->persist($member);
                    $final_members_ids[] = $member_id;
                }
            }else{
                $final_members_ids[] = $member_id;
            }
        }

        foreach ($current_members as $member_id) {
            if (!in_array($member_id, $members_ids)) {
                $members = $membersRepo->findBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $usersRepo->find($member_id)));
                foreach ($members as $member) {
                    $this->entity_manager->remove($member);
                }
            }
        }

        $channel_entity->setMembers($final_members_ids);
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
        if (!$channel_entity->getPrivate()) {
            // si le channel n'est pas privé, on rajoute tous les autoadd
            $membersWorkspace = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("workspace_id" => $channel_entity->getOriginalWorkspaceId()));
            foreach ($membersWorkspace as $members) {
                try{
                    if ($members->getAutoAddExterne() && !in_array($members->getUserId(), $_ext_members)) {
                        $_ext_members[] = $members->getUserId();
                    }
                }catch(\Exception $err){
                    //No user
                }
            }

        }


        $current_ext = $channel_entity->getExtMembers();
        $current_ext = $current_ext ? $current_ext : [];

        $membersRepo = $this->entity_manager->getRepository("Twake\Channels:ChannelMember");
        $usersRepo = $this->entity_manager->getRepository("Twake\Users:User");

        $did_something = false;

        foreach ($_ext_members as $member) {
            // dans le cas où c'est un id
            if (strrpos($member, "@") <= 0) {
                if (!in_array($member, $current_ext)) {
                    $member_id = $member;
                    $user = $usersRepo->findOneBy(Array("id" => $member_id));
                    if ($user) {
                        $this->addUserToChannel($user, $channel_entity);
                        $did_something = true;
                    }
                }
            } else {
                // dans le cas où c'est une adresse mail
                $mail = $member;
                if (!in_array($mail, $current_ext)) {
                    $user = $this->entity_manager->getRepository("Twake\Users:User")->findOneBy(Array("emailcanonical" => $mail));
                    if ($user && !in_array($user->getId(), $current_ext)) {
                        $_ext_members[array_search($mail, $_ext_members)] = $user->getId();
                        $this->addUserToChannel($user, $channel_entity);
                        $did_something = true;
                    } else {
                        $secondMail = $this->entity_manager->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail));
                        if ($secondMail && !in_array($secondMail->getUserId(), $current_ext)) {
                            // c'est un email secondaire
                            $user_id = $secondMail->getUserId();
                            $_ext_members[array_search($mail, $_ext_members)] = $user_id;
                            $this->addUserToChannel($user, $channel_entity);
                            $did_something = true;
                        } else {
                            $member = new \Twake\Channels\Entity\ChannelMember($mail, $channel_entity);
                            $member->setLastMessagesIncrement($channel_entity->getMessagesIncrement());
                            $member->setExterne(true);
                            $this->entity_manager->persist($member);
                            $this->workspaceUser->addMemberByMail($channel_entity->getOriginalWorkspaceId(), $mail, true, $current_user_id);
                            $did_something = true;
                        }
                    }

                }

            }
        }

        foreach ($current_ext as $member_id) {
            if (!in_array($member_id, $_ext_members)) {
                $members = $membersRepo->findBy(Array("direct" => $channel_entity->getDirect(), "channel_id" => $channel_entity->getId(), "user_id" => $member_id));
                foreach ($members as $member) {
                    $this->entity_manager->remove($member);
                    $this->removeExterneIfNotAnymoreInChannel($channel_entity->getOriginalWorkspaceId(), $channel_entity->getId(), $member_id);
                    // vérifier si l'utilisateur est dans un autre channel
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

    public function addUserToChannel($user, $channel)
    {
        if(!$user || is_string($user) === 'string'){
            return false;
        }
        $link = $this->entity_manager->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $user->getId(), "channel_id" => $channel->getId()));
        if (!$link) {
            $member = new \Twake\Channels\Entity\ChannelMember($user->getId(), $channel);
            $member->setLastMessagesIncrement($channel->getMessagesIncrement());
            $member->setExterne(true);
            $this->entity_manager->persist($member);

            $workspace_id = $channel->getOriginalWorkspaceId();
            $link = $this->entity_manager->getRepository("Twake\Workspaces:WorkspaceUser")->findBy(Array("workspace_id" => $workspace_id, "user_id" => $user->getId()));
            if (!$link) {
                $this->workspaceUser->addMember($workspace_id, $user->getId(), true);
            }
        }
        return true;
    }


}
