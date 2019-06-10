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
    private $licenceKey;
    private $standalone;
    private $circle;

    public function __construct($mailer, $templating, $mailfrom, $twakeurl, $standalone, $licenceKey, $circle)
	{
		$this->mailer = $mailer;
		$this->templating = $templating;
		$this->mailfrom = $mailfrom;
		$this->twakeurl = $twakeurl;
		$this->twakeaddress = "Twake, 54000 Nancy, France";
        $this->licenceKey = $licenceKey;
        $this->standalone = $standalone;
        $this->circle = $circle;

    }

    public function send($mail, $template, $data = Array(), $attachments = Array(), $templateDirectory = "TwakeCoreBundle:Mail")
    {


		$data["mail"] = $mail;
		$data["twakeaddress"] = $this->twakeaddress;
		$data["twakeurl"] = $this->twakeurl;

        $language = "en";
        if (isset($data["_language"])) {
            $language = "fr";
            $templateName = $templateDirectory . ":" . $language . "/" . $template . '.html.twig';
            if (!$this->templating->exists($templateName)) {
                $language = "en";
            }
        }

        $templateName = $templateDirectory . ":" . $language . "/" . $template . '.html.twig';

		$html = $this->templating->render(
            $templateName,
			$data
		);

        if ($this->standalone) {
            $this->sendHtml($mail, $html, $attachments);
        } else {
            $this->sendHtmlViaRemote($mail, $html, $attachments);
        }

    }

    public function sendHtmlViaRemote($mail, $html, $attachments = Array())
    {
        $final_attachments = [];
        foreach ($attachments as $attachment) {
            if ($attachment["type"] == "raw") {
                $final_attachments[] = $attachment;
            }
        }

        $masterServer = "https://app.twakeapp.com/api/remote";
        $data = Array(
            "licenceKey" => $this->licenceKey,
            "mail" => $mail,
            "html" => $html,
            "attachments" => $final_attachments
        );
        $this->circle->post($masterServer . "/mail", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
    }

    public function sendHtml($mail, $html, $attachments = Array())
    {
        //[REMOVE_ONPREMISE]

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
            ->setFrom($this->mailfrom, "Twake")
            ->setTo($mail)
            ->setBody(
                $html,
                'text/html'
            )
            ->addPart(
                $this->html2txt($html),
                'text/plain'
            );

        foreach ($attachments as $attachment) {
            if ($attachment["type"] == "path") {
                $message->attach(\Swift_Attachment::fromPath($attachment["path"]));
            }
            if ($attachment["type"] == "raw") {
                $message->attach(new \Swift_Attachment($attachment["data"], $attachment["filename"], $attachment["mimetype"]));
            }
        }


        $message->attachSigner($signer);

        $this->mailer->send($message);

        //[/REMOVE_ONPREMISE]

    }

	private function html2txt($html){
		$html = explode("</head>", $html);
		$html = str_replace("<br>", "\n", $html[1]);
        $html = preg_replace("/(\r?\n)\s/", "\n", $html);
        $html = preg_replace("/(\r?\n){2,}/", "\n\n", $html);
		return strip_tags($html);
	}

	private function html2title($html){
		$a = explode("<title>", $html, 2)[1];
		$a = explode("<", $a, 2)[0];
		return $a;
	}

}