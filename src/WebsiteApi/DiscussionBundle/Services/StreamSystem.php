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
    var $messageReadSystem;
    var $callSystem;

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $pusher, $levelManager,$messageReadSystem,$callSystem)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->pusher = $pusher;
        $this->levelManager = $levelManager;
        $this->messageReadSystem = $messageReadSystem;
        $this->callSystem = $callSystem;
    }


    public function isAllowed($userId,$workspaceId){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
        if($workspace==null || $user==null){
            return false;
        }
        $link = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("user"=>$user,"workspace"=>$workspace));
        if($link != null){
            return true;
        }
        error_log("streamSystem : not allowed");
        return false;
    }


    public function createStream($user, $workspaceId,$streamName,$streamIsPrivate,$streamDescription)
    {
        if (!$this->security->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            return;
        } else {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
            if ($workspace == null) {
                return ;
            } elseif (!$this->levelManager->hasRight($user, $workspace, "Messages:general:create")) {
                return;
            } else {
                $stream = new Stream($workspace, $streamName, $streamIsPrivate,$streamDescription);
                $link = $stream->addMember($user);
                $this->doctrine->persist($stream);
                $this->doctrine->persist($link);
                $this->doctrine->flush();
                $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
                $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
                $retour = array_merge($stream->getAsArray(),Array("isRead"=>$isRead,"call"=>$callInfos));
                return $retour;
            }
        }
    }

    public function editStream($streamId,$name,$isPrivate,$members,$streamDescription,$user){
        if (!$this->security->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            return;
        } else {
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($streamId);
            if($stream != null) {
                $stream->setName($name);
                $stream->setDescription($streamDescription);
                $stream->setIsPrivate($isPrivate);
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
                $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
                $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
                $retour = array_merge($stream->getAsArray(),Array("isRead"=>$isRead,"call"=>$callInfos));
                return $retour;
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
            $retour = Array("stream"=>Array(), "user"=>Array());
            foreach($streams as $stream){
                if(!$stream->getIsPrivate() || $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user"=>$user,"stream"=>$stream))!=null){ //public stream
                    $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
                    $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
                    $retour["stream"][] = array_merge($stream->getAsArray(),Array("isRead"=>$isRead,"call"=>$callInfos));
                }
            }
            $members = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->getSomeUsers($workspace,"A",null,null);
            foreach($members as $member){
                $key = min($user->getId(),$member->getUser()->getId())."_".max($user->getId(),$member->getUser()->getId());
                $isRead = $isRead = $this->messageReadSystem->streamIsReadByKey($key,$user);
                $callInfos = $this->callSystem->getCallInfo($user,$key);
                $retour['user'][] = array_merge($member->getUser()->getAsArray(),Array("isRead"=>$isRead,"call"=>$callInfos));
            }
            return $retour;
        }
    }
}