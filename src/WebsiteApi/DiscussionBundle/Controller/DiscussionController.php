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
                $offsetId= intval($request->request->get("offsetId"));
                $messages = $this->get("app.messages")->getMessages($discussion["type"],$discussion["id"],$offsetId,$request->request->get("subject"),$this->getUser());

                error_log(count($messages));
                $data["data"] = $messages;
                error_log("nb message : ".count($messages));
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
                            $data["data"] = $subjects;
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
                            $retour[] = $message->getAsArray();
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

	public function getStreamAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
            if($request->request->get("gid")==null ){
                $data["errors"] = "missingarguments";
            }
            else{
            	$streams = $this->get("app.streamSystem")->getStreamList($request->request->get("gid"),$this->getUser());
            	$data["data"] = $streams;
            }

        }
		return new JsonResponse($data);
	}


	public function searchMessageAction(Request $request){
		$data = Array(
			'errors' => Array(),
			'data' => Array()
		);

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {
			$discussionInfos = $this->get("app.messages")->convertKey($request->request->get("discussionKey"), $this->getUser());
			$messages = $this->get("app.messages")->searchMessage($discussionInfos["type"],$discussionInfos["id"],$request->request->get("content"),intval($request->request->get("from")),$request->request->get("dateStart"),$request->request->get("dateEnd"),null);
            $retour = Array();
			foreach ($messages as $message) {
				$retour[] = $message->getAsArray();
			}
			$data["data"] = $retour;
		}
		return new JsonResponse($data);
	}

	public function getDriveMessageAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );
        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED') || !$this->get("app.messages")->isAllowed($this->getUser(),$request->request->get("discussionKey"))) {
            $data['errors'][] = "notconnected";
        }
        else {
            $messages = $this->get("app.messages")->searchDriveMessage($request->request->get("discussionKey"),$this->getUser());
            $data["data"] = $messages;

        }
        return new JsonResponse($data);
    }

}
