<?php


namespace Twake\Channels\Services;

use Twake\Core\Services\StringCleaner;
use Twake\Discussion\Entity\Channel;
use App\App;

class ChannelsSystem extends ChannelSystemAbstract 
{

    public function __construct(App $app)
    {
        $this->access_manager = $app->getServices()->get("app.accessmanager");
        $this->messages_service = $app->getServices()->get("app.messages");
        $this->websockets_service = $app->getServices()->get("app.websockets");
        parent::__construct($app);
    }

    /** Called from Collections manager to verify user has access to websockets room, registered in Core/Services/Websockets.php */
    public function init($route, $data, $current_user = null)
    {
        $route = explode("/", $route);
        $workspace_id = isset($route[2]) ? $route[2] : null;

        return $this->hasAccess([
            "workspace_id" => $workspace_id
        ], $current_user);
    }

    public function hasAccess($data, $current_user = null)
    {
        if ($current_user === null) {
            return true;
        }
        if (!is_string($current_user)) {
            $current_user = $current_user->getId();
        }

        if (empty($data["id"])) {
            return $this->access_manager->has_access($current_user, [
                "type" => "Workspace",
                "edition" => false,
                "object_id" => $data["workspace_id"] ?: $data["original_workspace"]
            ]);
        }

        return $this->access_manager->has_access($current_user, [
            "type" => "Channel",
            "edition" => true,
            "object_id" => $data["id"]
        ]);
    }

    public function get($options, $current_user)
    {
        if (!$this->hasAccess($options, $current_user)) {
            return false;
        }

        $workspace_id = $options["workspace_id"];

        $channels = $this->entity_manager->getRepository("Twake\Channels:Channel")->findBy(
            Array("original_workspace_id" => $workspace_id, "direct" => false)
        );

        $result = [];
        foreach ($channels as $channel) {
            if (!$current_user || !$channel) {
                continue;
            }
            $res = $this->entity_manager->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $current_user->getId(), "channel_id" => $channel->getId()));
            if ($res) {
                $tmp = $channel->getAsArray();
                $tmp["_user_last_message_increment"] = $res->getLastMessagesIncrement();
                $tmp["_user_last_quoted_message_id"] = $res->getLastQuotedMessageId();
                $tmp["_user_last_access"] = $res->getLastAccess() ? $res->getLastAccess()->getTimestamp() : null;
                $tmp["_user_muted"] = $res->getMuted();
                $result[] = $tmp;
            }
        };

        return $result;
    }

    public function remove($object, $options, $current_user = null)
    {
        if (!$this->hasAccess($object, $current_user)) {
            return false;
        }


        return $this->removeGeneralChannel($object);
    }

    public function save($object, $options, $current_user)
    {
        if (!$this->hasAccess($object, $current_user)) {
            error_log("no access " . $object["id"]);
            return false;
        }

        $did_create = false;

        $members = isset($object["members"]) ? $object["members"] : [];
        $members = array_unique($members);
        sort($members);


        //Create or find channel
        if (!isset($object["id"])) {

            if (!$object["original_group"] || !$object["original_workspace"]) {
                return false;
            }

            $group = $this->entity_manager->getRepository("Twake\Workspaces:Group")->find($object["original_group"]);
            $workspace = $this->entity_manager->getRepository("Twake\Workspaces:Workspace")->find($object["original_workspace"]);

            $channel = new \Twake\Channels\Entity\Channel();
            $channel->setDirect(false);
            $channel->setFrontId($object["front_id"]);

            $channel->setOriginalGroupId($group->getId());
            $channel->setOriginalWorkspaceId($workspace->getId());

            $did_create = true;

        } else {
            $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->find(Array("id" => $object["id"], "direct" => $object["direct"], "original_workspace_id" => $object["original_workspace"]));
            if (!$channel) {
                return false;
            }
        }

        //It should not be a direct channel
        if ($channel->getDirect()) {
            return false;
        }


        //Modifiy channel details
        $channel->setMembersCount(count($members));
        $channel->setName($object["name"]);
        $channel->setIcon($object["icon"]);
        $channel->setDescription($object["description"]);
        $channel->setChannelGroupName($object["channel_group_name"]);


        //Manage private or not private status
        $add_everybody = false;
        if ($channel->getPrivate() && !$object["private"]) {
            $add_everybody = true;
        }

        $channel->setPrivate($object["private"]);

        $this->entity_manager->persist($channel);
        $this->entity_manager->flush($channel);


        //Private and non private users management
        if ($channel->getPrivate()) {
            $this->updateChannelMembers($channel, $members, $current_user->getId());
        }
        if (($did_create || $add_everybody) && !$channel->getPrivate()) {
            if (!$workspace) {
                $workspace = $this->entity_manager->getRepository("Twake\Workspaces:Workspace")->find($object["original_workspace"]);
            }
            $this->addAllWorkspaceMember($workspace, $channel);
        }


        //Add external members
        if (isset($object["ext_members"])) {
            $ext_members = $object["ext_members"];
            $this->updateExtChannelMembers($channel, $ext_members, $current_user->getId());
        }


        //Manage connectors
        if (!$channel->getAppId() && isset($object["connectors"])) {
            $connectors = $object["connectors"];
            $this->updateConnectors($channel, $connectors, $current_user ? $current_user->getId() : null);
        }


        //Tabs
        $tab = null;
        if (isset($object["_once_save_tab"])) {
            if (isset($object["_once_save_tab"]["id"]) && $object["_once_save_tab"]["id"]) {
                $this->renameTab($channel->getId(), $object["_once_save_tab"]["app_id"], $object["_once_save_tab"]["id"], $object["_once_save_tab"]["name"]);
            } else {
                $tab = $this->addTab($channel->getId(), $object["_once_save_tab"]["app_id"], $object["_once_save_tab"]["name"]);
            }
        }
        if (isset($object["_once_remove_tab"])) {
            $this->removeTab($channel->getId(), $object["_once_remove_tab"]["app_id"], $object["_once_remove_tab"]["id"]);
        }
        if (isset($object["_once_save_tab_config"])) {
            $tab_id = $object["_once_save_tab_config"]["id"];
            if($tab && !$tab_id){
                $tab_id = $tab->getId();
            }
            $this->updateTabConfiguration($channel->getId(), $object["_once_save_tab_config"]["app_id"], $tab_id, $object["_once_save_tab_config"]["configuration"]);
        }

        //Send first message if created channel
        if ($did_create) {
            //Init channel with a first message
            $init_message = Array(
                "channel_id" => $channel->getId(),
                "hidden_data" => Array("type" => "init_channel"),
                "content" => "[]"
            );
            $this->messages_service->save($init_message, Array());
        }

        return $channel->getAsArray();

    }

    public function getApplicationChannel($application, $workspace)
    {

        $identifier = "app_" . $application->getId() . "+ws_" . $workspace->getId();

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(
            Array("identifier" => $identifier)
        );

        if (!$channel) {

            $channel = new \Twake\Channels\Entity\Channel();
            $channel->setDirect(false);
            $channel->setApplication(true);

            $channel->setOriginalGroupId($workspace->getGroup()->getId());
            $channel->setOriginalWorkspaceId($workspace->getId());

            $channel->setAppId($application->getId());
            $channel->setIdentifier($identifier);

            $did_create = true;

            $this->entity_manager->persist($channel);
            $this->entity_manager->flush();

        }

        if ($channel->getPrivate()) {
            $this->updateChannelMembers($channel, $members);
        }

        if ($did_create && !$channel->getPrivate()) {
            $this->addAllWorkspaceMember($workspace, $channel);
        }

        $event = Array(
            "client_id" => "system",
            "action" => "save",
            "object_type" => "",
            "object" => $channel->getAsArray()
        );
        $this->websockets_service->push("channels/workspace/" . $workspace->getId(), $event);

        return $channel;

    }

    public function removeApplicationChannel($application, $workspace)
    {
        $identifier = "app_" . $application->getId() . "+ws_" . $workspace->getId();

        $channel = $this->entity_manager->getRepository("Twake\Channels:Channel")->findOneBy(
            Array("identifier" => $identifier)
        );

        if ($channel) {

            $event = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $channel->getFrontId()
            );
            $this->websockets_service->push("channels/workspace/" . $workspace->getId(), $event);

            $this->entity_manager->remove($channel);
            $this->entity_manager->flush();

            return true;
        }

        return false;
    }

    public function search($words, $workspaces, $current_user_id)
    {

        $terms = Array();
        $should_workspaces = Array();
        foreach ($words as $word) {
            $st = new StringCleaner();
            $word = $st->simplifyInArray($word);
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "name" => ".*" . $word . ".*"
                        )
                    )
                )
            );
        }

        foreach ($workspaces as $workspace) {
            $should_workspaces[] = Array(
                "match_phrase" => Array(
                    "workspace_id" => $workspace["id"]
                )
            );
        }

        $options = Array(
            "repository" => "Twake\Channels:Channel",
            "index" => "channel",
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        "bool" => Array(
                            "filter" => Array(
                                "match_phrase" => Array(
                                    "members" => $current_user_id
                                )
                            ),
                            "should" => Array(
                                $should_workspaces
                            ),
                            "minimum_should_match" => 1,
                            "must" => Array(
                                "bool" => Array(
                                    "should" => Array(
                                        $terms
                                    ),
                                    "minimum_should_match" => 1
                                )
                            )
                        )
                    )
                )
            ),
            "sort" => Array(
                "last_activity" => Array(
                    "order" => "desc"
                )
            )
        );

        $channels = $this->entity_manager->es_search($options);

        $result = [];
        foreach ($channels["result"] as $channel) {
            $result[] = Array($channel[0]->getAsArray(), $channel[1][0]);
        }

        return $result;

    }

    public function searchprivate($words, $current_user_id)
    {

        $terms = Array();
        foreach ($words as $word) {
            $st = new StringCleaner();
            $word = $st->simplifyInArray($word);
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "name" => ".*" . $word . ".*"
                        )
                    )
                )
            );
        }

        $options = Array(
            "repository" => "Twake\Channels:Channel",
            "index" => "channel",
            "query" => Array(
                "bool" => Array(
                    "filter" => Array(
                        "match_phrase" => Array(
                            "members" => $current_user_id
                        )
                    ),
                    "should" => Array(
                        $terms
                    ),
                    "minimum_should_match" => 2
                )
            ),
            "sort" => Array(
                "last_activity" => Array(
                    "order" => "desc"
                )
            )
        );

        $channels = $this->entity_manager->es_search($options);

        $result = [];
        foreach ($channels["result"] as $channel) {
            $result[] = Array($channel[0]->getAsArray(), $channel[1][0]);
        }

        return $result;

    }
}
