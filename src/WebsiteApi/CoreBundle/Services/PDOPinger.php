<?php

namespace WebsiteApi\CoreBundle\Services;

use Gos\Bundle\WebSocketBundle\Periodic\PeriodicInterface;

class PDOPinger implements PeriodicInterface
{
	/**
	 * @var \PDO
	 */
	protected $pdo;


	public function __construct(\PDO $pdo = null)
	{
		$this->pdo = $pdo;
	}

	public function tick()
	{
		try {
			$this->pdo->query('SELECT 1');
		} catch (\PDOException $e) {
			throw $e;
		}

	}


	public function getTimeout()
	{
		return 120;
	}
}