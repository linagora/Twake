<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Users extends BaseController
{

    public function search(Request $request)
    {

        $options = $request->request->get("query", $request->request->get("options", Array()));

        if (is_string($options)) {
            $options = Array("name" => $options);
        }

        $globalresult = $this->get("app.users")->search($options);
        
        $users = [];
        foreach($globalresult["users"] as $obj){
            $users[] = $this->get("app.users")->completeUserWithCompanies($obj, $this->getUser());
        }
        $globalresult["users"] = $users;
        
        $data = Array("data" => $globalresult);

        return new Response($data);

    }

    public function getById(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $id = $request->request->get("id");
        if(!\is_array($id)){
            $user = $this->get("app.users")->getById($id);
        }else{
            $user = [];
            foreach($id as $singleId){
                $obj = $this->get("app.users")->getById($singleId);
                $obj = $this->get("app.users")->completeUserWithCompanies($obj, $this->getUser());
                $user[] = $obj;
            }
        }

        if ($user) {
            $data["data"] = $user;
        } else {
            $data["errors"][] = "user_was_not_found";
        }

        return new Response($data);

    }

}
