<?php

namespace Administration\AuthenticationBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Errors
 *
 * @ORM\Table(name="admin_errors",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="Administration\AuthenticationBundle\Repository\ErrorsRepository")
 */
class Errors
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

	/**
	 * @ORM\Column(name="first_date", type="datetime")
	 */
	private $firstDate;

	/**
	 * @ORM\Column(name="last_date", type="datetime")
	 */
	private $lastDate;

	/**
	 * @ORM\Column(name="number", type="integer")
	 */
	private $number;

	/**
	 * @ORM\Column(name="file", type="text", length=500)
	 */
	private $file;

	/**
	 * @ORM\Column(name="data", type="text")
	 */
	private $data;


    public function __construct($file, $data)
    {
	    $this->firstDate = new \DateTime();
		$this->setFile($file);
		$this->addData($data);
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

	/**
	 * @return mixed
	 */
	public function getFirstDate()
	{
		return $this->firstDate;
	}

	/**
	 * @param mixed $firstDate
	 */
	public function setFirstDate($firstDate)
	{
		$this->firstDate = $firstDate;
	}

	/**
	 * @return mixed
	 */
	public function getLastDate()
	{
		return $this->lastDate;
	}

	/**
	 * @param mixed $lastDate
	 */
	public function setLastDate($lastDate)
	{
		$this->lastDate = $lastDate;
	}

	/**
	 * @return mixed
	 */
	public function getNumber()
	{
		return $this->number;
	}

	/**
	 * @return mixed
	 */
	public function getFile()
	{
		return $this->file;
	}

	/**
	 * @param mixed $file
	 */
	public function setFile($file)
	{
		$this->file = $file;
	}

	/**
	 * @return mixed
	 */
	public function getData()
	{
		return json_decode($this->data, 1);
	}


    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "first_date" => $this->getFirstDate(),
            "last_date" => $this->getLastDate(),
            "number" => $this->getNumber(),
            "file" => $this->getFile(),
            "data" => $this->getData()
        );
    }

	/**
	 * @param mixed $data
	 */
	public function addData($data)
	{
		$cdata = $this->getData();
		if(isset($data["line"])){
			$cdata[$data["line"]] = $data["desc"];
		}
		$this->data = json_encode($cdata);
		$this->number += 1;
		$this->lastDate = new \DateTime();
	}



}
