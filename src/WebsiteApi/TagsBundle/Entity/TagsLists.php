<?php

namespace WebsiteApi\TagsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * TagsLists
 *
 * @ORM\Table(name="tags_lists",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CoreBundle\Repository\TagsListsRepository")
 */
class TagsLists
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
	 * @ORM\Column(name="ownerType", type="string", length=4)
	 */
	private $ownerType;

	/**
	 * @var int
	 *
	 * @ORM\Column(name="ownerId", type="integer")
	 */
	private $ownerId;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\TagsBundle\Entity\Tag")
	 */
    private $tag;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="type", type="string", length=1)
	 */
	private $type;


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
	 * Set ownerType
	 *
	 * @param string $ownerType
	 *
	 * @return TagsLists
	 */
	public function setOwnerType($ownerType)
	{
		$this->ownerType = $ownerType;

		return $this;
	}

	/**
	 * Get ownerType
	 *
	 * @return string
	 */
	public function getOwnerType()
	{
		return $this->ownerType;
	}

	/**
	 * Set ownerId
	 *
	 * @param int $ownerId
	 *
	 * @return TagsLists
	 */
	public function setOwnerId($ownerId)
	{
		$this->ownerId = $ownerId;

		return $this;
	}

	/**
	 * Get ownerId
	 *
	 * @return int
	 */
	public function getOwnerId()
	{
		return $this->ownerId;
	}

    /**
     * Set tag
     *
     * @param \stdClass $tag
     *
     * @return TagsLists
     */
    public function setTag($tag)
    {
        $this->tag = $tag;

        return $this;
    }

    /**
     * Get tag
     *
     * @return \stdClass
     */
    public function getTag()
    {
        return $this->tag;
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


}

