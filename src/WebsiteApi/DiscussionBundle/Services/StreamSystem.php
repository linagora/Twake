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

    public function editStream($streamId,$name,$privacy,$members){
        if (!$this->security->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        } else {
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($streamId);
            if($stream != null) {
                $stream->setName($name);
                $stream->setPrivacy($privacy);
                $membersInStream = $stream->getMembers();
                foreach ($membersInStream as $member) {
                    if (!in_array($member->getId(), $members)) { // user remove
                        $link = $stream->getLinkUser($member);
                        if ($link) {
                            $this->doctrine->remove($link);
                        }
                    } else { // user not remove
                        $index = array_search($member->getId(), $members);
                        $member = array_splice($members, $index, 1);
                    }
                }
                foreach ($members as $memberId) { // user to invite
                    $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($memberId);
                    if ($user != null) {
                        $link = $stream->addMember($user);
                        $this->doctrine->persist($link);
                    }
                }
                $this->doctrine->flush();
                return $stream;
            }
        }
    }

    public function getStreamList($id,$user){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$id,"isDeleted"=>false));
        if($workspace == null){
            return false;
        }
        else{
            $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace"=>$workspace));
            $retour = [];
            foreach($streams as $stream){
                if(!$stream->getPrivacy()){ //public stream
                    $retour[] = $stream;
                }
                else{
                    $link = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user"=>$user,"stream"=>$stream));
                    if($link != null){
                        $retour[] = $stream;
                    }
                }
            }
            return $streams;
        }

    }
}