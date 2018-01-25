<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/06/2017
 * Time: 15:12
 */

namespace WebsiteApi\MarketBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\MarketBundle\Entity\LinkAppUser;

class AppUsersController extends Controller
{
  public function acquireAction(Request $request){


    $manager = $this->getDoctrine()->getManager();
    $data = array(
      "data" => Array(),
      "errors" => Array()
    );

    $securityContext = $this->get('security.authorization_checker');

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
    } else {
      // Vérifier que le groupe existe
      $groupId = $request->request->get('groupId');
      $group = $manager->getRepository('TwakeWorkspacesBundle:Workspace')->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
      if ($group == null){
        $data['errors'][] = "nosuchgroup";
      } else {
	      if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:apps:acquire")) {
          $response["errors"][] = "notallowed";
        } else {
          $appId = $request->request->get('appId');
          $app = $manager->getRepository('TwakeMarketBundle:Application')->find($appId);
          if ($app == null) {
            $data['errors'][] = "nosuchapp";
          } else {
            $applink = $manager->getRepository('TwakeMarketBundle:LinkAppWorkspace')->findOneBy(Array("workspace"=>$group, "application"=>$app));
            if ($applink != null){
              $data['errors'][] = "alreadyacquired";
            } else {
              $link = new linkAppWorkspace();
              $link->setApplication($app);
              $link->setGroup($group);
              $link->setPrice($app->getPrice());
              $app->addUser();
              $manager->persist($link);
              $manager->persist($app);
              $manager->flush();
              $this->get('app.updateGroup')->push($group->getId());
            }
          }
        }
      }
    }
    return new JsonResponse($data);
  }


    public function removeAction(Request $request)
    {
        $manager = $this->getDoctrine()->getManager();
        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $securityContext = $this->get('security.authorization_checker');

        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

            $data['errors'][] = "notconnected";
        } else {
            // Vérifier que le groupe existe
            $groupId = $request->request->get('groupId');
            $group = $manager->getRepository('TwakeWorkspacesBundle:Workspace')->findOneBy(Array("id" => $groupId, "isDeleted" => false));
            if ($group == null) {
                $data['errors'][] = "nosuchgroup";
            } else {
                if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "base:apps:acquire")) {
                    $response["errors"][] = "notallowed";
                } else {
                    $appId = $request->request->get('appId');
                    $app = $manager->getRepository('TwakeMarketBundle:Application')->find($appId);
                    if ($app == null) {
                        $data['errors'][] = "nosuchapp";
                    } else {
                        $applink = $manager->getRepository('TwakeMarketBundle:LinkAppWorkspace')->findOneBy(Array("workspace"=>$group, "application"=>$app));
                        if ($applink == null){
                            $data['errors'][] = "notacquired";
                        } else {
                            if (!(substr($app->getUrl(), 0, 4) === "http")) { // si c'est  une appli interne
                                $data['errors'][] = "internalapplication";
                            }
                            else{
                                $manager->remove($applink);
                                $manager->flush();
                            }
                        }
                    }
                }
            }
        }
        return new JsonResponse($data);
    }

  public function voteAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $data = array(
      "data" => Array(),
      "errors" => Array()
    );

    $securityContext = $this->get('security.authorization_checker');

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
    } else {
      $vote = intval($request->request->get("vote"));
      if ($vote < 0 || $vote > 5 ){
        $data['errors'][] = "invalidvote";
      } else {
        $groupId = $request->request->get('groupId');
        $group = $manager->getRepository('TwakeWorkspacesBundle:Workspace')->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));
        if ($group == null){
          $data['errors'][] = "nosuchgroup";
        } else {
          $appId = $request->request->get('appId');
          $app = $manager->getRepository('TwakeMarketBundle:Application')->find($appId);
          if ($app == null){
            $data['errors'][] = "nosuchapp";
          } else {
            $workspacelink = $manager->getRepository('TwakeMarketBundle:LinkAppWorkspace')->findOneBy(Array("workspace"=>$group, "application"=>$app));
            if ($workspacelink == null){
              $data['errors'][] = "notacquired";
            } else {
              $userlink = $manager->getRepository('TwakeMarketBundle:LinkAppUser')->findOneBy(Array("user"=>$this->getUser(), "application"=>$app));
              if ($userlink != null){
                //Update Score
                $oldscore = $userlink->getScore();
                $userlink->setScore($vote);
                $app->replaceVote($oldscore, $vote);
              } else {
                //Create Score
                $userlink = new LinkAppUser();
                $userlink->setApplication($app);
                $userlink->setUser($this->getUser());
                $userlink->setScore($vote);
                $app->newVote($vote);

              }
              $manager->persist($userlink);
              $manager->persist($app);
              $manager->flush();
            }
          }
        }
      }
    }
    return new JsonResponse($data);
  }
}