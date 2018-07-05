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

        return new JsonResponse(Array("version" => "1.1.0-0"));


    }

    public function quoteAction()
    {

        $quotes = Array(
            Array("quote" => "We did not update our privacy policy.", "subquote" => "Did we? I don't know, check your e-mails."),
            Array("quote" => "Don't read that text.", "subquote" => "You just lost"),
            Array("quote" => "Don't worry, everything is under control.", "subquote" => "Dave"),
            Array("quote" => "Hello? Is there anyone here?", "subquote" => "Dave"),
            Array("quote" => "I don't work on weekends, or any other day that ends with \"Y\".", "subquote" => "Dave"),
            Array("quote" => "You look great today !", "subquote" => "The Twake team"),
            Array("quote" => "Have a great day !", "subquote" => "The Twake team"),
            Array("quote" => "Don't worry, be happy.", "subquote" => "The Twake team"),
            Array("quote" => "You're here? Today just got better !", "subquote" => "The Twake team"),
            Array("quote" => "Work hard. Dream big.", "subquote" => "The Twake team"),
            Array("quote" => "Love the life you live, and live the life you love.", "subquote" => "Bob Marley"),
            Array("quote" => "Try and fail, but never fail to try.", "subquote" => "Jared Leto"),
            Array("quote" => "If you dream it, you can do it.", "subquote" => "Walt Disney"),
            Array("quote" => "Never, never, never give up.", "subquote" => "Winston Churchill"),
            Array("quote" => "If not us, who? If not now, when?", "subquote" => "John F. Kennedy"),
            Array("quote" => "Wherever you go, go with all your heart.", "subquote" => "Confucius"),
            Array("quote" => "Action is the foundational key to all success.", "subquote" => "Pablo Picasso"),
            Array("quote" => "You must do the thing you think you cannot do.", "subquote" => "Eleanor Roosevelt"),
            Array("quote" => "Life is trying things to see if they work.", "subquote" => "Ray Bradbury"),
            Array("quote" => "They didn't know it was impossible so they did it.", "subquote" => "Mark Twain"),
            Array("quote" => "Mmmmmm… Doughnuts.", "subquote" => "Homer Simpson")
        );

        return new JsonResponse($quotes[random_int(0, count($quotes) - 1)]);


    }

}