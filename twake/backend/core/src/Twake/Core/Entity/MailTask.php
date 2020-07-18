<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="mail_task",options={"engine":"MyISAM",
 *
 *     "scylladb_keys": {{"id":"ASC"}}
 * })
 * @ORM\Entity()
 */
class MailTask
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $data;

    /**
     * MailTask constructor.
     * @param $data
     */
    public function __construct($data)
    {
        $this->setData($data);
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id): void
    {
        $this->id = $id;
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
    public function setData($data): void
    {
        $this->data = json_encode($data);
    }


}
