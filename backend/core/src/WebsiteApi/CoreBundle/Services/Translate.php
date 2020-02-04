<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 27/07/18
 * Time: 14:15
 */

namespace WebsiteApi\CoreBundle\Services;


class Translate
{

    var $defaultLanguage = 'en';

    public function __construct()
    {
    }

    public function getDefaultLanguage()
    {
        return $this->defaultLanguage;
    }

    public function setDefaultLanguage($lang)
    {
        $this->defaultLanguage = $lang;
    }

    public function translate($key, $lang)
    {
        if ($key instanceof TranslationObject)
            return $key->toString($lang);

        $availableLanguages = Array("fr", "en", "de");

        if (in_array($lang, $availableLanguages)) {
            $translation = Array();
            include dirname(__FILE__) . "/Languages/$lang.php";

            if (isset(($translation)[$key])) {
                return ($translation)[$key];
            }
        }

        if ($lang == 'en')
            return $key;
        return $this->translate($key, "en");
    }
}