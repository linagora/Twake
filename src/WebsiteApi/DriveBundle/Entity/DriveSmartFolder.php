<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveLabel
 *
 * @ORM\Table(name="drive_smart_folder",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveSmartFolderRepository")
 */
class DriveSmartFolder
{


    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     * @ORM\JoinColumn(nullable=false)
     */
    private $group;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $name;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $labels;


    public function __construct($group, $name, $labels)
    {
        $this->group = $group;
        $this->name = $name;
        $this->setLabels($labels);
    }

    /**
     * @return mixed
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
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
    public function getLabels()
    {
        return json_decode($this->labels, 1);
    }

    /**
     * @param mixed $labels
     */
    public function setLabels($labels)
    {
        $this->labels = json_encode($labels);
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

}
