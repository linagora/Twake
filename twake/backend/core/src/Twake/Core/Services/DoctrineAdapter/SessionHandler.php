<?php

namespace Twake\Core\Services\DoctrineAdapter;

use App\App;
use Common\Http\Response;
use Common\Http\Cookie;
use Common\Http\Request;
use Twake\Core\Entity\Sessions;
use Twake\Users\Entity\User;
use \Firebase\JWT\JWT;

class SessionHandler
{
    private $app;
    private $doctrineAdapter;
    private $cookiesToSet;
    private $user = null;
    private $did_use_remember_me = false;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->doctrineAdapter = $app->getServices()->get("app.twake_doctrine");
        $this->didInit = false;
        $this->lifetime = 3600;
        $this->rememberMeLifetime = 60 * 60 * 24 * 360;
        $this->cookiesToSet = [];
    }

    public function getUser(Request $request)
    {
        if ($this->user) {
            return $this->user;
        }
        $this->user = $this->checkRequest($request);
        return $this->user;
    }

    public function setUser(User $user)
    {
        $this->user = $user;
    }

    public function getDidUseRememberMe(){
      return $this->did_use_remember_me;
    }

    public function checkRequest(Request $request, Response $response = null)
    {

        $authorization = $request->headers->get("Authorization");
        $authorization = explode(" ", $authorization);

        if($authorization[0] === "Bearer"){
            $jwt = $authorization[1];
            if($jwt){
                try{
                    $key = $this->app->getContainer()->getParameter("jwt.secret");
                    $jwt = JWT::decode($jwt, $key, array('HS256'));

                    if(!$jwt->sub){
                        return false;
                    }

                    if($jwt->exp < date("U") && $jwt->type !== "refresh"){
                        return false;
                    }

                    if($jwt->exp < date("U") && $jwt->type === "refresh"){
                        return false;
                    }
                    
                    $user = $this->doctrineAdapter->getRepository("Twake\Users:User")->find($jwt->sub);

                    if(!$user){
                        return false;
                    }

                    return $user;

                }catch(\Exception $err){
                    error_log($err);
                    return false;
                }
            }
        }

        return false;

    }

    public function destroySession(Request $request)
    {

        $cookie = $request->cookies->get('SESSID');
        $cookie = json_decode(base64_decode($cookie), 1);
        $session_id = $cookie["sessid"];

        $this->destroy($session_id);
        $this->destroyRememberMe($request);

    }

    public function destroyRememberMe(Request $request)
    {

        $cookie = $request->cookies->get('SESSID');
        $cookie = json_decode(base64_decode($cookie), 1);
        $session_id = $cookie["sessid"];
        $user_id = $cookie["userid"];

        $this->destroy($session_id);

        $user = $this->doctrineAdapter->getRepository("Twake\Users:User")->find($user_id);
        if ($user && $user->getRememberMeSecret()) {
            $user->setRememberMeSecret(false);
            $this->doctrineAdapter->persist($user);
            $this->doctrineAdapter->flush();
        }

    }

    public function destroy($sessionId)
    {
        $repo = $this->doctrineAdapter->getRepository("Twake\Core:Sessions");
        $result = $repo->find($sessionId);

        if ($result) {
            $this->doctrineAdapter->remove($result);
            $this->doctrineAdapter->flush();
        }
        return true;
    }

    public function write($sessionId, $data)
    {
        $session = $this->doctrineAdapter->getRepository("Twake\Core:Sessions")->find($sessionId);
        if (!$session) {
            $session = new Sessions();
        }
        $session->setSessId($sessionId);
        $session->setSessData(json_encode($data));
        $session->setSessLifetime($this->lifetime);
        $session->setSessTime(date("U"));
        $this->doctrineAdapter->persist($session);
        $this->doctrineAdapter->flush();

        return true;
    }

    public function read($sessionId)
    {
        if (!$sessionId) {
            return null;
        }
        $repo = $this->doctrineAdapter->getRepository("Twake\Core:Sessions");
        $result = $repo->find($sessionId);

        if ($result) {
            $data = json_decode($result->getSessData(), 1);
            return $data;
        }
        return null;
    }

}
