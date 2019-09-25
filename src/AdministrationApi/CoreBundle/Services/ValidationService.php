<?php


namespace AdministrationApi\CoreBundle\Services;

/**
 * Class ValidationService
 * @package AdministrationApi\CoreBundle\Services
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
    public function __construct($token) {
        $this->token = $token;
    }

    /**
     * @param $token
     * @return bool
     */
    public function validateAuthentication($token) {
        return $token == $this->token;
    }

    /**
     * @return bool
     */
    public function validateStructure($filter, $sort, $limit, $page) {
        if ($limit <= 0) {
            return false;
        }
        if ($page < 0) {
            return false;
        }
        return true;
    }

}