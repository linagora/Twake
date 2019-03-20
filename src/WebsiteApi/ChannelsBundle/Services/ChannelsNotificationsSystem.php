<?php


namespace WebsiteApi\ChannelsBundle\Services;

use Exception;
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

}