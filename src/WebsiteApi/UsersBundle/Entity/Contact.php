<?php

namespace WebsiteApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Contact
 *
 * @ORM\Table(name="contact",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\ContactRepository")
 */
class Contact
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
     * @var int
     *
     * Utilisateur initiateur de la demande
     *
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     * @ORM\JoinColumn(columnDefinition="integer", name="userA_id")
     */
    private $userA;

    /**
     * @var int
     *
     * Utilisateur récepteur de la demande
     *
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     * @ORM\JoinColumn(columnDefinition="integer", name="userB_id");
     */
    private $userB;

	/**
	 * @var string
	 * @ORM\Column(name="usernameAcache", type="string", length=30)
	 */
	private $usernameAcache;

	/**
	 * @var string
	 * @ORM\Column(name="usernameBcache", type="string", length=30)
	 */
	private $usernameBcache;


	/**
	 * @var string
	 *
	 * Si le second utilisateur n'a pas de compte, la demande est faite en renseignant un mail, en attendant que le compte soit créé ou que le mail soit ajouté à un utilisateur.
	 *
	 * @ORM\Column(name="userBmail", type="string", length=320, nullable=true)
	 */
	private $userBmail;

    /**
     * @var string
     *
     * W : Waiting en attente
     * A : accepté
     * B : bloqué (non implementé)
     *
     * @ORM\Column(name="status", type="string", length=1)
     */
    private $status;

	/**
	 * @var int
	 *
	 * Date de lancement de la demande de lien
	 *
	 * @ORM\Column(name="date", type="bigint")
	 */
	private $date;

	/**
	 * @var int
	 *
	 * Date de création du lien
	 *
	 * @ORM\Column(name="dateAccepted", type="bigint", nullable=true)
	 */
	private $dateAccepted;

	/**
	 * @ORM\Column(type="datetime", nullable=true)
	 */
	private $lastMessageDate;



	//Création du lien
	public function link($userA, $userB){
		$this->userA = $userA;
		$this->userB = $userB;
		$this->usernameAcache = $userA->getUsernameClean();
		$this->usernameBcache = $userB->getUsernameClean();
		$this->status = "W";
		$this->date = date('U');
		$this->lastMessageDate = new \DateTime("1970-01-01");
	}

	//Création du lien avec un mail
	public function linkMail($userA, $mailB){
		$this->userA = $userA;
		$this->usernameAcache = $userA->getUsernameClean();
		$this->usernameBcache = "";
		$this->userBmail = $mailB;
		$this->status = "W";
		$this->date = date('U');
	}

	//Acceptation du lien
	public function accept(){
		$this->status = "A";
		$this->dateAccepted = date('U');
	}

	public function getLastMessageDate() {
		if ($this->lastMessageDate == null) {
			return new \DateTime("1970-01-01");
		}
		return $this->lastMessageDate;
	}

	public function updateLastMessageDate() {
		$this->lastMessageDate = new \DateTime("now");
	}


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
     * Set userA
     *
     * @param integer $userA
     *
     * @return Contact
     */
    public function setUserA($userA)
    {
        $this->userA = $userA;
	    $this->usernameAcache = $userA->getUsernameClean();

        return $this;
    }

    /**
     * Get userA
     *
     * @return int
     */
    public function getUserA()
    {
        return $this->userA;
    }

    /**
     * Set userB
     *
     * @param integer $userB
     *
     * @return Contact
     */
    public function setUserB($userB)
    {
        $this->userB = $userB;
	    $this->usernameBcache = $userB->getUsernameClean();

        return $this;
    }

    /**
     * Get userB
     *
     * @return int
     */
    public function getUserB()
    {
        return $this->userB;
    }

    /**
     * Set status
     *
     * @param string $status
     *
     * @return Contact
     */
    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Get status
     *
     * @return string
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * Set date
     *
     * @param integer $date
     *
     * @return Contact
     */
    public function setDate($date)
    {
        $this->date = $date;

        return $this;
    }

    /**
     * Get date
     *
     * @return int
     */
    public function getDate()
    {
        return $this->date;
    }
}

