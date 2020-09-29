<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class UsersAccount extends BaseController
{

    public function setLanguage(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $language = $request->request->get("language", "");
            $this->get("app.user")->updateLanguage($this->getUser()->getId(), $language);

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function getNotificationPreferences(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $data["data"] = $this->get("app.user")->getNotificationPreferences($this->getUser()->getId());

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function setNotificationPreferences(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $notification = $request->request->get("preferences", Array());
            $this->get("app.user")->setNotificationPreferences($this->getUser()->getId(), $notification);

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function setTutorialStatus(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $status = $request->request->get("status", Array());
            $this->get("app.user")->setTutorialStatus($this->getUser()->getId(), $status);

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function updateNotificationPreferenceByWorkspace(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaceId = $request->request->get("workspaceId", 0);
        $appNotif = $request->request->get("appNotification", Array());

        $res = $this->get("app.user")->updateNotificationPreferenceByWorkspace($workspaceId, $appNotif, $this->getUser());

        if ($res) {
            $data["data"] = "success";
        } else {
            $data["error"][] = "error";
        }

        return new Response($data);
    }

    public function setWorkspacesPreferences(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $preferences = $request->request->get("preferences", Array());
            $this->get("app.user")->setWorkspacesPreferences($this->getUser()->getId(), $preferences);

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function updateStatus(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $status = $request->request->get("status", Array());
            $this->get("app.user")->updateStatus($this->getUser()->getId(), $status);

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function setIdentity(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $firstname = $request->request->get("firstname", "");
            $lastname = $request->request->get("lastname", "");
            $thumbnail = $request->request->get("thumbnail", null);

            $user = null;

            if (isset($_FILES["thumbnail"])) {
                $thumbnail = $this->getUploader()->uploadFiles($this->getUser(), $_FILES["thumbnail"], "prfl");
                $thumbnail = $thumbnail[0];

                if (count($thumbnail["errors"]) > 0) {
                    $data["errors"][] = "badimage";
                } else {
                    $user = $this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail["file"], $this->getUploader());
                }
            } else {
                $user = $this->get("app.user")->updateUserBasicData($this->getUser()->getId(), $firstname, $lastname, $thumbnail, $this->getUploader());
            }

            if ($user) {
                $data["data"] = $user->getAsArray();
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function getUploader()
    {
        $storage = $this->getParameter('storage');
        if (isset($storage["S3"]["use"]) && $storage["S3"]["use"]) {
            return $this->get("app.aws_uploader");
        }
        if (isset($storage["use"]) && $storage["use"]) {
            return $this->get("app.openstack_uploader");
        }
        return $this->get("app.uploader");
    }

    public function setUsername(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $username = $request->request->get("username", "");

            if (!$this->get("app.user")->changePseudo($this->getUser()->getId(), $username)) {
                $data["errors"][] = "alreadyused";
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function setPassword(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $oldPassword = $request->request->get("old_password", "");
            $password = $request->request->get("password", "");

            if (!$this->get("app.user")->changePassword($this->getUser()->getId(), $oldPassword, $password)) {
                $data["errors"][] = "badpassword";
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function setMainMail(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $mail = $request->request->get("mail", "");

            if (!$this->get("app.user")->changeMainMail($this->getUser()->getId(), $mail)) {
                $data["errors"][] = "nosuchid";
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function removeMail(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $mail = $request->request->get("mail", "");
            $result = $this->get("app.user")->removeSecondaryMail($this->getUser()->getId(), $mail);
            if (!$result) {
                $data["errors"][] = "badmail";
            }
            $data["statuts"] = $result;

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function addMail(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {
            $mail = $request->request->get("mail", "");

            $token = $this->get("app.user")->addNewMail($this->getUser()->getId(), $mail);
            if ($token) {
                $data["data"]["token"] = $token;
            } else {
                $data["errors"][] = "badmail";
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function addMailVerify(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $token = $request->request->get("token", "");
            $number = $request->request->get("code", "");

            $idMail = $this->get("app.user")->checkNumberForAddNewMail($this->getUser()->getId(), $token, $number);

            if ($idMail) {
                $data["data"]["status"] = "success";
                $data["data"]["idMail"] = $idMail;

            } else {
                $data["errors"][] = "badcode";
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

    public function getMails(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        if ($this->getUser() && !is_string($this->getUser())) {

            $mails = $this->get("app.user")->getSecondaryMails($this->getUser()->getId());
            foreach ($mails as $mail) {
                $data["data"][] = Array(
                    "id" => $mail->getId(),
                    "main" => $mail->getMail() == $this->getUser()->getEmail(),
                    "email" => $mail->getMail()
                );
            }

        } else {
            $data["errors"][] = "unknown";
        }

        return new Response($data);

    }

}