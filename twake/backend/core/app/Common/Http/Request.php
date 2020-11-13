<?php

namespace Common\Http;


class Request
{

    private $content = "";
    /** @var ParamBag */
    public $headers = [];
    /** @var ParamBag */
    public $query = [];
    /** @var ParamBag */
    public $request = [];
    /** @var ParamBag */
    public $cookies = [];
    public $files = [];

    public function __construct()
    {

        $this->headers = new ParamBag(getallheaders());
        $this->content = file_get_contents('php://input');
        $this->query = new ParamBag($_GET);
        $this->request = new ParamBag($_POST);
        $this->files = new ParamBag($_FILES);

        //Get all cookies
        $cookies = $_COOKIE;
        $header_cookies = [];
        try {
            $all_cookies = isset(getallheaders()["Authorization"]) ? explode("Bearer ", getallheaders()["Authorization"])[1] : false;
            $all_cookies = $all_cookies ? $all_cookies : (isset(getallheaders()["All-Cookies"]) ? getallheaders()["All-Cookies"] : "[]");
            $header_cookies = json_decode($all_cookies, 1);
        } catch (\Exception $err) {
            $header_cookies = [];
        }
        foreach ($header_cookies as $cookie) {
            $cookies[$cookie[0]] = $cookie[1];
        }
        $this->cookies = new ParamBag($cookies);

        if (0 === strpos($this->headers->get('Content-Type'), 'application/json')) {
            $data = json_decode($this->getContent(), true);
            $this->request = new ParamBag(is_array($data) ? $data : array());
        }

    }

    public function getContent()
    {
        return $this->content;
    }
}
