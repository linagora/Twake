<?php


namespace AdministrationApi\Core\Services;

use App\App;

/**
 * Class ValidationService
 * @package AdministrationApi\Core\Services
 */
class ValidationService
{

    /**
     * @var string
     */
    private $token;

    /**
     * ValidationService constructor.
     * @param $token
     */
    public function __construct(App $app)
    {
        $this->token = $app->getContainer()->getParameter('env.admin_api_token');
    }

    /**
     * @param $token
     * @return bool
     */
    public function validateAuthentication($token)
    {
        return $token == $this->token;
    }

    /**
     * @return bool
     */
    public function validateStructure($filter, $sort, $limit, $page)
    {
        if ($limit <= 0) {
            return false;
        }
        if ($page < 0) {
            return false;
        }
        return true;
    }

}