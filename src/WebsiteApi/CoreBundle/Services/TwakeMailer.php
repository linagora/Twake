<?php

namespace WebsiteApi\CoreBundle\Services;

/**
 * Class TwakeMailer
 * @package WebsiteApi\CoreBundle\Services
 *
 * This class send mail with twake default template
 */
class TwakeMailer
{

	private $mailer;
	private $templating;
	private $mailfrom;
	private $twakeurl;
	private $twakeaddress;

	public function __construct($mailer, $templating, $mailfrom, $twakeurl)
	{
		$this->mailer = $mailer;
		$this->templating = $templating;
		$this->mailfrom = $mailfrom;
		$this->twakeurl = $twakeurl;
		$this->twakeaddress = "Twake, 54000 Nancy, France";
	}

	public function send($mail, $template, $data = Array()){

		$data["mail"] = $mail;
		$data["twakeaddress"] = $this->twakeaddress;
		$data["twakeurl"] = $this->twakeurl;

		$html = $this->templating->render(
			'TwakeCoreBundle:Mail:'.$template.'.html.twig',
			$data
		);

		//Sending verification mail
		$message = \Swift_Message::newInstance()
			->setSubject($this->html2title($html))
			->setFrom($this->mailfrom)
			->setTo($mail)
			->setBody(
				$html,
				'text/html'
			)
			->addPart(
				$this->html2txt($html),
				'text/plain'
			)
		;
		$res = $this->mailer->send($message);

		//TODO remove
		error_log($res);
		error_log($this->html2txt($html));

	}

	private function html2txt($html){
		$html = str_replace("<br>", "\n", $html);
		return strip_tags($html);
	}

	private function html2title($html){
		$a = explode("<title>", $html, 2)[1];
		return explode("<", $a, 1)[0];
	}

}