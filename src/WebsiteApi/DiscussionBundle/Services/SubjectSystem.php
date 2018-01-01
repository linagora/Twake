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

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $pusher, $levelManager)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->pusher = $pusher;
        $this->levelManager = $levelManager;
    }

    public function createSubject($name,$streamId){
        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($streamId);
        if($stream != null){
            $subject = new Subject($name,$stream,new \DateTime(), new \DateTime());
            $this->doctrine->persist($subject);
            $this->doctrine->flush();
            return $subject;
        }
    }

    public function createSubjectFromMessage($idMessage){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);
        if($message != null && $message->getSubject() == null){
            $subject = $this->createSubject($message->getCleanContent(),$message->getStreamReciever()->getId());
            $message->setSubject($subject);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $subject;
        }
        return false;
    }

    public function getSubject($stream){
        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($stream);
        if($stream == null){
            return false;
        }
        $retour = [];
        $subjects = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->findBy(Array("stream"=>$stream),Array("dateUpdate"=>"DESC"));
        foreach($subjects as $subject){
            $retour[] = $subject->getArray();
        }
        return $retour;
    }
}