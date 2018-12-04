<?php

namespace Administration\AuthenticationBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

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
     * @ORM\Column(name="first_date", type="cassandra_datetime")
	 */
    private $firstdate;

	/**
     * @ORM\Column(name="last_date", type="cassandra_datetime")
	 */
    private $lastdate;

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
        $this->firstdate = new \DateTime();
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
        return $this->firstdate;
	}

	/**
     * @param mixed $firstdate
	 */
    public function setFirstDate($firstdate)
    {
        $this->firstdate = $firstdate;
	}

	/**
	 * @return mixed
	 */
	public function getLastDate()
	{
        return $this->lastdate;
	}

	/**
     * @param mixed $lastdate
	 */
    public function setLastDate($lastdate)
    {
        $this->lastdate = $lastdate;
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
        $this->lastdate = new \DateTime();
	}



}
