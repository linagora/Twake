<?php

namespace WebsiteApi\CoreBundle\Services;

use Swift_Signers_DKIMSigner;

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

		$privateKey = "-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCst5XO6IcnC/KTyRLgL83HqTLew6/ozMw6IRpS9KvLytg0E8fz
CNCE4JaN8N5kD6u9b8DZs2EkS6kGnJCDwBBuNFjIVLSZpQbyMnTZ19nBZRtUXsiw
X3GoQX6RbQqe3ToKUxBpBp5vw7OJi1nCW9WlYhIr2PFC50wBM1H4ea4nLQIDAQAB
AoGAJWbcGiJgoiQEM9ynKcUwWrxZN8RIo7E1yKDCgpRZX5hdmWlvM0IFZcD82V//
yMtb9Xnt2TbvIl0ADV56LQ26gMfe93E6GniMeST9AOOVaGzFIF+vbpNxnIMZEqMQ
wXKxMHyFhUe+xkqESUmvpTexNKfdSA8ukEwZ8BmwK/jK5kECQQDWMwM4lZ4SwjPd
IjM893hqV82od9BLCdiVCHT7DKx4Rpcp2yNLnA/gp+PrJc3dEbs3nQE0NV78DkNr
oW/hiOIXAkEAzmw0OPRYdP5Kkq/EUlQSGo4vLPCChGJUD+6l5RZlxwgsNBEpyMoh
YPqM13SfzJM0due/V9flK2rVYYP8KqMfWwJBAJs2MdJR0E5lfPFzM8+svwvH/hVi
ZIPLaa5sh1/XSi6JcEX7LfM+7d5rqeMd7LORgqkE0veC6QYaS851F75E0xcCQHVO
AkNXgClEFSbU4dETW5JhuKdmKhWHN1Qyf233U3FO0KfqFP+49k0BNSZ/bQw5nzfv
LMqDswUAWjBna9bjCj8CQH30g2ivHYvWnihCGwIXZBMnXzTf3R/JaRX6+5KBy/T/
DatZafd1kdkDFLEB6VpXkA2yyRfmL9JMKbnezGjN8aU=
-----END RSA PRIVATE KEY-----
";
		$domainName = 'twakeapp.com';
		$selector = '1521790800.twakeapp';
		$signer = new Swift_Signers_DKIMSigner($privateKey, $domainName, $selector);

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

		$message->attachSigner($signer);

		$res = $this->mailer->send($message);

		//TODO remove
		//error_log($res);
		//error_log($this->html2txt($html));

	}

	private function html2txt($html){
		$html = explode("</head>", $html);
		$html = str_replace("<br>", "\n", $html[1]);
		return strip_tags($html);
	}

	private function html2title($html){
		$a = explode("<title>", $html, 2)[1];
		$a = explode("<", $a, 2)[0];
		return $a;
	}

}