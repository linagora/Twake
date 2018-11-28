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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
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

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $object_link_cache;


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
            "token" => $this->getToken(),
            "object_link_cache" => $this->getObjectLinkCache()
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

    public function synchroniseField($fieldname, $value)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $setter = "set" . ucfirst($fieldname);
        $this->$setter($value);

        return true;
    }

    public function get($fieldname)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $getter = "get" . ucfirst($fieldname);

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

    public function setObjectLinkCache($cache)
    {
        $this->object_link_cache = json_encode($cache);
    }

    public function getObjectLinkCache()
    {
        return json_decode($this->object_link_cache, 1);
    }

}

