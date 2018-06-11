<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\DiscussionBundle\Model\MessagesSystemInterface;

/**
 * Manage contacts
 */
class MessagesMasterService
{

    var $doctrine;
    var $levelManager;

    function __construct($doctrine, $levelManager)
    {
        $this->doctrine = $doctrine;
        $this->levelManager = $levelManager;
    }

    public function addWorkspaceMember($workspace, $user)
    {
        $this->updateWorkspaceMember($workspace, $user);
    }

    public function updateWorkspaceMember($workspace, $user)
    {
        if ($workspace == null) {
            return;
        } else {

            if (!$this->levelManager->can($workspace, $user, "messages:read")) {
                return;
            }

            //Workspace streams
            $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace" => $workspace));
            $retour = Array("stream" => Array(), "user" => Array());
            foreach ($streams as $stream) {
                $linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user" => $user, "stream" => $stream));
                if ($linkStream == null && !$stream->getIsPrivate()) {
                    $linkStream = $stream->addMember($user);
                    $this->doctrine->persist($linkStream);
                }
            }
            $this->doctrine->flush();
        }
    }

    public function delWorkspaceMember($workspace, $user)
    {
        $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace" => $workspace));
        foreach ($streams as $stream) {
            $member = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user" => $user, "stream" => $stream));
            if ($member) {
                $this->doctrine->remove($member);
            }
        }
        $this->doctrine->flush();
    }


    public function getLastMessages($user){
        $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(array('user' => $user, 'mute' => false),array('unread'=> 'desc'),50);

        $messagesList = array();
        foreach ($streams as $stream){
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(array('streamReciever' => $stream),array('id'=>'desc'));
            array_push($messagesList,$message);
        }

        return $messagesList;
    }
}
