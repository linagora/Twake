<?php

namespace WebsiteApi\DiscussionBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\DiscussionBundle\Entity\StreamMember;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;


class DiscussionController extends Controller
{

    public function getMessageAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if(($request->request->get("discussionKey")==null && $request->request->get("discussionKey")!=0) ||  ($request->request->get("offset")==null && $request->request->get("offset")!=0) ){
                $data["errors"][] = "missingargument";
            }
            else{
                $discussion = $this->get("app.messages")->convertKey($request->request->get("discussionKey"), $this->getUser());
                $messages = [];
                $messages1 = Array();
                do{
                    $messages1 = $this->get("app.messages")->getMessages($this->getUser(),$discussion["type"],$discussion["id"],intval($request->request->get("offset")),$request->request->get("subject"));
                    $messages = array_merge($messages,$messages1);
                    error_log(count($messages1));
                }while(count($messages)<30 && count($messages1)>0);

                    $data["data"] = $messages;
            }
        }
        return new JsonResponse($data);
    }

    public function getSubjectAction(Request $request){
    	$data = Array(
    		'errors' => Array(),
    		'data' => Array()
    	);

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if($request->request->get("discussionKey")!=null){
                $discussionInfos = $this->get("app.messages")->convertKey($request->request->get("discussionKey"), $this->getUser());
                if($discussionInfos["type"] == "S"){
                    $stream = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($discussionInfos["id"]);
                    if($stream != null){
                        $link = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(Array("user"=>$this->getUser(),"stream"=>$stream));
                        if($link != null){
                            $subjects = $this->get("app.subjectSystem")->getSubject($stream);
                            $retour = [];
                            foreach($subjects as $subject){
                                $retour[] = $subject->getArray();
                            }
                            $data["data"] = $retour;
                        }
                        else{
                            $data['errors'][] = "notindiscussion";
                        }
                    }
                    else{
                        $data['errors'][] = "discussionnotfound";
                    }
                }
                else if($discussionInfos["type"] == "U"){
                    $data["errors"][] = "userDiscussion";
                    // TODO manage user discussion
                }
            }
            else{
                $data["errors"][] = "missingarguments";
            }
        }
        return new JsonResponse($data);
    }


    public function getSubjectMessageAction(Request $request){
		$data = Array(
		    		'errors' => Array(),
		    		'data' => Array()
		    	);

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data['errors'][] = "notconnected";
        }
        else {
            if($request->request->get("subject") != null){
                $subject = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Subject")->find($request->request->get("subject"));
                if($subject == null){
                    $data["errors"][] = "subjectnotfound";
                }
                else{
                    $link = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("stream"=>$subject->getStream(),"user"=>$this->getUser()));
                    if($link == null){
                        $data["errors"][] = "notallowed";
                    }
                    else{
                        $messages = $this->get("app.subjectSystem")->getMessages($subject);
                        $retour = [];
                        foreach ($messages as $message) {
                            $retour[] = $message->getArray();
                        }
                        $data["data"] = $retour;
                    }
                }
            }
            else{
                $data["errors"][] = "missingarguments";
            }
        }
        return new JsonResponse($data);
    }

	public function getChannelsAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
            if($request->request->get("gid")==null ){
                $data["errors"] = "missingarguments";
            }
            else{
                $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));
                if ($workspace == null) {
                    $data["errors"][] = "groupnotfound";

                } elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "Messages:general:view")){
                    $data["errors"][] = "notallowed";
                }
                else {
                    $result = Array();
                    foreach ($workspace->getStreams() as $stream) {

                        $repoLinks = $manager
                            ->getRepository("TwakeDiscussionBundle:StreamMember");
                        $linkMemberChannel = null;
                        $members = [];
                        $show = false;

                        if (!$stream->getPrivacy()) {
                            $show = true;
                            $linkMemberChannel = $repoLinks
                                ->findOneBy(Array("user" => $this->getUser(), "stream" => $stream));
                        } else {
                            $membersChannel = $repoLinks
                                ->findBy(Array("stream" => $stream));
                            foreach ($membersChannel as $linkMember) {
                                error_log($stream->getId());
                                error_log($linkMember->getUser()->getId());
                                $members[] = $linkMember->getUser()->getAsSimpleArray();
                                if ($linkMember->getUser()->getId() == $this->getUser()->getId()) {
                                    $show = true;
                                    $linkMemberChannel = $linkMember;
                                }
                            }
                        }


                        if ($linkMemberChannel == null && !$stream->getPrivacy()) {
                            //Add user to channel
                            $linkMemberChannel = new StreamMember($stream, $this->getUser());
                            $manager->persist($linkMemberChannel);
                            $manager->flush();
                        }

                        if ($show) {
                            $result[] = Array(
                                'id' => $stream->getId(),
                                'name' => $stream->getName(),
                                'mute' => $linkMemberChannel->getMute(),
                                'privacy' => $stream->getPrivacy(),
                                'members' => $members
                            );
                        }
                    }
                    $data['data'] = $result;
                }
            }

        }
		return new JsonResponse($data);
	}
/*
	public function uploadAction(Request $request) {

		$securityContext = $this->get('security.authorization_checker');
		$file = $_FILES["file"];

		$data = Array(
			'errors' => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
			$uploadResult = $this->get("app.uploader")->uploadFiles($this->getUser(), $file, "msg");

			if (count($uploadResult) > 0) {
				if (count($uploadResult[0]["errors"]) > 0) {
					$data["errors"] = array_merge($data["errors"], $uploadResult[0]["errors"]);
				}
				else if ($uploadResult[0]["file"] != null) {
					$data["id"] = $uploadResult[0]["file"]->getId();
				}
			}
			else {
				$data['errors'][] = "unknown";
			}
		}

		return new JsonResponse($data);
	}

	public function setChannelAction(Request $request){
		$data = Array(
			'errors' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));
		$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($request->request->get("channelId"));

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		elseif($workspace==null){
			$data['errors'][] = "groupnotfound";
		}
		elseif($channel==null){
			$data['errors'][] = "channelnotfound";
		} elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "Messages:general:create")) {
			$data["errors"][] = "notallowed";
		}
		else{
			$channel->setName($request->request->get("name"));
			$channel->setPrivacy($request->request->get("privacy"));
			$manager->persist($channel);
			$manager->flush();
		}
		return new JsonResponse($data);
	}

	public function findMessageAction(Request $request){
		$data = Array(
			'errors'=>Array(),
			'data'=>Array()
		);
		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');


		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
			return new JsonResponse($data);
		}

		$channel = null;
		$userId = null;
		$discKey = $request->request->get("channelId");
		if(strpos($request->request->get("channelId"),"_")!==false) {
			$userId = intval(explode("_",$request->request->get("channelId"))[1]);
			if($this->getUser()->getId()==$userId) {
				$userId = intval(explode("_", $request->request->get("channelId"))[0]);
			}
		}else{
			$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($request->request->get("channelId"));
		}

		$request = $request->request->get("model");

		$model = Array();
		$model["content"] = (isset($request["content"]))?$request["content"]:"";
		$model["user"] = (isset($request["user"]))?$request["user"]:"";
		$model["after"] = (isset($request["after"]))?$request["after"]:"";
		$model["before"] = (isset($request["before"]))?$request["before"]:"";
		$model["pinned"] = (isset($request["pinned"]) && !$request["pinned"])?false:true;
		$model["files"] = (isset($request["files"]) && !$request["files"])?false:true;

		if($channel == null && $userId == null){
			$data['errors'][] = "channelnotfound";
		}else if(!$this->get('app.messages')->isAllowedByKey($this->getUser(),$discKey))
		{
			$data['errors'][] = "channelnotfound";
		}
		else{

				if($model["files"]) {
					$messages = $manager->getRepository('TwakeDiscussionBundle:Message')->createQueryBuilder('m')
						->where('m.filename LIKE :model');
				}
				else {
					$messages = $manager->getRepository('TwakeDiscussionBundle:Message')->createQueryBuilder('m')
						->where('m.cleanContent LIKE :model');
				}

				if($model["pinned"]) {
					$messages = $messages
						->andwhere("m.pinned=1");
				}

				if($model["files"]) {
					$messages = $messages
						->andwhere("m.isFile=1");
				}

				if($model["before"]!="" && strpos($model["before"],":")!==false) {
					//Remove the 'before:'
					$before = explode(":", $model["before"])[1];
					$before = \DateTime::createFromFormat('Y-m-d', $before);
					$messages = $messages
						->andwhere("m.date<=:before");
					$messages = $messages
						->setParameter('before',$before);
				}

				if($model["after"]!="" && strpos($model["after"],":")!==false) {
					//Remove the 'after:'
					$after = explode(":", $model["after"])[1];
					$after = \DateTime::createFromFormat('Y-m-d', $after);
					$messages = $messages
						->andwhere("m.date>=:after");
					$messages = $messages
						->setParameter('after',$after);
				}

				if($model["user"]!="") {
					//Get the user
					$user = $this->get('app.string_cleaner')->simplify($model["user"]);
					$messages = $messages
						->andwhere("m.usernamecache=:pseudo");
					$messages = $messages
						->setParameter('pseudo',$user);
				}

				$messages = $messages
					->setParameter('model', '%' . $model["content"] . '%');

				if($channel!=null){
					$messages = $messages
						->andwhere("m.channelReceiver=:channel")
						->setParameter('channel',$channel->getId());
				}else{
					$user = $this->getDoctrine()->getRepository("TwakeUsersBundle:User")->find($userId);
					$messages = $messages
						->andwhere("((m.sender=:user AND m.userReceiver=:me) OR (m.sender=:me AND m.userReceiver=:user))")
						->setParameter('me',$this->getUser()->getId())
						->setParameter('user',$user->getId());
				}
				$messages = $messages->setMaxResults(50)
					->orderBy('m.id', 'DESC')
		            ->getQuery()
		            ->getResult();

				foreach($messages as $message){
					$data['data'][] = $message->getAsArray();
				}


		}
		return new JsonResponse($data);
	}






	public function tableChannelAction(Request $request){
		$data = Array(
			'errors'=>Array(),
			'data'=>Array()
		);
		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($request->request->get("channelId"));
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		elseif($channel == null){
			$data['errors'][] = "channelnotfound";
		}
		else {
			$links = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(Array("channel"=>$channel));
			foreach($links as $link){
				$data['data'][] = $link->getUser()->getAsSimpleArray();
			}
		}
		return new JsonResponse($data);

	}



	public function exitChannelAction(Request $request){
		$data = Array(
			'errors' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($request->request->get("channelId"));

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		elseif($channel == null){
			$data['errors'][] = "channelnotfound";
		}
		else {
			$link = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("channel"=>$channel, "user"=>$this->getUser()));
			if($link==null){
				$data['errors'][] = "usernotinchannel";
			}
			else{
				$count = count($this->getDoctrine()->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("channel"=>$channel)));
				if($count<=1){
					$manager->remove($channel);
				}
				$manager->remove($link);
				$manager->flush();
			}
		}
		return new JsonResponse($data);
	}


	public function inviteMembersChannelAction(Request $request){
		$data = Array(
			'errors' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));
		$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($request->request->get("channelId"));

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		elseif($manager->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user" => $this->getUser(), "channel" => $channel)) == null){
			$data['errors'][] = "notallowed";
		}
		else{

			if ($channel->getPrivacy()) {

				$uids = $request->request->get("uids");
				$users = $manager->getRepository("TwakeUsersBundle:User")->findBy(Array("id" => array_keys($uids)));
				foreach ($users as $user) {
					if ($manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $workspace, "User" => $user)) == null) {
						$data['data'][] = "usernotingroup" . $user->getId();
					}
					if ($uids[$user->getId()] == false) {
						// on supprime le membre
						$link = $manager->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("channel" => $channel, "user" => $user));
						if ($link != null) {
							$data = Array(
								'type' => 'B',
								'data' => Array(
									'userId' => $link->getUser()->getId()
								)
							);
							$this->get('gos_web_socket.zmq.pusher')->push($data, "discussion_topic", Array("key" => $link->getUser()->getId()));
							$manager->remove($link);
						} else {
							$data['data'][] = "notinchannel" . $user->getId();
						}
					} else {

						if ($manager->getRepository("TwakeDiscussionBundle:StreamMember")->findBy(Array("channel" => $channel, "user" => $user)) != null) {
							$data['data'][] = "alreadyinchannel" . $user->getId();
						} else {
							$link = $channel->addMember($user);
							$manager->persist($link);

						}
					}
				}
				$manager->flush();

			}
		}
		return new JsonResponse($data);
	}

	public function getMessagesUserAction(Request $request) {

		$data = Array(
			'errors' => Array(),
			'data' => Array('messages' => Array())
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
			$user = $this->getUser();
			$offset = $request->request->get("offset");
			$limit = $request->request->get("limit");
			$otherUser =  $manager->getRepository("TwakeUsersBundle:User")->findOneById($request->request->get("otherUserId"));

			if ($otherUser == null) {
				$data['errors'][] = 'usernotfound';
				return new JsonResponse($data);
			}

			$messages = $manager->createQueryBuilder()
				->select('m')
				->from('TwakeDiscussionBundle:Message', 'm')
				->where('m.sender = :currentUser AND m.userReceiver = :otherUser')
				->orWhere('m.sender = :otherUser AND m.userReceiver = :currentUser')
				->setParameter('currentUser', $user)
				->setParameter('otherUser', $otherUser)
				->orderBy('m.date', 'DESC')
				->setMaxResults($limit)
				->setFirstResult($offset)
				->getQuery()
				->getResult();

			foreach ($messages as $message) {
				$data['data']['messages'][] = Array(
					'id' => $message->getId(),
					'sid' => $message->getSender()->getId(),
					'rid' => $message->getReceiver()->getId(),
					'content' => $message->getContent(),
					'date' => $message->getDate()->format('d-m-Y H:i:s')
				);
			}


		}

		return new JsonResponse($data);
	}

	public function readAction(Request $request) {

		$data = Array(
			'errors' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {

			$type = $request->request->get("type", '');
			$id = $request->request->getInt("id", 0);

			if($type == "user"){
				$user = $this->getDoctrine()->getRepository("TwakeUsersBundle:User")->find($id);
				if($user==null){
					$data['errors'][] = "badid";
				}else {
					$this->get("app.notifications")->read($this->getUser(), $user, "private_message");
				}
			}else if($type == "channel"){
				$channel = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream")->find($id);
				if($channel==null){
					$data['errors'][] = "badid";
				}else {
					$this->get("app.notifications")->read(
						$this->getUser(),
						$channel->getGroup(),
						"group_message_ch".$channel->getId()
					);
				}
			}else{
				$data['errors'][] = "badtype";
			}

		}

		return new JsonResponse($data);
	}

	public function setMuteAction(Request $request) {

		$data = Array(
			'errors' => Array(),
			'data' => Array('messages' => Array())
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {

			$channel = $manager->getRepository("TwakeDiscussionBundle:Stream")->findOneById($request->request->get("channelId"));

			if ($channel == null) {
				$data['errors'][] = "channelnotfound";
			}
			else {
				$linkMemberChannel = $manager->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user" => $this->getUser(), "channel" => $channel));

				if ($linkMemberChannel == null) {
					$data['errors'][] = "notinchannel";
				}
				else {
					$linkMemberChannel->setMute($request->request->get("mute"));
					$manager->persist($linkMemberChannel);
					$manager->flush();
				}
			}
		}

		return new JsonResponse($data);
	}

	public function createChannelAction(Request $request) {
		$data = Array(
			'errors' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else{
			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));
			if ($workspace == null) {
				$data["errors"][] = "groupnotfound";
			} elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "Messages:general:create")) {
				$data["errors"][] = "notallowed";
			}
			else {
				$channel = new Stream($workspace, $request->request->get("name"),$request->request->get("privacy"));
		        $link = $channel->addMember($this->getUser());
				$manager = $this->getDoctrine()->getManager();
		        $manager->persist($channel);
				$manager->persist($link);
	            $manager->flush();
				$data['data']['channelId'] = $channel->getId();
			}
			return new JsonResponse($data);
		}
	}

	public function getOlderAction(Request $request) {
    $securityContext = $this->get('security.authorization_checker');
    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
      return new JsonResponse(Array("errors"=>"notconnected", "data"=>Array()));
    }
    $user = $this->getUser();
	  $discussionKey = $request->request->get("discussionKey");
    $oldest = $request->request->get("oldest");
	  return $this->get('app.Messages')->getOlder($user, $discussionKey, $oldest);


  }




	public function joinChannelAction(Request $request) {
		$data = Array(
			'errors' => Array(),
			'data' => Array(),
		);

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else{
			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));
			if ($workspace == null) {
				$data["errors"][] = "groupnotfound";
			} elseif (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "base:discussion:join")) {
				$data["errors"][] = "notallowed";
			}
			else {
				$manager = $this->getDoctrine()->getManager();
				$channelIds = $request->request->get("channelIds");

				if( count($channelIds)<=0 ||!is_array($channelIds) ){
						$data['errors'][] = "nochannel";
				}
				else{
					$channels = $manager->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("id" => $channelIds));

					foreach( $channels as $channel){
						if($channel != null){
							$link = $manager->getRepository("TwakeDiscussionBundle:StreamMember")->findby(Array("user"=>$this->getUser(),"channel"=>$channel));
							if($link != null){
								$data['data'][] = $channel->getId().":alreadyJoined";
							}
							elseif( $channel->getPrivacy()){
								$data['data'][] = $channel->getId().":privateChannel";
							}
							else{
								$link = $channel->addMember($this->getUser());
								$manager->persist($link);
							}
						}else{
							$data['errors'][]="nullChannel";
						}

						$manager->flush();
					}
				}
			}
			return new JsonResponse($data);
		}
	}*/
}
