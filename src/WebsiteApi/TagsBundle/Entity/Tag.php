<?php

namespace WebsiteApi\TagsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Tag
 *
 * @ORM\Table(name="tag",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CoreBundle\Repository\TagRepository")
 */
class Tag
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
     * @var string
     *
     * @ORM\Column(name="type", type="string", length=1)
     */
    private $type;

    /**
     * @var string
     *
     * @ORM\Column(name="language", type="string", length=2)
     */
    private $language;

    /**
     * @var string
     *
     * @ORM\Column(name="valueSimple", type="string", length=32)
     */
    private $valueSimple;

    /**
     * @var string
     *
     * @ORM\Column(name="value", type="string", length=32)
     */
    private $value;

    /**
     * @var int
     *
     * @ORM\Column(name="nbUses", type="integer")
     */
    private $nbUses;

    /**
     * @var int
     *
     * @ORM\Column(name="firstUse", type="bigint")
     */
    private $firstUse;

    /**
     * @var int
     *
     * @ORM\Column(name="lastUse", type="bigint")
     */
    private $lastUse;

    /**
     * @var float
     *
     * @ORM\Column(name="popularity", type="float")
     */
    private $popularity;


    /**
     * Get id
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set type
     *
     * @param string $type
     *
     * @return Tag
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Set language
     *
     * @param string $language
     *
     * @return Tag
     */
    public function setLanguage($language)
    {
        $this->language = $language;

        return $this;
    }

    /**
     * Get language
     *
     * @return string
     */
    public function getLanguage()
    {
        return $this->language;
    }

    /**
     * Set valueSimple
     *
     * @param string $valueSimple
     *
     * @return Tag
     */
    public function setValueSimple($valueSimple)
    {
        $this->valueSimple = $valueSimple;

        return $this;
    }

    /**
     * Get valueSimple
     *
     * @return string
     */
    public function getValueSimple()
    {
        return $this->valueSimple;
    }

    /**
     * Set value
     *
     * @param string $value
     *
     * @return Tag
     */
    public function setValue($value)
    {
        $this->value = $value;

        return $this;
    }

    /**
     * Get value
     *
     * @return string
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * Set nbUses
     *
     * @param integer $nbUses
     *
     * @return Tag
     */
    public function setNbUses($nbUses)
    {
        $this->nbUses = $nbUses;

        return $this;
    }

    /**
     * Get nbUses
     *
     * @return int
     */
    public function getNbUses()
    {
        return $this->nbUses;
    }

    /**
     * Set firstUse
     *
     * @param integer $firstUse
     *
     * @return Tag
     */
    public function setFirstUse($firstUse)
    {
        $this->firstUse = $firstUse;

        return $this;
    }

    /**
     * Get firstUse
     *
     * @return int
     */
    public function getFirstUse()
    {
        return $this->firstUse;
    }

    /**
     * Set lastUse
     *
     * @param integer $lastUse
     *
     * @return Tag
     */
    public function setLastUse($lastUse)
    {
        $this->lastUse = $lastUse;

        return $this;
    }

    /**
     * Get lastUse
     *
     * @return int
     */
    public function getLastUse()
    {
        return $this->lastUse;
    }

    /**
     * Set popularity
     *
     * @param float $popularity
     *
     * @return Tag
     */
    public function setPopularity($popularity)
    {
        $this->popularity = $popularity;

        return $this;
    }

    /**
     * Get popularity
     *
     * @return float
     */
    public function getPopularity()
    {
        return $this->popularity;
    }

}

