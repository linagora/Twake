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
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
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
	 * @ORM\Column(name="token", type="string", length=256)
	 */
	private $token = "";

	/**
	 * @var \DateTime
	 *
	 * @ORM\Column(name="date", type="datetime")
	 */
	private $date = "";

	/**
	 * @ORM\Column(name="validity_time", type="integer")
	 */
	private $validityTime;


	public function __construct($mail, $validityTime = 3600)
	{
		$this->mail = $mail;
		$this->token = bin2hex(random_bytes(128));
		$this->hashCode = bin2hex(random_bytes(128));
		$this->date = new \DateTime();
		$this->validityTime = $validityTime;
	}

	public function getCode(){
		$code = substr(bin2hex(random_bytes(5)), 0, 9);
		error_log(($code));
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
		$code = preg_replace("/[^a-z0-9 ]/","",strtolower($code));
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


}

