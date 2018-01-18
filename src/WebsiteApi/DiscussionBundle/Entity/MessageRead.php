<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Message
 *
 * @ORM\Table(name="message_read",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageReadRepository")
 */
class MessageRead
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Stream",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $stream;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $otherUser;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DiscussionBundle\Entity\Message",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $message;

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param mixed $user
     */
    public function setUser($user)
    {
        $this->user = $user;
    }

    /**
     * @return mixed
     */
    public function getStream()
    {
        return $this->stream;
    }

    /**
     * @param mixed $stream
     */
    public function setStream($stream)
    {
        $this->stream = $stream;
    }

    /**
     * @return mixed
     */
    public function getMessage()
    {
        return $this->message;
    }

    /**
     * @param mixed $message
     */
    public function setMessage($message)
    {
        $this->message = $message;
    }

    /**
     * @return mixed
     */
    public function getOtherUser()
    {
        return $this->otherUser;
    }

    /**
     * @param mixed $otherUser
     */
    public function setOtherUser($otherUser)
    {
        $this->otherUser = $otherUser;
    }



}