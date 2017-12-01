<?php
    namespace WebsiteApi\UsersBundle\Entity;
    use Doctrine\ORM\Mapping as ORM;

    /**
     * Right
     *
     * @ORM\Table(name="notification",options={"engine":"MyISAM"})
     * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\NotificationRepository")
     */
    class Notification
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
         * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User", cascade={"persist"})
         */
        protected $user;

        /**
         * @ORM\Column(name="fromType", type="string", length=100)
         */
        protected $fromType;

        /**
         * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
         * @ORM\JoinColumn(columnDefinition="integer", name="fromUser", nullable=true)
         */
        protected $fromUser;

        /**
         * @ORM\ManyToOne(targetEntity="WebsiteApi\OrganizationsBundle\Entity\Orga")
         * @ORM\JoinColumn(columnDefinition="integer", name="fromGroup", nullable=true)
         */
        protected $fromGroup;

        /**
         * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
         * @ORM\JoinColumn(columnDefinition="integer", name="fromApp", nullable=true)
         */
        protected $fromApp;

        /**
         * @ORM\Column(name="route", type="string", length=255)
         */
        protected $route;

        /**
         * @ORM\Column(name="data", type="string", length=8160)
         */
        protected $data;

        /**
         * @ORM\Column(name="date", type="datetime")
         */
        protected $date;

        /**
         * @ORM\Column(name="isRead", type="boolean")
         */
        protected $isRead;

        /**
         * @ORM\Column(name="dateRead", type="datetime",nullable=true)
         */
        protected $dateRead;

	    /**
	     * @ORM\Column(name="isClassic", type="boolean")
	     */
	    protected $isClassic;

	    /**
	     * @ORM\Column(name="isClassicGroup", type="boolean")
	     */
	    protected $isClassicGroup;

        /**
         * @ORM\Column(name="isDelayed", type="boolean")
         */
        protected $isDelayed;

        /**
         * @ORM\Column(name="isInvisible", type="boolean")
         */
        protected $isInvisible;


        public function __construct(){
            $this->date = new \DateTime();
	        $this->isRead = false;
	        $this->setData(Array());
        }

        /**
         * @return int
         */
        public function getId()
        {
            return $this->id;
        }

        /**
         * @param int $id
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
        public function getFromType()
        {
            return $this->fromType;
        }

        /**
         * @param mixed $fromType
         */
        public function setFromType($fromType)
        {
            $this->fromType = $fromType;
        }

        /**
         * @return mixed
         */
        public function getFromUser()
        {
            return $this->fromUser;
        }

        /**
         * @param mixed $fromUser
         */
        public function setFromUser($fromUser)
        {
            $this->fromUser = $fromUser;
        }

        /**
         * @return mixed
         */
        public function getFromGroup()
        {
            return $this->fromGroup;
        }

        /**
         * @param mixed $fromGroup
         */
        public function setFromGroup($fromGroup)
        {
            $this->fromGroup = $fromGroup;
        }

        /**
         * @return mixed
         */
        public function getFromApp()
        {
            return $this->fromApp;
        }

        /**
         * @param mixed $fromApp
         */
        public function setFromApp($fromApp)
        {
            $this->fromApp = $fromApp;
        }

        /**
         * @return mixed
         */
        public function getRoute()
        {
            return $this->route;
        }

        /**
         * @param mixed $route
         */
        public function setRoute($route)
        {
            $this->route = $route;
        }

        /**
         * @return mixed
         */
        public function getData()
        {
            return json_decode($this->data, 1);
        }

        /**
         * @param mixed $data
         */
        public function setData($data)
        {
            $this->data = json_encode($data);
        }

        /**
         * @return mixed
         */
        public function getDate()
        {
            return $this->date;
        }

        /**
         * @param mixed $date
         */
        public function setDate($date)
        {
            $this->date = $date;
        }

        /**
         * @return mixed
         */
        public function isRead()
        {
            return $this->isRead;
        }

        /**
         * @param mixed $isRead
         */
        public function setIsRead($isRead)
        {
            $this->isRead = $isRead;
        }

        /**
         * @return mixed
         */
        public function getDateRead()
        {
            return $this->dateRead;
        }

        /**
         * @param mixed $dateRead
         */
        public function setDateRead($dateRead)
        {
            $this->dateRead = $dateRead;
        }

	    /**
	     * @return mixed
	     */
	    public function isClassic()
	    {
		    return $this->isClassic;
	    }

	    /**
	     * @param mixed $isClassic
	     */
	    public function setIsClassic($isClassic)
	    {
		    $this->isClassic = $isClassic;
	    }

	    /**
	     * @return mixed
	     */
	    public function isClassicGroup()
	    {
		    return $this->isClassicGroup;
	    }

	    /**
	     * @param mixed $isClassic
	     */
	    public function setIsClassicGroup($isClassicGroup)
	    {
		    $this->isClassicGroup = $isClassicGroup;
	    }

        /**
         * @return mixed
         */
        public function isDelayed()
        {
            return $this->isDelayed;
        }

        /**
         * @param mixed $isDelayed
         */
        public function setIsDelayed($isDelayed)
        {
            $this->isDelayed = $isDelayed;
        }

        /**
         * @return mixed
         */
        public function isInvisible()
        {
            return $this->isInvisible;
        }

        /**
         * @param mixed $isInvisible
         */
        public function setIsInvisible($isInvisible)
        {
            $this->isInvisible = $isInvisible;
        }

        public function read(){
            $this->isRead = true;
            $this->dateRead = new \DateTime();
        }


	    public function getAsArray(){

		    $data = $this->getData();
        $data["id"] = $this->getId();
		    $data["route"] = $this->getRoute();
		    $data["isread"] = $this->isRead();
		    $data["date"] = $this->getDate()->format('Y-m-d H:i');
		    $data["timestamp"] = $this->getDate()->format('U');

		    return $data;
	    }

    }


?>
