<?php

namespace WebsiteApi\CoreBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;

class TwakeCoreBundle extends Bundle
{
    public function getParent()
    {
        return 'FOSUserBundle';
    }
}
