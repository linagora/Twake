<?php

namespace WebsiteApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Mail
 *
 * @ORM\Table(name="verification_number_mail",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\VerificationNumberMailRepository")
 */
class VerificationNumberMail
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="cassandra_timeuuid")  //TO ADD FOR CASSANDRA
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")  //TO ADD FOR CASSANDRA
	 */
	private $id;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="mail", type="string", length=256)
	 */
	private $mail;

	/**
	 * @var string
	 *
	 * @ORM\Column(name="hash_code", type="string", length=256)
	 */
	private $hashCode;

	/**
	 * @var string
	 *
     * @ORM\Column(name="token_column", type="string", length=256, options={"index": true})
	 */
	private $token = "";

	/**
	 * @var \DateTime
	 *
     * @ORM\Column(name="date", type="cassandra_datetime")  //TO ADD FOR CASSANDRA (replace datetime)
	 */
	private $date = "";

	/**
	 * @ORM\Column(name="validity_time", type="integer")
	 */
	private $validityTime;


	/**
	 * @ORM\Column(name="clean_code", type="string")
	 */
	private $clean_code;


	public function __construct($mail, $validityTime = 3600)
	{
		$this->mail = $mail;
		$this->token = bin2hex(random_bytes(128));
		$this->hashCode = bin2hex(random_bytes(128));
		$this->date = new \DateTime();
		$this->validityTime = max(3600, $validityTime);
	}

	public function getCode(){
		$code = substr(bin2hex(random_bytes(5)), 0, 9);
		$this->clean_code = $code;
		$this->hashCode = $this->hash($code);
		//Prettify
		$code = str_split($code, 3);
		$code = join("-", $code);
		return $code;
	}

	public function verifyCode($code){
		if($this->date->format('U') < (new \DateTime())->format('U') - $this->validityTime){
			return false;
		}
		$code = preg_replace("/[^a-z0-9]/","",strtolower($code));
		return $this->hash($code) == $this->hashCode;
	}

	private function hash($str){
		return hash("sha512", $str);
	}

	/**
	 * @return string
	 */
	public function getToken()
	{
		return $this->token;
	}

	public function getMail(){
		return $this->mail;
	}

	/**
	 * @return int
	 */
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

}

