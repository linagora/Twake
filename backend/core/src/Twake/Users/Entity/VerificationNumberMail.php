<?php

namespace Twake\Users\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="verification_number_mail",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class VerificationNumberMail
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")  //TO ADD FOR CASSANDRA
     * @ORM\Id
     *
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="mail", type="twake_no_salt_text")
     */
    private $mail;

    /**
     * @ORM\Column(name="verified", type="twake_boolean")
     */
    private $verified = false;

    /**
     * @var string
     *
     * @ORM\Column(name="hash_code", type="twake_text")
     */
    private $hashcode;

    /**
     * @var string
     *
     * @ORM\Column(name="token_column", type="string", length=256, options={"index": true})
     */
    private $token = "";

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="date", type="twake_datetime")  //TO ADD FOR CASSANDRA (replace datetime)
     */
    private $date = "";

    /**
     * @ORM\Column(name="validity_time", type="integer")
     */
    private $validitytime;


    /**
     * @ORM\Column(name="clean_code", type="twake_text")
     */
    private $clean_code;


    public function __construct($mail, $validitytime = 3600)
    {
        $this->mail = $mail;
        $this->token = bin2hex(random_bytes(40));
        $this->hashcode = bin2hex(random_bytes(128));
        $this->date = new \DateTime();
        $this->validitytime = max(3600, $validitytime);
    }

    public function getCode()
    {
        $code = substr(bin2hex(random_bytes(5)), 0, 9);
        $this->clean_code = $code;
        $this->hashcode = $this->hash($code);
        //Prettify
        $code = str_split($code, 3);
        $code = join("-", $code);
        return $code;
    }

    public function verifyCode($code)
    {
        if ($this->date->format('U') < (new \DateTime())->format('U') - $this->validitytime) {
            return false;
        }
        $code = preg_replace("/[^a-z0-9]/", "", strtolower($code));
        return $this->hash($code) == $this->hashcode;
    }

    private function hash($str)
    {
        return hash("sha512", $str);
    }

    /**
     * @return string
     */
    public function getToken()
    {
        return $this->token;
    }

    public function getMail()
    {
        return $this->mail;
    }

    /**
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    /**
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return mixed
     */
    public function getCleanCode()
    {
        return $this->clean_code;
    }

    /**
     * @return mixed
     */
    public function getVerified()
    {
        return $this->verified;
    }

    /**
     * @param mixed $verified
     */
    public function setVerified($verified)
    {
        $this->verified = $verified;
    }

}

