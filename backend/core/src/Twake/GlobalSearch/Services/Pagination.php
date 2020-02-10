<?php

namespace Twake\GlobalSearch\Services;

use App\App;

class Pagination

{
    private $doctrine;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
    }

    public function getnextelement($scroll_id, $repository)
    {

        $option = Array(
            "scroll_id" => $scroll_id,
            "repository" => $repository
        );
        $result = $this->doctrine->es_search($option);
        return $result;

    }
}