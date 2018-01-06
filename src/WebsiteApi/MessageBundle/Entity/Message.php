<?php
//
//namespace WebsiteApi\MessageBundle\Entity;
//
//use Doctrine\ORM\Mapping as ORM;
//use Symfony\Component\Validator\Constraints\DateTime;
//
///**
// * Message
// *
// * @ORM\Table(name="message",options={"engine":"MyISAM"})
// * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageRepository")
// */
//class Message
//{
//    /**
//     * @ORM\Column(name="id", type="integer")
//     * @ORM\Id
//     * @ORM\GeneratedValue(strategy="AUTO")
//     */
//    private $id;
//
//    /**
//     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
//     */
//    private $sender;
//
//    /**
//     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
//     * @ORM\JoinColumn(nullable=true)
//     */
//    private $userReceiver;
//
//    /**
//     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream",cascade={"persist"})
//     * @ORM\JoinColumn(nullable=true)
//     */
//    private $channelReceiver;
//
//    /**
//     * @ORM\Column(type="string", length=1)
//     */
//    private $receiverType;
//
//    /**
//     * @ORM\Column(type="datetime")
//     */
//    private $date;
//
//    /**
//     * @ORM\Column(type="text", length=20000)
//     */
//    private $content;
//    /**
//     * @ORM\Column(type="text", length=10000)
//     */
//    private $cleanContent;
//
//
//    /**
//     * @ORM\Column(type="boolean")
//     */
//    private $edited;
//
//    /**
//     * @ORM\Column(type="boolean")
//     */
//    private $pinned;
//
//
//
//    /**
//     * @ORM\ManyToOne(targetEntity="WebsiteApi\MessageBundle\Entity\Message")
//     * @ORM\JoinColumn(nullable=true)
//     */
//    private $responseTo = null;
//
//
//
//    public function  __construct($sender, $userReceiver, $channelReceiver,$recieverType,$date,$content,$cleanContent,$pinned)
//    {
//        $this->setSender(sender);
//        $this->setUserReceiver($userReceiver);
//        $this->setChannelReceiver($channelReceiver);
//        $this->setReceiverType($recieverType);
//        $this->setDate($date);
//        $this->setContent($content);
//        $this->setCleanContent($cleanContent);
//        $this->setPinned($pinned);
//    }
//
//
//
//
//    /**
//     * @return mixed
//     */
//    public function getId()
//    {
//        return $this->id;
//    }
//
//    /**
//     * @param mixed $id
//     */
//    public function setId($id)
//    {
//        $this->id = $id;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getSender()
//    {
//        return $this->sender;
//    }
//
//    /**
//     * @param mixed $sender
//     */
//    public function setSender($sender)
//    {
//        $this->sender = $sender;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getUserReceiver()
//    {
//        return $this->userReceiver;
//    }
//
//    /**
//     * @param mixed $userReceiver
//     */
//    public function setUserReceiver($userReceiver)
//    {
//        $this->userReceiver = $userReceiver;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getChannelReceiver()
//    {
//        return $this->channelReceiver;
//    }
//
//    /**
//     * @param mixed $channelReceiver
//     */
//    public function setChannelReceiver($channelReceiver)
//    {
//        $this->channelReceiver = $channelReceiver;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getReceiverType()
//    {
//        return $this->receiverType;
//    }
//
//    /**
//     * @param mixed $receiverType
//     */
//    public function setReceiverType($receiverType)
//    {
//        $this->receiverType = $receiverType;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getDate()
//    {
//        return $this->date;
//    }
//
//    /**
//     * @param mixed $date
//     */
//    public function setDate($date)
//    {
//        $this->date = $date;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getContent()
//    {
//        return $this->content;
//    }
//
//    /**
//     * @param mixed $content
//     */
//    public function setContent($content)
//    {
//        $this->content = $content;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getCleanContent()
//    {
//        return $this->cleanContent;
//    }
//
//    /**
//     * @param mixed $cleanContent
//     */
//    public function setCleanContent($cleanContent)
//    {
//        $this->cleanContent = $cleanContent;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getEdited()
//    {
//        return $this->edited;
//    }
//
//    /**
//     * @param mixed $edited
//     */
//    public function setEdited($edited)
//    {
//        $this->edited = $edited;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getPinned()
//    {
//        return $this->pinned;
//    }
//
//    /**
//     * @param mixed $pinned
//     */
//    public function setPinned($pinned)
//    {
//        $this->pinned = $pinned;
//    }
//
//    /**
//     * @return mixed
//     */
//    public function getResponseTo()
//    {
//        return $this->responseTo;
//    }
//
//    /**
//     * @param mixed $responseTo
//     */
//    public function setResponseTo($responseTo)
//    {
//        $this->responseTo = $responseTo;
//    }
//
//
//
//    public function getAsArray(){
//        return Array(
//            "id" => $this->getId(),
//            'senderId' => $this->getSender()->getId(),
//            'receiverId' => $this->getReceiver()->getId(),
//            'content' => $this->getContent(),
//            'date' => $this->getDate()->format('d-m-Y H:i:s'),
//            'timestamp' => $this->getDate()->getTimestamp(),
//            'edited' => $this->getEdited(),
//            'pinned' => $this->getPinned(),
//        );
//    }
//
//
//}
