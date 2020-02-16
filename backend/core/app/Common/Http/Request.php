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
        $this->cookies = new ParamBag($_COOKIE);
        $this->files = new ParamBag($_FILES);

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