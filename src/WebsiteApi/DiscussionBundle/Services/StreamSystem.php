<?php



namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\DiscussionBundle\Model\StreamSystemInterface;

/**
 * Manage contacts
 */
class StreamSystem implements StreamSystemInterface
{

    var $string_cleaner;
    var $doctrine;
    var $security;
    var $pusher;
    var $levelManager;
    var $messageReadSystem;
    var $callSystem;
    var $messageSystem;
    var $app_workspace_members;
    var $app_contacts;

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $pusher, $app_contacts, $levelManager, $app_workspace_members, $messageReadSystem,$callSystem,$messageSystem)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->pusher = $pusher;
        $this->app_contacts = $app_contacts;
        $this->levelManager = $levelManager;
	    $this->app_workspace_members = $app_workspace_members;
        $this->messageReadSystem = $messageReadSystem;
        $this->callSystem = $callSystem;
        $this->messageSystem = $messageSystem;
    }


	public function getStream($streamKey, $currentUserId=null)
	{
		$explode = explode(":", $streamKey);

		$streamObject = Array(
			"type" => null,
			"object" => null,
			"key" => null
		);

		if($explode[0]=="s"){

			$s = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find(intval($explode[1]));
			if(!$s || $s->getType()!="stream"){
				return null;
			}
			$streamObject["type"] = "stream";
			$streamObject["object"] = $s;
			$streamObject["key"] = "s:".intval($explode[1]);

			return $streamObject;

		}else if($explode[0]=="u" && $currentUserId){
			$users = explode("_", $explode[1]);
			$key = min($users[0], $users[1]) . "_" . max($users[0], $users[1]);

			$s = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")
				->findOneBy(Array("key"=>$key, "type"=>"user"));

			if(!$s){
				//create channel between two users
				$s = new Stream(null, "", false, "");
				$s->setType("user");
				$s->setKey($key);
				$this->doctrine->persist($s);

				$users1 = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[0]);
				$users2 = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[1]);
				$l1 = $s->addMember($users1);
				$l2 = $s->addMember($users2);
				$this->doctrine->persist($l1);
				$this->doctrine->persist($l2);

				$this->doctrine->flush();

			}

			$streamObject["type"] = "user";
			$streamObject["object"] = $s;
			$streamObject["key"] = "u:".$key;

			return $streamObject;

		}else if($explode[0]=="p"){
			$data = explode("_", $explode[1]);
			$key = $data[1];
			$id = $data[0];
			$stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find(intval($id));
			if($stream && $stream->getType()=="public" && $stream->getKey()==$key){
				$streamObject["type"] = "public";
				$streamObject["object"] = $stream;
				$streamObject["key"] = "p:" . $explode[1];

				return $streamObject;
			}
			return null;
		}
		return null;
	}

	public function isInPrivate($streamObject, $currentUser){
    	if(!$streamObject || $streamObject["type"]!="stream"){
    		return false;
	    }
		$present = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findOneBy(Array("user"=>$currentUser,"stream"=>$streamObject["object"]));
    	if($present){
    		return true;
	    }
	    return false;
	}

    public function isAllowed($streamObject, $currentUser, $action="read"){

    	if(!$streamObject){
    		return false;
	    }

	    if($streamObject["type"] == "user"){
		    return true;
	    }

	    if($streamObject["type"] == "public"){
		    return true;
	    }

	    if($streamObject["type"] == "stream" || $streamObject["type"] == "") {

		    $workspace = $streamObject["object"]->getWorkspace();
		    $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($currentUser);

		    if ($workspace == null || $user == null) {
			    return false;
		    }
		    if ($workspace->getUser() == $user) {
			    return true;
		    }

		    if(!$streamObject["object"]->getIsPrivate()) {

			    $can = $this->levelManager->can($workspace, $user, "Messages:" . $action);
			    if ($can) {
				    return true;
			    }

		    }else{

		    	if($this->isInPrivate($streamObject, $currentUser)){
		    		return true;
			    }

		    }

	    }

        return false;
    }


    public function createStream($user,$workspaceId,$streamName,$streamDescription,$streamIsPrivate,$type="stream")
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        if ($workspace == null) {
            return false;
        }
        if(!$this->levelManager->can($workspace, $user, "Messages:read")){
            return false;
        }
        if (!$this->levelManager->hasRight($user, $workspace, "Messages:manage")) {
            return false;
        }
        else {
            $stream = new Stream($workspace, $streamName, $streamIsPrivate,$streamDescription);
            $stream->setType($type);
            $this->doctrine->persist($stream);
            $link = $stream->addMember($user);
            $this->doctrine->persist($link);
            $this->doctrine->flush();

            $message = $this->messageSystem->sendMessage(null,"S",$stream->getId(),false,null,true,
                "This is the first message of ".$stream->getName(),$workspaceId,null,null);

            $this->messageSystem->notify($stream->getId(),"C",$message->getAsArray());
            $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
            $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
            $retour = array_merge($stream->getAsArray(),Array("isRead"=>$isRead,"call"=>$callInfos));
            return $retour;
        }

    }

    public function deleteStream($user,$streamKey){
        if($streamKey != null){
            $stream = $this->getStream($streamKey);
            if(!$stream || $stream["type"]!="stream"){
            	return false;
            }
	        $stream = $stream["object"];

            if(!$this->levelManager->can($stream->getWorkspace(), $user, "Messages:read")){
                return false;
            }
            if (!$this->levelManager->hasRight($user, $stream->getWorkspace(), "Messages:manage")) {
                return false;
            }

            if($stream){
                $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")
	                ->findBy(Array("streamReciever"=>$stream));
                foreach ($messages as $message){
                    $this->doctrine->remove($message);
                }
                $this->doctrine->remove($stream);
                $this->doctrine->flush();
                return true;
            }
        }
        return false;
    }

    public function editStream($user,$streamKey,$name,$streamDescription,$isPrivate,$members){

        $stream = $this->getStream($streamKey);
	    if(!$stream || $stream["type"]!="stream"){
		    return false;
	    }
	    $stream = $stream["object"];

        if($stream != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")
                ->findOneBy(Array("id" => $stream->getWorkspace()->getId(), "isDeleted" => false));
            if ($workspace == null) {
                return false;
            }
            if(!$this->levelManager->can($workspace, $user, "Messages:read")){
                return false;
            }
            if (!$this->levelManager->hasRight($user, $workspace, "Messages:manage")) {
                return false;
            }
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

    public function getStreamList($workspaceId, $user){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")
	        ->findOneBy(Array("id"=>$workspaceId,"isDeleted"=>false));
        if($workspace == null){
            return false;
        }
        else{

            if(!$this->levelManager->can($workspace, $user, "Messages:read")){
                return false;
            }

	        //Workspace streams
	        $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace"=>$workspace));
	        $retour = Array("stream"=>Array(), "user"=>Array());
	        foreach($streams as $stream){
		        if(!$stream->getIsPrivate() || $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user"=>$user,"stream"=>$stream))!=null){ //public stream

			        $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
			        $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
			        $retour["stream"][] = array_merge($stream->getAsArray(),Array(
			        	"isRead"=>$isRead,
				        "call"=>$callInfos
			        ));
		        }
	        }

            //Member streams
            if($workspace->getUser()!=null){ // this is private ws
                $members = $this->app_contacts->getAll($user, true);
            }
            else{
                $members = $this->app_workspace_members->getMembers($workspaceId);
            }
            foreach($members as $member){
                $key = "u:".min($user->getId(),$member->getId())."_".max($user->getId(),$member->getId());
                $stream = $this->getStream($key, $user);
                if($stream) {
	                $stream = $stream["object"];
	                $isRead = $this->messageReadSystem->streamIsReadByKey($stream->getId(),$user);
	                $callInfos = $this->callSystem->getCallInfo($user,$stream->getId());
	                $retour["user"][] = array_merge($stream->getAsArray(),Array(
	                	"isRead"=>$isRead,
		                "call"=>$callInfos,
		                "contact"=>$member
	                ));
                }
            }

            return $retour;
        }
    }

}