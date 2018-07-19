<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/07/18
 * Time: 16:47
 */

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * TaskList
 *
 * @ORM\Table(name="taskList",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\TaskListRepository")
 */
class TaskList implements ObjectLinksInterface
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\BoardTask")
     */
    private $boardTask;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\ListOfTasks")
     */
    private $listOfTask;


    public  function __construct(BoardTask $boardTask, ListOfTasks $listOfTask)
    {
        $this->setBoardTask($boardTask);
        $this->setListOfTask($listOfTask);
    }

    /**
     * @return mixed
     */
    public function getBoardTask()
    {
        return $this->boardTask;
    }

    /**
     * @param mixed $boardTask
     */
    public function setBoardTask($boardTask)
    {
        $this->boardTask = $boardTask;
    }

    /**
     * @return mixed
     */
    public function getListOfTask()
    {
        return $this->listOfTask;
    }

    /**
     * @param mixed $listOfTask
     */
    public function setListOfTask($listOfTask)
    {
        $this->listOfTask = $listOfTask;
    }


    public function getRepository()
    {
        // TODO: Implement getRepository() method.
    }

    public function getAsArrayFormated()
    {
        // TODO: Implement getAsArrayFormated() method.
    }
}