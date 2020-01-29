<?php


namespace WebsiteApi\CoreBundle\Services;

use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use WebsiteApi\CoreBundle\Services\RememberMe;

class BeforeRender
{

    public function __construct()
    {


    }

    public function beforeRender(FilterResponseEvent $event)
    {

        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            $event->getResponse()->headers->set('Access-Control-Allow-Origin', $_SERVER['HTTP_ORIGIN']); //Allow App
        }
        $event->getResponse()->headers->set('Access-Control-Allow-Headers', ' Content-Type, *');
        $event->getResponse()->headers->set('Access-Control-Allow-Credentials', 'true');
        $event->getResponse()->headers->set('Access-Control-Allow-Methods', 'GET, POST');
        $event->getResponse()->headers->set('Access-Control-Max-Age', '600');
        $length = strlen($event->getResponse()->getContent());
        $event->getResponse()->headers->set('x-decompressed-content-length', $length);

        @$content = json_decode($event->getResponse()->getContent(), 1);

        if (is_array($content)) {
            $cookies = [];
            foreach (headers_list() as $header) {
                if (strpos("Set-Cookie: ", $header) == 0) {
                    $ex = explode("Set-Cookie: ", $header);
                    if (count($ex) == 2) {
                        $cookies[] = $ex[1];
                    }
                }
            }
            $content["_cookies"] = $cookies;
            $event->getResponse()->setContent(json_encode($content));
        }


    }


}
