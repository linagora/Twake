<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class AccountTransactionsController extends Controller
{
	public function indexAction()
	{
		return $this->render('TwakeUsersBundle:Account:account_transactions.html.twig');
	}
}
