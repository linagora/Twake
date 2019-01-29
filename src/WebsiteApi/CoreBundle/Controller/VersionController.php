<?php

namespace WebsiteApi\CoreBundle\Controller;

use RMS\PushNotificationsBundle\Message\iOSMessage;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class VersionController extends Controller
{

    public function getAction()
    {

        return new JsonResponse(Array("data" =>
                Array(
                    "branding" => Array(
                        "logo" => "https://www.weare-aerospace.com/wp-content/uploads/2017/06/WeareGROUP_logoQ.png",
                        "name" => "WeAre Aerospace",
                        "link" => "https://weare-aerospace.com"
                    ),
                    "jisti_domain" => "meet.jit.si",
                    "use_cas" => false,
                    "help_link" => "https://go.crisp.chat/chat/embed/?website_id=9ef1628b-1730-4044-b779-72ca48893161",
                    "version" => "1.1.0-0",
                    "last_compatible_mobile_version" => "1.1.300"
                ))
        );


    }

    public function quoteAction()
    {

        if ($this->getUser() && is_object($this->getUser())) {
            $ln = $this->getUser()->getLanguage();
        } else {
            $ln = "en";
        }

        $quotes = Array(
            Array("quote" => $this->get("app.translate")->translate("quote.update_policy", $ln), "subquote" => $this->get("app.translate")->translate("subquote.update_policy", $ln)),
            Array("quote" => $this->get("app.translate")->translate("quote.read_text", $ln), "subquote" => $this->get("app.translate")->translate("subquote.read_text", $ln)),
            Array("quote" => $this->get("app.translate")->translate("quote.dont_worry", $ln), "subquote" => "Dave"),
            Array("quote" => "Dave is not available for now, please try again later.", "subquote" => "Dave"),
            Array("quote" => "Hello? Is there anyone here?", "subquote" => "Dave"),
            Array("quote" => "I don't work on weekends, or any other day that ends with \"Y\".", "subquote" => "Dave"),
            Array("quote" => "You look great today!", "subquote" => "The Twake team"),
            Array("quote" => "Have a great day!", "subquote" => "The Twake team"),
            Array("quote" => "Don't worry, be happy.", "subquote" => "The Twake team"),
            Array("quote" => "You're here? Today just got better!", "subquote" => "The Twake team"),
            Array("quote" => "Work hard. Dream big.", "subquote" => "The Twake team"),
            Array("quote" => $this->get("app.translate")->translate("quote.love_the_live", $ln), "subquote" => "Bob Marley"),
            Array("quote" => "Try and fail, but never fail to try.", "subquote" => "Jared Leto"),
            Array("quote" => "If you dream it, you can do it.", "subquote" => "Walt Disney"),
            Array("quote" => "Never, never, never give up.", "subquote" => "Winston Churchill"),
            Array("quote" => "If not us, who? If not now, when?", "subquote" => "John F. Kennedy"),
            Array("quote" => "Wherever you go, go with all your heart.", "subquote" => "Confucius"),
            Array("quote" => "Action is the foundational key to all success.", "subquote" => "Pablo Picasso"),
            Array("quote" => "You must do the thing you think you cannot do.", "subquote" => "Eleanor Roosevelt"),
            Array("quote" => "Life is trying things to see if they work.", "subquote" => "Ray Bradbury"),
            Array("quote" => "They didn't know it was impossible so they did it.", "subquote" => "Mark Twain"),
            Array("quote" => "Mmmmmm… Doughnuts.", "subquote" => "Homer Simpson"),

            Array("quote" => "You can open the notifications center with ⇧ + ⌘ + L or ⇧ + Ctrl + L", "subquote" => "Tips - #1"),
            Array("quote" => "To show your workspaces you can use ⇧ + ⌘ + K or ⇧ + Ctrl + K", "subquote" => "Tips - #2"),
            Array("quote" => "To show your last messages you can use ⇧ + ⌘ + M or ⇧ + Ctrl + M", "subquote" => "Tips - #3"),
            Array("quote" => "Add a collaborative link or document with ⇧ + ⌘ + U or ⇧ + Ctrl + U", "subquote" => "Tips - #4"),
            Array("quote" => "You can change your workspace wallpaper in workspace parameters.", "subquote" => "Tips - #5"),
            Array("quote" => "Try to use the multi-windows feature to work in different apps at the same time.", "subquote" => "Tips - #6"),
            Array("quote" => "If you need a new app, tell us about it on feedback.twakeapp.com!", "subquote" => "Tips - #7"),
            Array("quote" => "You can sort your Drive files using labels.", "subquote" => "Tips - #8")

        );

        return new JsonResponse($quotes[random_int(0, count($quotes) - 1)]);


    }

}