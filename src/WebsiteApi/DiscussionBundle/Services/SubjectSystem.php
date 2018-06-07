<?php



namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\DiscussionBundle\Entity\Subject;

/**
 * Manage subject
 */
class SubjectSystem
{
    var $string_cleaner;
    var $doctrine;
    var $security;
    var $pusher;
    var $levelManager;
    var $messageSystem;

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $pusher, $levelManager,$messageSystem)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->pusher = $pusher;
        $this->levelManager = $levelManager;
        $this->messageSystem = $messageSystem;
    }


    public function createSubject($name,$streamKey,$user){
	    $stream = $this->messageSystem->getStream($streamKey, $user->getId());
	    if($this->messageSystem->isAllowed($stream,$user)){
		    $stream = $stream["object"];
            if($stream != null){
                $subject = new Subject($name,$stream,new \DateTime(), new \DateTime(),"",$user);
                $this->doctrine->persist($subject);
                $this->doctrine->flush();
                return $subject;
            }
        }
        return false;
    }

    public function createSubjectFromMessageFromApp($idMessage){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);
        return $this->createSubjectFromMessage($idMessage,$message->getUserSender());
    }

    public function createSubjectFromMessage($idMessage,$user){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);
        if ($message != null && $message->getSubject() == null && $message->getTypeReciever()=="S") {

        	$name = strlen($message->getContent()) > 100 ? substr($message->getContent(),0,100)."..." : $message->getContent();
	        $name = ucfirst($name);

            $subject = $this->createSubject($name, $message->getStreamReciever()->getAsArray()["key"],($message->getUserSender()?$message->getUserSender():$user) );

            if(!$subject){
            	return false;
            }

            $subject->setFirstMessage($message);
            $message->setSubject($subject);
            $this->doctrine->persist($message);

            $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo"=>$message));
            foreach($messages as $mess){
            	$mess->setResponseTo(null);
                $mess->setSubject($subject);
                $this->doctrine->persist($mess);
            }
            $this->doctrine->flush();
            $retour = $this->getSubjectAsArray($subject);
            return $retour;
        }
        return false;
    }

    public function getSubjectById($subjectId){
        $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subjectId);
        return $subject;
    }

    public function closeSubject($idSubject,$user){
        $subject = $this->getSubjectById($idSubject);
        return $this->editSubject($idSubject,$subject->getName(),$subject->getDescription(),false,$user);
    }

    public function editSubject($idSubject,$name,$description,$isOpen,$user){
        $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($idSubject);
        if($subject != null){
            $subject->setName($name);
            $subject->setDescription($description);
            $subject->setIsOpen($isOpen);
            $this->doctrine->persist($subject);
            $this->doctrine->flush();
            $firstMessage = $this->getFirstMessage($subject);
            $subjectArray = $subject->getAsArray();
            return $subjectArray;
        }
        return false;
    }

    public function getSubject($stream){
        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($stream);
        if($stream == null){
            return false;
        }
        $subjects = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->findBy(Array("stream"=>$stream),Array("dateUpdate"=>"DESC"));
        $retour = [];
        foreach ($subjects as $subject){
            $retour[] = $this->getSubjectAsArray($subject);
        }
        $retour = array_reverse($retour);
        return $retour;
    }

    public function getSubjectFromMessage($messageId){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($messageId);
        if($message!=null)
            return $message->getSubject();
        return null;
    }

    public function getMessages($subject){
        $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subject);
        if($subject == null){
            return false;
        }
        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("subject"=>$subject),Array("date"=>"ASC"));
        return $messages;   
    }

    public function getFirstMessage($subject){
        $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subject);
        if($subject == null){
            return false;
        }
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("subject"=>$subject),Array("date"=>"ASC"));
        return $message;
    }
    public function getLastMessage($subject){
        $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subject);
        if($subject == null){
            return false;
        }
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("subject"=>$subject),Array("date"=>"DESC"));
        return $message;
    }

    public function getSubjectAsArray($subject){
        $subjectArray = $subject->getAsArray();
        $fm = $this->getFirstMessage($subject);
        $subjectArray["firstMessage"] = ($fm?$fm->getAsArray():null);
        $lm = $this->getLastMessage($subject);
        $subjectArray["lastMessage"] = ($lm?$lm->getAsArray():null);
        $subjectArray["responseNumber"] = count($this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("subject"=>$subject)));
        return $subjectArray;
    }

}