<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * Call
 *
 * @ORM\Table(name="call_object_link",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CallsBundle\Repository\CallRepository")
 */
class Call implements ObjectLinksInterface
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

    /**
     * @ORM\Column(type="string")
     */
    private $name;

    /**
     * @ORM\Column(type="string")
     */
    private $token;


    public function __construct($token, $name)
    {
        $this->token = $token;
		$this->setName($name);
	}


    public function getId()
    {
        return $this->id;
    }

    public function getRepository()
    {
        return "TwakeDiscussionBundle:Call";
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "name" => $this->getName(),
            "token" => $this->getToken()
        );
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "Call",
            "object_name" => $this->getName(),
            "key" => "calls",
            "type" => "call",
            "code" => $this->getToken(),
        );
    }

    public function synchroniseField($fieldName, $value)
    {
        if(!property_exists($this, $fieldName))
            return false;

        $setter = "set".ucfirst($fieldName);
        $this->$setter($value);

        return true;
    }

    public function get($fieldName){
        if(!property_exists($this, $fieldName))
            return false;

        $getter = "get".ucfirst($fieldName);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        return "calls/".$this->getId();
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

    /**
     * @param mixed $token
     */
    public function setToken($token)
    {
        $this->token = $token;
    }


    public function finishSynchroniseField($data)
    {
        // TODO: Implement finishSynchroniseField($data) method.
    }
}

