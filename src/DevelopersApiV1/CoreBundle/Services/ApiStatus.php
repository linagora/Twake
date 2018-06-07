<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 07/06/18
 * Time: 15:51
 */

namespace DevelopersApiV1\CoreBundle\Services;


class ApiStatus {
    private $map;

    /**
     * ApiStatus constructor.
     */
    public function __construct(){
        //0 < General errors < 1000
        $this->map[1] = "Incorrect authentification";
        $this->map[2] = "You have not the rights to perform this action";

        //999 < errors from Workspace < 2000

        //1999 < errors from Drive < 3000
        $this->map[2000] = "";

        //2999 < errors from Messages < 4000

        //3999 < errors from Calendar < 5000
    }

    public function getError($code){
        $message = $this->map[$code];
        $response = Array("status : error", "code : ".$code,"message : ".$message);
        return $response;
    }

    public function getSuccess(){
        $response = Array("status : success");
        return $response;
    }

}