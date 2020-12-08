<?php


namespace Twake\Channels\Services;

use Twake\Channels\Entity\ChannelMember;
use Twake\Discussion\Entity\Channel;
use App\App;

class ChannelsNotificationsSystem extends ChannelSystemAbstract
{

    var $doctrine;
    var $notificationSystem;
    var $pusher;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->notificationSystem = $app->getServices()->get("app.notifications");
        $this->pusher = $app->getServices()->get("app.pusher");
    }

    public function newElement($channel, $sender_application = null, $sender_user = null, $message_as_text = "", $message = null)
    {

        $membersRepo = $this->doctrine->getRepository("Twake\Channels:ChannelMember");
        $userRepo = $this->doctrine->getRepository("Twake\Users:User");

        //TODO:scale:1 This will cause an issue on really big channels (more than 1000 peoples ~ 60s)
        $members = $membersRepo->findBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId()));

        $workspace = $channel->getOriginalWorkspaceId();
        $workspace_ent = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->find($workspace);

        $users_to_notify = [];
        $mentions_types = [];

        foreach ($members as $member) {

            $user_mention = strpos(json_encode($message->getContent()), $member->getUserId()) !== false;
            $here_mention = strpos(json_encode($message->getContent()), "@here") !== false;
            $all_mention = strpos(json_encode($message->getContent()), "@all") !== false;
            $any_mention = $here_mention || $all_mention || $user_mention;
            
            $muted_options = $member->getMuted();
            $mention_level = ($any_mention?1:0) + ($user_mention?1:0); //2 if @user, 1 if only @here

            $muted = true;
            $mention_text = false;
            if($mention_level >= $muted_options){
                $muted = false;
            }

            if (!$muted && (!$sender_user || $member->getUserId() != $sender_user->getId())) {

                $user = $userRepo->find($member->getUserId());

                if($user){

                    if($mention_level === 1){
                        $mention_text = "@".($all_mention?"all":"here");
                    }
                    if($mention_level === 2){
                        $mention_text = "@".$user->getUsername(); 
                    }

                    $member->setLastActivity(new \DateTime());
                    if($mention_text){
                        $member->setLastQuotedMessageId("" . $message->getId());
                        $member->setLastMessagesIncrement($channel->getMessagesIncrement());
                    }
                    
                    $channel_array = $channel->getAsArray();
                    $channel_array["_user_last_quoted_message_id"] = $member->getLastQuotedMessageId();
                    $this->pusher->push(Array("type" => "update", "notification" => Array("channel" => $channel_array)), "notifications/" . $member->getUserId());

                    //Updating workspace and group notifications
                    if (!$channel->getDirect()) {

                        $this->addNotificationOnWorkspace($workspace, $user, false);

                    }

                    if($mention_text){
                        $mentions_types[$mention_text] = $mentions_types[$mention_text] ?: [];
                        $mentions_types[$mention_text][] = $user;
                    }else{
                    $users_to_notify[] = $user;
                    }

                }

            }
            
            $this->doctrine->persist($member);
        }

        $this->notificationSystem->pushNotification(
            null,
            $sender_application,
            $sender_user,
            $workspace_ent,
            $channel,
            $users_to_notify,
            "channel_" . $channel->getId(),
            $message_as_text,
            $message,
            Array(),
            Array("push"),
            true
        );

        foreach($mentions_types as $mention_text => $users){
            error_log($mention_text);
            $this->notificationSystem->pushNotification(
                null,
                $sender_application,
                $sender_user,
                $workspace_ent,
                $channel,
                $users,
                "channel_" . $channel->getId(),
                "@".ltrim($mention_text, "@").": ".$message_as_text,
                $message,
                Array(),
                Array("push"),
                true
            );
        }

        $this->doctrine->persist($channel);

        $this->doctrine->flush();

    }

    public function addNotificationOnWorkspace($workspace_id, $user, $flush = true)
    {

        if (!$workspace_id) {
            return false;
        }

        //TODO also check all links of this channel when implemented
        if ($workspace_id && $user) {

            $workspaceUsers = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
            $workspaceUser = $workspaceUsers->findOneBy(Array("workspace_id" => $workspace_id, "user_id" => $user->getId()));

            if ($workspaceUser && !$workspaceUser->getHasNotifications()) {
                $workspaceUser->setHasNotifications(true);
                $this->doctrine->persist($workspaceUser);
                $this->pusher->push(Array("type" => "update", "notification" => Array("workspace_id" => $workspaceUser->getWorkspaceId(), "hasnotifications" => true)), "notifications/" . $user->getId());

                $groupUsers = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
                $groupUser = $groupUsers->findOneBy(Array("group" => $workspaceUser->getWorkspace($this->doctrine)->getGroup(), "user" => $user));

                if ($groupUser && !$groupUser->getHasNotifications()) {
                    $groupUser->setHasNotifications(true);
                    $this->doctrine->persist($groupUser);
                    $this->pusher->push(Array("type" => "update", "notification" => Array("group_id" => $workspaceUser->getWorkspace($this->doctrine)->getGroup()->getId(), "hasnotifications" => true)), "notifications/" . $user->getId());
                }

            }

        }

        if ($flush) {
            $this->doctrine->flush();
        }

        return true;

    }

    public function unread($channel, $user)
    {

        if (is_string($channel)) {
            $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel));
        }

        if (!$channel) {
            return false;
        }

        $membersRepo = $this->doctrine->getRepository("Twake\Channels:ChannelMember");
        /**
         * @var $member ChannelMember
         */
        $member = $membersRepo->findOneBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId(), "user_id" => $user->getId()));

        $member->setLastMessagesIncrement($channel->getMessagesIncrement() - 1);
        $member->setLastQuotedMessageId("force_unread");
        $member->setLastMessagesIncrement($channel->getMessagesIncrement());

        $array = $channel->getAsArray();
        $array["_user_last_message_increment"] = $member->getLastMessagesIncrement();
        $array["_user_last_quoted_message_id"] = $member->getLastQuotedMessageId();
        $array["_user_last_access"] = $member->getLastAccess() ? $member->getLastAccess()->getTimestamp() : 0;
        $this->pusher->push(Array("type" => "update", "notification" => Array("channel" => $array)), "notifications/" . $user->getId());

        if ($channel->getOriginalWorkspaceId()) {
            $this->addNotificationOnWorkspace($channel->getOriginalWorkspaceId(), $user, false);
        }

        $this->doctrine->persist($member);
        $this->doctrine->flush();

        return true;

    }

    public function read($channel, $user)
    {

        if (is_string($channel)) {
            $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel));
        }

        if (!$channel || !$user) {
            return false;
        }

        $this->notificationSystem->removeMailReminder($user);

        $membersRepo = $this->doctrine->getRepository("Twake\Channels:ChannelMember");
        /**
         * @var $member ChannelMember
         */
        $member = $membersRepo->findOneBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId(), "user_id" => $user->getId()));

        if (!$member) {
            return false;
        }

        $member->setLastMessagesIncrement($channel->getMessagesIncrement());
        $member->setLastAccess(new \DateTime());
        $member->setLastQuotedMessageId("");

        $array = $channel->getAsArray();
        $array["_user_last_message_increment"] = $member->getLastMessagesIncrement();
        $array["_user_last_quoted_message_id"] = $member->getLastQuotedMessageId();
        $array["_user_last_access"] = $member->getLastAccess() ? $member->getLastAccess()->getTimestamp() : 0;
        $this->pusher->push(Array("type" => "update", "notification" => Array("channel" => $array)), "notifications/" . $user->getId());

        //Verify workspaces and groups
        if ($channel->getOriginalWorkspaceId()) {
            $this->checkReadWorkspace($channel->getOriginalWorkspaceId(), $user, false);
        } else {
            $this->countBadge($user);
        }

        $this->doctrine->persist($member);
        $this->doctrine->flush();

        return true;

    }

    public function checkReadWorkspace($workspace_id, $user, $flush = true)
    {

        if (!$workspace_id) {
            return false;
        }

        $this->notificationSystem->removeMailReminder($user);

        $workspaceUsers = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $workspaceUser = $workspaceUsers->findOneBy(Array("workspace_id" => $workspace_id, "user_id" => $user->getId()));

        $all_read = true;
        if ($workspaceUser && $workspaceUser->getHasNotifications()) {

            $channels = $this->doctrine->getRepository("Twake\Channels:Channel")->findBy(
                Array("original_workspace_id" => $workspace_id, "direct" => false)
            );
            //TODO check also linked channels in workspace when implemented
            foreach ($channels as $_channel) {
                $link = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findOneBy(
                    Array("direct" => false, "channel_id" => $_channel->getId(), "user_id" => $user->getId())
                );
                if ($link && $link->getLastMessagesIncrement() < $_channel->getMessagesIncrement()) {
                    if($link->getLastQuotedMessageId() || $link->getMuted() == 0){
                        $all_read = false;
                        break;
                    }
                }
            }
        }

        if ($all_read) {
            //Mark workspace as read
            if ($workspaceUser && $workspaceUser->getHasNotifications()) {
                $workspaceUser->setHasNotifications(false);
                $this->doctrine->persist($workspaceUser);
                $this->pusher->push(Array("type" => "update", "notification" => Array("workspace_id" => $workspace_id, "hasnotifications" => false)), "notifications/" . $user->getId());
            }

            $groupId = $workspaceUser->getWorkspace($this->doctrine)->getGroup()->getId();

            $groupUsers = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
            $groupUser = $groupUsers->findOneBy(Array("group" => $groupId, "user" => $user));

            $all_read = true;

            if ($groupUser && $groupUser->getHasNotifications()) {
                $workspacesUser = $workspaceUsers->findBy(Array("user_id" => $user->getId()));

                foreach ($workspacesUser as $workspaceUser) {
                    if ($workspaceUser->getHasNotifications()) {
                        $workspace = $workspaceUser->getWorkspace($this->doctrine);
                        if ($workspace->getGroup()->getId() == $groupId) {
                            $all_read = false;
                            break;
                        }
                    }
                }
            }

            if ($all_read) {
                if ($groupUser && $groupUser->getHasNotifications()) {
                    $groupUser->setHasNotifications(false);
                    $this->doctrine->persist($groupUser);
                    $this->pusher->push(Array("type" => "update", "notification" => Array("group_id" => $groupId, "hasnotifications" => false)), "notifications/" . $user->getId());
                }

                //Test if all workspaces are readed
                $this->countBadge($user);


            }

        }

        if ($flush) {
            $this->doctrine->flush();
        }

        return true;

    }

    public function countBadge($user)
    {
        $workspaceUsers = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");

        $all_read = true;
        $workspacesUser = $workspaceUsers->findBy(Array("user_id" => $user->getId()));
        foreach ($workspacesUser as $workspaceUser) {
            if ($workspaceUser->getHasNotifications()) {
                $all_read = false;
                break;
            }
        }
        if ($all_read) {
            $this->notificationSystem->updateDeviceBadge($user, 0);
        }

    }

    public function mute($channel, $state, $user)
    {

        if (is_string($channel)) {
            $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $channel));
        }

        if (!$channel) {
            return false;
        }

        $membersRepo = $this->doctrine->getRepository("Twake\Channels:ChannelMember");
        $member = $membersRepo->findOneBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId(), "user_id" => $user->getId()));

        $member->setMuted($state);
        $this->doctrine->flush();

        return true;

    }

}
