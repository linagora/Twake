<?php

namespace Common\Http;


class Cookie
{

    protected $name;
    protected $value;
    protected $expire;
    protected $path;

    private static $reservedCharsFrom = ['=', ',', ';', ' ', "\t", "\r", "\n", "\v", "\f"];
    private static $reservedCharsTo = ['%3D', '%2C', '%3B', '%20', '%09', '%0D', '%0A', '%0B', '%0C'];

    public function __construct(string $name, string $value = null, $expire = 0, ?string $path = '/')
    {
        $this->name = $name;
        $this->value = $value;
        $this->expire = 0 < $expire ? (int)$expire : 0;
        $this->path = empty($path) ? '/' : $path;
    }


    public function __toString()
    {
        $str = str_replace(self::$reservedCharsFrom, self::$reservedCharsTo, $this->name);
        $str .= '=';

        if ('' === (string)$this->value) {
            $str .= 'deleted; expires=' . gmdate('D, d-M-Y H:i:s T', time() - 31536001) . '; Max-Age=0; SameSite=Lax; Secure';
        } else {
            $str .= rawurlencode($this->value);

            if (0 !== $this->expire) {
                $str .= '; expires=' . gmdate('D, d-M-Y H:i:s T', $this->expire) . '; Max-Age=' . $this->getMaxAge() . "; SameSite=Lax; Secure";
            }
        }

        if ($this->path) {
            $str .= '; path=' . $this->path;
        }

        return $str;
    }

    public function asArray()
    {
        return [str_replace(self::$reservedCharsFrom, self::$reservedCharsTo, $this->name), (string)$this->value, $this->expire];
    }

    public function getMaxAge()
    {
        $maxAge = $this->expire - time();

        return 0 >= $maxAge ? 0 : $maxAge;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getValue()
    {
        return $this->value;
    }

}
