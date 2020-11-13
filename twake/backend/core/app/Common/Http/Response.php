<?php

namespace Common\Http;

use WebSocket\Exception;

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

    public function getCookies()
    {
        return $this->cookies;
    }

    public function setCookie(Cookie $cookie)
    {
        $this->cookies[$cookie->getName()] = $cookie;
    }

    public function getCookiesValues()
    {
        $key_value = [];
        foreach ($this->cookies as $name => $cookie) {
            $key_value[$name] = $cookie->getValue();
        }
        return $key_value;
    }

    public function clearCookie($name)
    {
        $this->cookies[$name] = new Cookie($name, null, 1, "/");
    }

    public function getContent()
    {
        if (is_array($this->content)) {
            $this->content["_cookies"] = $this->getCookiesValues();
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

    public function getHttpStatus()
    {
        return $this->status;
    }

    public function sendHeaders()
    {
        if(headers_sent()){
            return;
        }
        if (defined("TESTENV") && TESTENV) {
            return;
        }
        $all_cookies = [];
        foreach ($this->cookies as $cookie) {
            header("Set-Cookie: " . $cookie, false);
            $all_cookies[] = $cookie->asArray();
        }
        header("All-Cookies: " . json_encode($all_cookies), true);
        foreach ($this->headers->all() as $name => $value) {
            header($name . ": " . $value, true);
        }
        header("Access-Control-Expose-Headers: All-Cookies");
    }

    public function send()
    {
        $this->sendHeaders();
        http_response_code($this->status);
        if (is_array($this->content) && !headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $this->getContent();
    }

}
