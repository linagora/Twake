<?php

namespace Twake\Core;

use Symfony\Component\HttpKernel\Bundle\Bundle;

class TwakeCore extends Bundle
{
    public function getParent()
    {
        return 'FOSUser';
    }
}
