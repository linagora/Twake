<?php

namespace Twake\Core\Services;

class StringCleaner
{
    public function simplifyInArray($data)
    {
        if (is_string($data)) {
            return strtolower($this->removeSpecialChars(strtolower($data)));
        }
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->simplifyInArray($value);
            }
        }
        return $data;
    }

    public function removeSpecialChars($str)
    {

        $regex = <<<'END'
/
(
  (?: [\x00-\x7F]                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 single-byte sequences   0xxxxxxx
  |   [\xC0-\xDF][\x80-\xBF]      #:00d2f4aa-605b-11e9-b23e-0242ac120005 double-byte sequences   110xxxxx 10xxxxxx
  |   [\xE0-\xEF][\x80-\xBF]{2}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 triple-byte sequences   1110xxxx 10xxxxxx * 2
  |   [\xF0-\xF7][\x80-\xBF]{3}   #:00d2f4aa-605b-11e9-b23e-0242ac120005 quadruple-byte sequence 11110xxx 10xxxxxx * 3
  ){1,100}                        #:00d2f4aa-605b-11e9-b23e-0242ac120005 ...one or more times
)
| .                                 #:00d2f4aa-605b-11e9-b23e-0242ac120005 anything else
/x
END;
        return preg_replace($regex, '$1', $this->removeAccents($str));

    }

    public function removeAccents($str)
    {
        $str = preg_replace('#Ç#', 'C', $str);
        $str = preg_replace('#ç#', 'c', $str);
        $str = preg_replace('#è|é|ê|ë#', 'e', $str);
        $str = preg_replace('#È|É|Ê|Ë#', 'E', $str);
        $str = preg_replace('#à|á|â|ã|ä|å#', 'a', $str);
        $str = preg_replace('#À|Á|Â|Ã|Ä|Å#', 'A', $str);
        $str = preg_replace('#ì|í|î|ï#', 'i', $str);
        $str = preg_replace('#Ì|Í|Î|Ï#', 'I', $str);
        $str = preg_replace('#ð|ò|ó|ô|õ|ö#', 'o', $str);
        $str = preg_replace('#Ò|Ó|Ô|Õ|Ö#', 'O', $str);
        $str = preg_replace('#ù|ú|û|ü#', 'u', $str);
        $str = preg_replace('#Ù|Ú|Û|Ü#', 'U', $str);
        $str = preg_replace('#ý|ÿ#', 'y', $str);
        $str = preg_replace('#Ý#', 'Y', $str);

        return $str;
    }

    public function simplify($str)
    {
        return preg_replace("/[^a-z0-9_-]/", "", strtolower($this->removeAccents($str)));
    }

    public function simplifyWithoutRemovingUpperCase($str)
    {
        return preg_replace("/[^a-z0-9A-Z]/", "", $this->removeAccents($str));
    }

    public function simplifyWithoutRemovingSpaces($str)
    {
        return preg_replace("/[^a-z0-9 ]/", "", strtolower($this->removeAccents($str)));
    }

    public function simplifyWithoutRemovingSpacesOrUpperCase($str)
    {
        return preg_replace("/[^a-z0-9A-Z ]/", "", $this->removeAccents($str));
    }

    public function simplifyMail($str)
    {
        return preg_replace("/[^a-z0-9@\.\-\_\:]/", "", strtolower($this->removeAccents($str)));
    }

    public function simplifyUsername($str)
    {
        return preg_replace("/[^a-z0-9_.-]/", "", strtolower($this->removeAccents($str)));
    }

    public function simplifyURL($str)
    {
        return preg_replace("/[^a-z0-9@\.\-\_\/\:]/", "", strtolower($this->removeAccents($str)));
    }

    public function verifyMail($mail)
    {
        return preg_match("/^[A-Za-z0-9.\-_]{1,250}@[A-Za-z0-9.\-_]{2,250}\.[A-Za-z0-9]{2,16}$/", $mail);
    }

    public function verifyPassword($password)
    {
        //At least 8 chars
        return strlen($password) >= 8;
        //At least 8 characters, one lower and one uppercase, at least one number
        //return preg_match("/^\S*(?=\S{8,})(?=\S*[a-z])(?=\S*[A-Z])(?=\S*[\d])\S*$/",$password);
    }

    public function verifyUsername($username)
    {
        if (strlen($username) < 4 or strlen($username) > 30) {
            return false;
        }
        return true;
    }

    public function getElapsedTime($ts)
    {

        $diff = (date("U") - $ts);

        if ($diff < 60 * 60) {
            $r = floor($diff / 60);
            $date = "Il y a " . $r . " minute" . (($r > 1) ? 's' : '');
        } elseif ($diff < 60 * 60 * 24) {
            $r = floor(($diff) / (60 * 60));
            $date = "Il y a " . $r . " heure" . (($r > 1) ? 's' : '');
        } elseif ($diff < 60 * 60 * 24 * 10) {
            $r = floor(($diff) / (60 * 60 * 24));
            $date = "Il y a " . $r . " jour" . (($r > 1) ? 's' : '');
        } else {
            $date = "Le " . date("d/m/Y", $ts);
        }

        return $date;
    }

}
