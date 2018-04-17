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

  /*
   *  Retrieves data from an application
   */
  public function getAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
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
          $apps_obj = $this->get("website_api_market.applications")->getAppsByName($name);
      }else{
          $apps_obj = $this->get("website_api_market.applications")->getApps();
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

    /*
     * Add an application
     */
    public function addAppAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->get("groupId");
        $appId = $request->request->get("appId");

        if(isset($groupId) && isset($appId)){
            $returnVal = $this->get("website_api_market.applications")->addApplication($groupId,$appId,$this->getUser()->getId());
        }


        if(!$returnVal){
            $response["errors"][] = "notallowed";
        }else{
            $response["data"][] = $returnVal;
        }

        return new JsonResponse($response);
    }

  /*
   *  Create an app
   */

  public function createAction(Request $request){
    $manager= $this->getDoctrine()->getManager();
    $data = array(
      "data" => Array(),
      'errors' => Array()
    );

    $securityContext = $this->get('security.authorization_checker');

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
    } else {

      $groupId = $request->request->get('groupId');
      $group = $manager->getRepository('TwakeWorkspacesBundle:Workspace')->find($groupId);
      if ($group == null){
        $data['errors'][] = "nosuchgroup";
      } else {
	      if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:apps:create")) {
          $response["errors"][] = "notallowed";
        } else {
          $ok = true;

          // Vérifications diverses avant création, à compléter si l'on rajoute des champs forcés


          $name = $request->request->get('name');
          if ($this->get('app.string_cleaner')->simplifyWithoutRemovingSpacesOrUpperCase($name) != $name || $name == "Base" || $name == "base"){
            $data['errors'][] = "invalidname";
            $ok = false;
          }

          $app = $manager->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name'=>$name));
          if ($app != null){
            $data['errors'][] = "namealreadyused";
            $ok = false;
          }
          $descr = $request->request->get('description');
          $price = floatval($request->request->get('price'));
          $url = $request->request->get('url');
          // Création si ok
          if ($ok){
            $app = new Application();
            $app->setName($name);
            $app->setDescription($descr);
            $app->setPrice($price);
            $app->setGroup($group);
            $app->setUrl($url);
            $manager->persist($app);
            $manager->flush();

			$app->generePublicKey();
			$manager->persist($app);
			$manager->flush();

            $data['data']['id'] = $app->getId();
          }
        }
      }
    }
    return new JsonResponse($data);
  }

  function getRecomended(Request $request){
    $manager= $this->getDoctrine()->getManager();
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
      $manager= $this->getDoctrine()->getManager();
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
        $manager= $this->getDoctrine()->getManager();
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

		$manager = $this->getDoctrine()->getManager();

		$data = array(
			"data" => Array(),
			'errors' => Array()
		);


		$appId = $request->request->getInt("appId",0);
		$groupId = $request->request->getInt("workspaceId",0);

		$app = $manager->getRepository("TwakeMarketBundle:Application")
			->find($appId);

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
