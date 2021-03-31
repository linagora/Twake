<?php

namespace Twake\Core\Services;

use App\App;
use Swift_Signers_DKIMSigner;
use Twake\Core\Entity\MailTask;
use Twake\Core\Services\DoctrineAdapter\ManagerAdapter;
use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twig\Loader\FilesystemLoader;

/**
 * Class TwakeMailer
 * @package Twake\Core\Services
 *
 * This class send mail with twake default template
 */
class TwakeMailer
{

    private $app;
    private $mailer;
    private $mail_parameters;
    private $licenceKey;
    private $standalone;
    private $circle;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->mail_parameters = $app->getContainer()->getParameter("mail");
        $this->licenceKey = $app->getContainer()->getParameter("env.licence_key");
        $this->standalone = $app->getContainer()->getParameter("env.standalone");
        $this->circle = $app->getServices()->get("app.restclient");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
    }

    public function send($mail, $template, $data = Array(), $attachments = Array(), $templateDirectory = "Mail")
    {
        $task = new MailTask(Array(
            "mail" => $mail,
            "data" => $data,
            "template" => $template,
            "attachments" => $attachments,
            "template_directory" => $templateDirectory
        ));

        /** @var ManagerAdapter $em */
        $em = $this->app->getServices()->get("app.twake_doctrine");
        $em->useTTLOnFirstInsert(60 * 60 * 24); //Kept 1 day
        $em->persist($task);
        $em->flush();

        /** @var QueueManager $queues */
        $queues = $this->app->getServices()->get("app.queues")->getAdapter();
        $queues->push("mails", Array(
            "task_id" => $task->getId()
        ));
    }

    public function sendInternal($mail, $template, $data = Array(), $attachments = Array(), $templateDirectory = "Mail")
    {
              
        if(!$mail || !$this->string_cleaner->verifyMail($mail)){
            return false;
        }

        $templateDirectory = "Mail";

        $path = $this->app->getAppRootDir() . "/" . $this->mail_parameters["template_dir"];
        $loader = new FilesystemLoader($path);

        $twig = new \Twig\Environment($loader, [
            'cache' => $this->app->getAppRootDir() . "/" . $this->app->getContainer()->get("configuration", "twig.cache"),
        ]);

        $data["mail"] = $mail;
        $data["twakeaddress"] = $this->mail_parameters["twake_address"];
        $data["twakeurl"] = $this->mail_parameters["twake_domain_url"];

        $data["twakeappurl"] = $this->app->getContainer()->getParameter("frontend_server_name", $this->app->getContainer()->getParameter("server_name", $data["twakeurl"]));

        $language = "en";
        if (isset($data["_language"])) {
            $language = $data["_language"];
            $templateName = $templateDirectory . "/" . $language . "/" . $template . '.html.twig';
            if (!file_exists($path . $templateName)) {
                $language = "en";
            }
        }

        $templateName = $templateDirectory . "/" . $language . "/" . $template . '.html.twig';

        $template = $twig->load($templateName);

        $html = $template->render(
            $data
        );


        if ($this->standalone) {
            return $this->sendHtml($mail, $html, $attachments);
        } else {
            return $this->sendHtmlViaRemote($mail, $html, $attachments);
        }

    }

    public function sendHtml($mail, $html, $attachments = Array())
    {
        //[REMOVE_ONPREMISE]

        if (defined("TESTENV") && TESTENV) {
            return false;
        }

        if (!$this->mailer) {
            $transport = (new \Swift_SmtpTransport($this->mail_parameters["sender"]["host"], $this->mail_parameters["sender"]["port"]))
                ->setUsername($this->mail_parameters["sender"]["username"])
                ->setPassword($this->mail_parameters["sender"]["password"])
                ->setAuthMode($this->mail_parameters["sender"]["auth_mode"]);
            $this->mailer = new \Swift_Mailer($transport);
        }
        
        if(isset($this->mail_parameters["dkim"]) && 
           isset($this->mail_parameters["dkim"]["private_key"]) && $this->mail_parameters["dkim"]["private_key"] !== "" &&
           isset($this->mail_parameters["dkim"]["domain_name"]) && $this->mail_parameters["dkim"]["domain_name"] !== "" &&
           isset($this->mail_parameters["dkim"]["selector"]) && $this->mail_parameters["dkim"]["selector"] !== ""){
            $is_DKIM = true;
        }else{
            $is_DKIM = false;
        }
        
        if($is_DKIM){
            $privateKey = $this->mail_parameters["dkim"]["private_key"];
            $domainName = $this->mail_parameters["dkim"]["domain_name"];
            $selector = $this->mail_parameters["dkim"]["selector"];
            $signer = new Swift_Signers_DKIMSigner($privateKey, $domainName, $selector);
        }

        $this->app->getProviders()->getContainer()['swiftmailer.options'] = $this->mail_parameters["sender"];

        //Sending verification mail
        $message = (new \Swift_Message(""))
            ->setSubject($this->html2title($html))
            ->setFrom($this->mail_parameters["from"], $this->mail_parameters["from_name"])
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

        if($is_DKIM){
            $message->attachSigner($signer);
        }
        
        $this->mailer->send($message);
        
        return true;

        //[/REMOVE_ONPREMISE]

    }

    private function html2title($html)
    {
        $a = explode("<title>", $html, 2)[1];
        $a = explode("<", $a, 2)[0];
        return $a;
    }

    private function html2txt($html)
    {
        $html = explode("</head>", $html);
        $html = preg_replace("/<br *\/>/", "\n\n", $html[1]);
        $html = strip_tags($html);
        $html = preg_replace("/(\r?\n){2,}/m", "\n\n", $html);
        $html = preg_replace("/^\s+/m", "", $html);
        $html = preg_replace("/\s+$/m", "", $html);
        return $html;
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
        
        return true;
    }

}
