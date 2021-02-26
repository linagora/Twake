<?php

namespace Twake\Upload\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * File
 *
 * Fichiers uploadé   /!\ sauf drive !
 *
 * @ORM\Table(name="file",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class File
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="type", type="string", length=8)
     */
    private $type; //Define where this file is used

    /**
     * @var string
     *
     * @ORM\Column(name="name", type="string", length=255)
     */
    private $name; //Name of the file in server (md5)

    /**
     * @var string
     *
     * @ORM\Column(name="real_name", type="string", length=255)
     */
    private $realname; //Original name of the files on user computer

    /**
     * @var int
     *
     * @ORM\Column(name="sizes", type="integer")
     */
    private $sizes; //Size (binary position) : 0 = original
    //		1 = 512
    //      2 = 256
    //      3 = 128
    //      4 = 64
    // Example : 00001 = 1 = only original
    //          10111 = 23 = original, 512, 256 and 64 sizes

    /**
     * @var int
     *
     * @ORM\Column(name="date", type="twake_bigint")
     */
    private $date; //Creation date

    /**
     * @var int
     *
     * @ORM\Column(name="weight", type="integer")
     */
    private $weight;

    /**
     * @ORM\Column(name="provider", type="string")
     */
    private $provider;

    /**
     *
     * @ORM\Column(name="aws_public_link", type="twake_text")
     */
    private $aws_public_link = false;


    public function __construct()
    {
        $this->name = "<null>";
        $this->sizes = 31; //All sizes
        $this->date = date("U");
        $this->weight = 0;
    }


    /**
     * Get id
     *
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    public function setProvider($provider)
    {
        $this->provider = $provider;
    }

    public function getProvider()
    {
        return $this->provider;
    }

    /**
     * Return the url to get the file (public url)
     * @param int $size
     * @return string
     */
    public function getPublicURL($size = 0)
    {
        if ($this->aws_public_link) {
            return $this->aws_public_link . "";
        }
        if (!$this->size_exists($size)) {
            return "";
        }
        return "/upload/" . $this->type . "/" . $size . "/" . $this->name;
    }

    /**
     * Return the url to get the file (local url)
     * @param int $size
     * @return string
     */
    public function getLocalServerURL($size = 0)
    {
        if ($this->aws_public_link) {
            return false;
        }
        return "../web/" . $this->getPublicURL($size);
    }


    /**
     * @ORM\PostRemove()
     */
    public function deleteFromDisk()
    { //Delete files from disk
        for ($i = 0; $i <= 4; $i++) {
            if ($this->size_exists($i)) {
                @unlink($this->getLocalServerURL($i));
            }
        }
    }

    /**
     * Return true if this size is available
     * @param $size
     * @return bool
     */
    private function size_exists($size)
    {
        $sizes = decbin($this->sizes);
        if ($sizes[strlen($sizes) - $size - 1] != 1) {
            return false;
        }
        return true;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param string $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return int
     */
    public function getSizes()
    {
        return $this->sizes;
    }

    /**
     * @param int $sizes
     */
    public function setSizes($sizes)
    {
        $this->sizes = $sizes;
    }


    /**
     * @return int
     */
    public function getWeight()
    {
        return $this->weight;
    }

    /**
     * @param int $weight
     */
    public function setWeight($weight)
    {
        $this->weight = $weight;
    }

    /**
     * @return string
     */
    public function getRealName()
    {
        return $this->realname;
    }

    /**
     * @param string $realname
     */
    public function setRealName($realname)
    {
        $this->realname = $realname;
    }

    /**
     * @return mixed
     */
    public function getPublicLink()
    {
        return $this->aws_public_link;
    }

    /**
     * @param mixed $aws_public_link
     */
    public function setPublicLink($aws_public_link)
    {
        $this->aws_public_link = $aws_public_link;
    }


}
