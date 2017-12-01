<?php


namespace WebsiteApi\MarketBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Message
 *
 * @ORM\Table(name="link_app_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\MarketBundle\Repository\LinkAppUserRepository")
 */


class LinkAppUser
{
  /**
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="AUTO")
   */
  private $id;


  /**
   * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
   */
  private $application;

  /**
   *
   * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", inversedBy="applicationsLinks")
   */
  protected $user;

  /**
   * @ORM\Column(name="score", type="integer", length=1)
   */
  private $score = 0;

  public function getId(){
    return $this->id;
  }

  /**
   * @return mixed
   */
  public function getApplication()
  {
    return $this->application;
  }

  /**
   * @param mixed $application
   */
  public function setApplication($application)
  {
    $this->application = $application;
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
  public function getScore()
  {
    return $this->score;
  }

  /**
   * @param mixed $score
   */
  public function setScore($score)
  {
    $this->score = $score;
  }


}