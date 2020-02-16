<?php

namespace Common\Http;

class Response
{

    private $content = "";
    private $status = 200;
    private $cookies = [];
    /** @var ParamBag */
    public $headers = [];

    public function __construct($content = "", $status = 200)
    {
        $this->setContent($content);
        $this->httpStatus($status);
        $this->headers = new ParamBag([]);
    }

    public function setHeader($header, $replace = true)
    {
        $headers = $this->headers->all();
        $header = explode(":", $header);
        $header_name = array_shift($header);
        $header_value = join(":", $header);
        $headers[$header_name] = $header_value;
        $this->headers->reset($headers);
    }

    public function setCookie(Cookie $cookie)
    {
        $this->cookies[$cookie->getName()] = $cookie;
    }

    public function clearCookie($name)
    {
        $this->cookies[$name] = new Cookie($name, null, 1, "/");
    }

    public function getContent()
    {
        if (is_array($this->content)) {
            return json_encode($this->content);
        }
        return $this->content;
    }

    public function setContent($content)
    {
        $this->content = $content;
    }

    public function httpStatus($code)
    {
        $this->status = $code;
    }

    public function sendHeaders()
    {
        if (defined("TESTENV") && TESTENV) {
            return;
        }
        foreach ($this->cookies as $cookie) {
            header("Set-Cookie: " . $cookie, false);
        }
        foreach ($this->headers->all() as $name => $value) {
            header($name . ": " . $value, true);
        }

    }

    public function send()
    {
        $this->sendHeaders();
        http_response_code($this->status);
        if (is_array($this->content)) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $this->getContent();
    }

}