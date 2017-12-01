<?php

namespace WebsiteApi\OrganizationsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * LinkOrgaParent
 *
 * @ORM\Table(name="link_orga_parent",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\OrganizationsBundle\Repository\LinkOrgaParentRepository")
 */
class LinkOrgaParent
{

	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
	 */
	protected $child;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
	 */
	protected $parent;

  /**
   * @var string
   *
   * @ORM\Column(name="status", type="string", length=1)
   */
  protected $status;

  /**
   * @var string
   *
   * @ORM\Column(name="asker", type="string", length=1)
   */
  protected $asker;

	/**
	 *
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Level")
	 * @ORM\JoinColumn(nullable=true)
	 */
	protected $parentToChildLevel;

	/**
	 * @return mixed
	 */

	public function __constructor() {
	  $this->status = "P";
	  $this->parentToChildLevel = null;

  }

  public function getId(){
	  return $this->id;
  }

	public function getChild() {
		return $this->child;
	}

	public function getParent() {
		return $this->parent;
	}

	public function setChild($orga) {
		$this->child = $orga;
	}

	public function setParent($parent) {
		$this->parent = $parent;
	}

	public function setAsker($asker){
	  $this->asker = $asker;
  }

  public function getAsker(){
	  return $this->asker;
  }

  public function setStatus($status){
    $this->status = $status;
  }

  public function getStatus(){
    return $this->status;
  }

	public function setParentToChildLevel($parentToChildLevel){
		$this->parentToChildLevel = $parentToChildLevel;
	}

	public function getParentToChildLevel(){
		return $this->parentToChildLevel;
	}
}
