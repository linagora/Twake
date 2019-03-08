<?php

/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace WebsiteApi\MarketBundle\Controller;

use DevelopersApi\UsersBundle\Entity\Token;
use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;

class ApplicationController extends Controller
{

    public function createAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $workspace_id = $request->request->get("workspace_id");
        $name = $request->request->get("name");
        $simple_name = $request->request->get("simple_name");
        $app_group_name = $request->request->get("app_group_name", "");

        $app_exists = $this->get("app.applications")->findAppBySimpleName($simple_name, true);

        if ($app_exists) {

            $data["errors"][] = "simple_name_used";

        } else {

            $res = $this->get("app.applications")->createApp($workspace_id, $name, $simple_name, $app_group_name, $this->getUser()->getId());

            if (!$res) {
                $data["errors"][] = "error";
            } else {
                $data["data"] = $res;
            }

        }

        return new JsonResponse($data);

    }

    public function getGroupDevelopedAppsAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $workspace_id = $request->request->get("workspace_id");
        $res = $this->get("app.applications")->getGroupDevelopedApps($workspace_id, $this->getUser()->getId());

        if (!is_array($res)) {
            $data["errors"][] = "error";
        } else {
            $data["data"] = $res;
        }

        return new JsonResponse($data);

    }

    public function updateAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $application = $request->request->get("application");

        $app_exists = $this->get("app.applications")->findAppBySimpleName($application["simple_name"], true);

        if ($app_exists && $app_exists["id"] != $application["id"]) {

            $data["errors"][] = "simple_name_used";

        } else {

            $res = $this->get("app.applications")->update($application, $this->getUser()->getId());

            if (!is_array($res)) {
                $data["errors"][] = "error";
            } else {
                $data["data"] = $res;
            }

        }

        return new JsonResponse($data);

    }

    public function removeAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $application_id = $request->request->get("application_id");

        $res = $this->get("app.applications")->remove($application_id, $this->getUser()->getId());

        if (!$res) {
            $data["errors"][] = "error";
        } else {
            $data["data"] = Array("success" => true);
        }

        return new JsonResponse($data);

    }


    /////////////////// OLD CODE ///////////////////

  /*
   *  Retrieves data from an application
   */
  public function getAction(Request $request){
      $manager = $this->get("app.twake_doctrine");
    $data = array(
      "data" => Array(),
      "errors" => Array()
    );

    $securityContext = $this->get('security.authorization_checker');

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
    } else {
      $id = $request->request->get("id");
      $app = $manager->getRepository("TwakeMarketBundle:Application")->find($id);
      if ($app == null){
        $data['errors'][] = "nosuchapp";
      } else {

        $dt = $app->getAsArray();
        $groupId = $request->request->get("groupId");
        $linkAppWorkspace = $manager->getRepository("TwakeMarketBundle:LinkAppWorkspace")->findOneBy(Array("application"=>$app, "workspace"=>$groupId));
        if ($linkAppWorkspace == null){
          $dt['linkworkspace'] = Array(
            "acquired" => false,
            "price"=>0
          );
        } else {
          $dt['linkworkspace'] = Array(
            "acquired" => true,
            "price"=>$linkAppWorkspace->getPrice()
          );
        }

        $linkAppUser = $manager->getRepository("TwakeMarketBundle:LinkAppUser")->findOneBy(Array("application"=>$app, "user"=>$this->getUser()));
        if ($linkAppUser == null){
          $dt['linkuser'] = Array(
            "score" => -1
          );
        } else {
          $dt['linkuser'] = Array(
            "score" => $linkAppUser->getScore()
          );
        }

        $dt['group'] = Array();
        $dt['group'] = $app->getGroup()->getAsSimpleArray();

        $screens = Array();
        if (isset($dt['screenshots'])){
          foreach($dt['screenshots'] as $screen){
            $scr = $manager->getRepository('TwakeUploadBundle:File')->find($screen);
            $screens[] = Array(
              "screen"=>$this->getParameter('SERVER_NAME').$scr->getPublicURL(2),
              "cssscreen" => "background-image: url('".$this->getParameter('SERVER_NAME').$scr->getPublicURL(2)."');"
            );
          }
        }


        $dt['screenshots'] = $screens;
        $dt['internal'] = false;
        if (!(substr( $dt['url'], 0, 4 ) === "http")){
          $dt['internal'] = true;
        }
        $data['data'] = $dt;
      }
    }

    return new JsonResponse($data);
  }

  public function getAppsAction(Request $request){
      $response = Array("errors"=>Array(), "data"=>Array());

      $name = $request->request->get("name");

      if(isset($name)){
          $apps_obj = $this->get("app.applications")->getAppsByName($name);
      }else{
          $apps_obj = $this->get("app.applications")->getApps();
      }

      $apps = array();

      foreach ($apps_obj as $app) {
          $apps[] = $app->getAsArray();
      }

      if(!$apps_obj){
          $response["errors"][] = "notallowed";
      }else{
          $response["data"]["apps"] = $apps;
      }

      return new JsonResponse($response);
  }

  public function getDefaultUrlOpenerAction(){
      $data["data"] = $this->get("app.applications")->getDefaultUrlOpener();

      return new JsonResponse($data);
  }

    public function getAppsByKeywordsAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $keywords = $request->request->get("keywords", Array());

        if(count($keywords)!=0){
            $apps_obj = $this->get("app.applications")->getAppsByKeyword($keywords);
        }else{
            $apps_obj = $this->get("app.applications")->getApps();
        }

        $apps = array();

        foreach ($apps_obj as $app) {
            $apps[] = $app->getAsArray();
        }

        if(!$apps_obj){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"]["apps"] = $apps;
        }

        return new JsonResponse($response);
    }

    public function getAppByPublicKeyAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $publickey = $request->request->get("publicKey");

        $apps_obj = $this->get("app.applications")->getAppByPublicKey($publickey);

        if($apps_obj == null){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"] = $apps_obj->getAsSimpleArray();
        }

        return new JsonResponse($response);
    }
    /*
     * Add an application
     */
    public function addAppAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->get("groupId");
        $appid = $request->request->get("appid");

        if (isset($groupId) && isset($appid)) {
            $returnVal = $this->get("app.applications")->addApplication($groupId, $appid, $this->getUser()->getId());
        }


        if(!$returnVal){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"][] = $returnVal;
        }

        return new JsonResponse($response);
    }

    /*
     * Add an application
     */
    public function addFreeAppAction(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array());

        $groupId = $request->request->get("groupId");
        $workspaceId = $request->request->get("workspaceId");
        $appid = $request->request->get("appid");

        if (isset($groupId) && isset($appid)) {
            $this->get("app.applications")->addFreeApplication($groupId, $appid, $this->getUser()->getId());
        }
        $res = $this->get("app.workspaces_apps")->enableApp($workspaceId, $appid);

        if (!$res) {
            $response["errors"][] = "notallowed";
        } else {
            $response["data"][] = $res;
        }

        return new JsonResponse($response);
    }


  function getRecomended(Request $request){
      $manager = $this->get("app.twake_doctrine");
    $data = array(
      "data" => Array(),
      'errors' => Array()
    );
    $groupId = $request->request->get('groupId');
    $securityContext = $this->get('security.authorization_checker');

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
      $data['errors'][] = "notconnected";
    } else {
      $group = $manager->getRepository('TwakeWorkspacesBundle:Workspace')->find($groupId);
      if ($group == null){
        $data['errors'][] = "nosuchgroup";
      } else {
        $links = $manager->getRepository('TwakeMarketBundle:LinkAppWorkspace')->findBy(Array("workspace"=>$group));

        // TODO continuer la fonction
        $data['errors'][] = "fonction non terminée en back";
        return new JsonResponse($data);
      }
    }
  }

  function getByCategoryAction(Request $request){
      $manager = $this->get("app.twake_doctrine");
      $data = array(
        "data" => Array(),
        'errors' => Array()
      );
      $id = $request->request->get("catId",-1);
      if($id<0){
          $category = $manager->getRepository('TwakeMarketBundle:Category')->findAll();
      }
      else{
          $category = $manager->getRepository('TwakeMarketBundle:Category')->find($request->request->get("catId"));
      }

      if($category == null){
          $data["errors"][] = "categorynotfound";
      }
      else{
          $links = $manager->getRepository('TwakeMarketBundle:LinkApplicationCategory')->findBy(Array("category"=>$category));
          foreach($links as $link){
              $data['data'][] = $link->getApplication()->getAsArray();
          }
      }
      return new JsonResponse($data);
  }


    function getCategoryAction(Request $request){
        $manager = $this->get("app.twake_doctrine");
        $data = array(
            "data" => Array(),
            'errors' => Array()
        );

        $categorys = $manager->getRepository('TwakeMarketBundle:Category')->findAll();
        foreach($categorys as $category){
            $data["data"][] = $category->getAsArray();
        }
        return new JsonResponse($data);

    }


	public function getUserTokenAction(Request $request){

        $manager = $this->get("app.twake_doctrine");

		$data = array(
			"data" => Array(),
			'errors' => Array()
		);


        $appid = $request->request->get("appid", 0);
        $groupId = $request->request->get("workspaceId", 0);

		$app = $manager->getRepository("TwakeMarketBundle:Application")
            ->find($appid);

		if (!$this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "")) {
			$data['errors'][] = "notallowed";
		} else {

			$useringroup = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceUser")
				->findOneBy(Array("user"=>$this->getUser(),"workspace"=>$groupId));

			//Delete old tokens (1 minutes)
			$qb = $manager->createQueryBuilder();
			$qb->delete('DevelopersApiUsersBundle:Token', 't');
			$qb->where('t.date < :mindate');
			$qb->setParameter('mindate', (new \DateTime())->modify('-1 minute'));

			//Ok
			$tokenE = new Token();
			$tokenE->setUser($this->getUser());
			$tokenE->setWorkspace($useringroup->getWorkspace());
			$tokenE->setApplication($app);

			$manager->persist($tokenE);
			$manager->flush();

			$token = $tokenE->getToken();

			$data["data"]["token"] = $token;

		}

		return new JsonResponse($data);

	}



}
