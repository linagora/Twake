<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\ChannelsBundle\Entity\ChannelMember;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class ChannelsNotificationsSystem extends ChannelSystemAbstract
{

    var $doctrine;
    var $notificationSystem;
    var $pusher;

    function __construct($doctrine, $notificationSystem, $pusher)
    {
        $this->doctrine = $doctrine;
        $this->notificationSystem = $notificationSystem;
        $this->pusher = $pusher;
    }

    public function newElement($channel)
    {

        $channel->setLastActivity(new \DateTime());
        $channel->setMessagesIncrement($channel->getMessagesIncrement() + 1);

        $membersRepo = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember");
        /**
         * @var $members ChannelMember[]
         */
        $members = $membersRepo->findBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId()));

        foreach ($members as $member) {


            if (!$member->getMuted()) {
                $member->setLastActivity(new \DateTime());


                $this->pusher->push(Array("type" => "update", "notification" => Array("channel" => $channel->getAsArray())), "notifications/" . $member->getUser()->getId());

                //Updating workspace and group notifications
                if (!$channel->getDirect()) {


                    $workspace = $channel->getOriginalWorkspaceId();

                    //TODO also check all links of this channel when implemented
                    if ($workspace) {

                        $workspaceUsers = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
                        $workspaceUser = $workspaceUsers->findOneBy(Array("workspace" => $workspace, "user" => $member->getUser()));

                        if ($workspaceUser && !$workspaceUser->getHasNotifications()) {
                            $workspaceUser->setHasNotifications(true);
                            $this->doctrine->persist($workspaceUser);
                            $this->pusher->push(Array("type" => "update", "notification" => Array("workspace_id" => $workspaceUser->getWorkspace()->getId(), "hasnotifications" => true)), "notifications/" . $member->getUser()->getId());

                            $groupUsers = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
                            $groupUser = $groupUsers->findOneBy(Array("group" => $workspaceUser->getWorkspace()->getGroup(), "user" => $member->getUser()));

                            if ($groupUser && !$groupUser->getHasNotifications()) {
                                $groupUser->setHasNotifications(true);
                                $this->doctrine->persist($groupUser);
                                $this->pusher->push(Array("type" => "update", "notification" => Array("group_id" => $workspaceUser->getWorkspace()->getGroup()->getId(), "hasnotifications" => true)), "notifications/" . $member->getUser()->getId());
                            }

                        }

                    }

                }

                //TODO Send notification via notification service

            } else {
                $member->setLastMessagesIncrement($channel->getMessagesIncrement());
            }
            $this->doctrine->persist($member);
        }

        $this->doctrine->persist($channel);

        $this->doctrine->flush();

    }

    public function read($channel, $user)
    {

        $membersRepo = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember");
        /**
         * @var $member ChannelMember
         */
        $member = $membersRepo->findOneBy(Array("direct" => $channel->getDirect(), "channel_id" => $channel->getId(), "user" => $user));

        $member->setLastMessagesIncrement($channel->getMessagesIncrement());
        $member->setLastAccess(new \DateTime());

        $array = $channel->getAsArray();
        $array["_user_last_message_increment"] = $member->getLastMessagesIncrement();
        $array["_user_last_access"] = $member->getLastAccess() ? $member->getLastAccess()->getTimestamp() : 0;
        $this->pusher->push(Array("type" => "update", "notification" => Array("channel" => $array)), "notifications/" . $user->getId());

        //Verify workspaces and groups
        $this->checkReadWorkspace($channel->getOriginalWorkspaceId(), $user, false);

        $this->doctrine->persist($member);
        $this->doctrine->flush();

    }

    public function checkReadWorkspace($workspace_id, $user, $flush = true)
    {

        if (!$workspace_id) {
            return;
        }

        $all_read = true;

        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(
            Array("original_workspace_id" => $workspace_id, "direct" => false)
        );
        //TODO check also linked channels in workspace when implemented
        foreach ($channels as $_channel) {
            $link = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember")->findOneBy(
                Array("channel_id" => $_channel->getId(), "user" => $user)
            );
            if ($link && $link->getLastMessagesIncrement() < $_channel->getMessagesIncrement()) {
                $all_read = false;
                break;
            }
        }
        if ($all_read) {
            //Mark workspace as read
            $workspaceUsers = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUser = $workspaceUsers->findOneBy(Array("workspace" => $workspace_id, "user" => $user));
            if ($workspaceUser && $workspaceUser->getHasNotifications()) {
                $workspaceUser->setHasNotifications(false);
                $this->doctrine->persist($workspaceUser);
                $this->pusher->push(Array("type" => "update", "notification" => Array("workspace_id" => $workspace_id, "hasnotifications" => false)), "notifications/" . $user->getId());


                $all_read = true;
                $groupId = $workspaceUser->getWorkspace()->getGroup()->getId();
                $workspacesUser = $workspaceUsers->findBy(Array("user" => $user));

                foreach ($workspacesUser as $workspaceUser) {
                    if ($workspaceUser->getHasNotifications()) {
                        $workspace = $workspaceUser->getWorkspace();
                        if ($workspace->getGroup()->getId() == $groupId) {
                            $all_read = false;
                            break;
                        }
                    }
                }

                if ($all_read) {
                    $groupUsers = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
                    $groupUser = $groupUsers->findOneBy(Array("group" => $groupId, "user" => $user));

                    if ($groupUser && $groupUser->getHasNotifications()) {
                        $groupUser->setHasNotifications(false);
                        $this->doctrine->persist($groupUser);
                        $this->pusher->push(Array("type" => "update", "notification" => Array("group_id" => $groupId, "hasnotifications" => false)), "notifications/" . $user->getId());
                    }
                }

            }

        }

        if ($flush) {
            $this->doctrine->flush();
        }

    }

}