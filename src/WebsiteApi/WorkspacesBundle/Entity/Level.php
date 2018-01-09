<?php
    namespace WebsiteApi\WorkspacesBundle\Entity;
    use Doctrine\ORM\Mapping as ORM;

    /**
     * Right
     *
     * @ORM\Table(name="level",options={"engine":"MyISAM"})
     * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\LevelRepository")
     */
    class Level
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
    	 * @ORM\Column(name="name", type="string", length=255)
    	 */
        protected $name;

        /**
         * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
    	 */
        protected $groupe;

        /**
    	 * @ORM\Column(name="droit", type="string", length=100000)
    	 */
         protected $right;

         /**
     	 * @ORM\Column(name="owner", type="boolean", length=1)
     	 */
         protected $owner;

         /**
     	 * @ORM\Column(name="isDefault", type="boolean", length=1)
     	 */
         protected $isDefault;

	    /**
	     * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser", mappedBy="level")
	     */
	    private $members;


         function __construct(){
             $right = "";
         }

         public function getId(){
             return $this->id;
         }


         public function getName(){
             return $this->name;
         }
         public function setName($x){
             $this->name = $x;
         }

         public function getGroup(){
             return $this->groupe;
         }
         public function setGroup($x){
             $this->groupe = $x;
         }

         public function getRight(){
             return json_decode($this->right);
         }

         public function setRight($array){
              $this->right = json_encode($array);
         }

         public function getOwner(){
             return $this->owner;
         }
         public function setOwner($x){
             $this->owner = $x;
         }

         public function getDefault(){
             return $this->isDefault;
         }
         public function setDefault($x){
             $this->isDefault = $x;
         }

	    public function getLinksMembers(){
		    return $this->members;
	    }

	    public function getAsArray() {
	    	return Array(
	    		"id" => $this->getId(),
	    		"name" => $this->getName()
		    );
	    }
    }

 ?>
