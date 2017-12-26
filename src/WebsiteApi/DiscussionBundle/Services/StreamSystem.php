<?php



namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

/**
 * Manage contacts
 */
class StreamSystem
{

    var $string_cleaner;
    var $doctrine;
    var $security;
    var $pusher;
    var $levelManager;

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $pusher, $levelManager)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->pusher = $pusher;
        $this->levelManager = $levelManager;
    }


    public function isAllowed($userId,$workspaceId){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
        if($workspace==null || $user==null){
            return false;
        }
        $link = $this->doctrine->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User"=>$user,"Workspace"=>$workspace));
        if($link != null){
            return true;
        }
        return false;
    }


    public function createStream($user, $workspaceId,$streamName,$streamPrivacy)
    {
        if (!$this->security->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        } else {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
            if ($workspace == null) {
                return ;
            } elseif (!$this->levelManager->hasRight($user, $workspace, "Messages:general:create")) {
                return;
            } else {
                $stream = new Stream($workspace, $streamName, $streamPrivacy);
                $link = $stream->addMember($user);
                $this->doctrine->persist($stream);
                $this->doctrine->persist($link);
                $this->doctrine->flush();
                return $stream;
            }
        }
    }
}