<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use WebsiteApi\CoreBundle\Entity\Sessions;

class CassandraSessionHandler implements \SessionHandlerInterface
{
    /**
     * @var \Cassandra\Session
     */
    private $session;
    /**
     * @var array A list of prepared statements (prepared on initialization)
     */
    private $preparedStatements;
    /**
     * @var array
     */
    private $options;
    /**
     * @var \Psr\Log\LoggerInterface A logger instance (optional, will be a NullLogger by default)
     */
    private $logger;

    /**
     * Constructor.
     *
     * List of available options:
     *  * keyspace: The name of the keyspace [required]
     *  * column_family: The name of the column family [required]
     *  * session_lifetime: The session lifetime in seconds [required]
     *  * id_field: The field name for storing the session id [default: id]
     *  * data_field: The field name for storing the session data [default: data]
     *  * time_field: The field name for storing the timestamp [default: time]
     *
     * @param \Cassandra\Cluster $doctrineAdapter A Cassandra doctrineAdapter instance
     * @param array $options An associative array of field options
     *
     * @throws \InvalidArgumentException When "keyspace" or "column_family" options were not provided
     */
    public function __construct($doctrineAdapter = null, array $options = array())
    {

        $this->options = $options;
        $this->doctrineAdapter = $doctrineAdapter;
        $this->didInit = false;
        $this->lifetime = 3600;

    }

    /**
     * {@inheritdoc}
     */
    public function open($savePath, $sessionName)
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function close()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function destroy($sessionId)
    {
        $repo = $this->doctrineAdapter->getRepository("TwakeCoreBundle:Sessions");
        $result = $repo->find($sessionId);

        if ($result) {
            $this->doctrineAdapter->remove($result);
            $this->doctrineAdapter->flush();
        }
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function gc($maxlifetime)
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function write($sessionId, $data)
    {
        $session = $this->doctrineAdapter->getRepository("TwakeCoreBundle:Sessions")->find($sessionId);
        if (!$session) {
            $session = new Sessions();
        }
        $session->setSessId($sessionId);
        $session->setSessData($data);
        $session->setSessLifetime($this->lifetime);
        $session->setSessTime(date("U"));
        $this->doctrineAdapter->persist($session);
        $this->doctrineAdapter->flush();

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function read($sessionId)
    {
        $repo = $this->doctrineAdapter->getRepository("TwakeCoreBundle:Sessions");
        $result = $repo->find($sessionId);

        if ($result) {
            $data = $result->getSessData();
            return $data;
        }
        return '';
    }

    /**
     * Return a Cassandra session instance.
     *
     * @return \Cassandra\Session
     */
    protected function getSession()
    {
        return $this->session;
    }

    /**
     * Prepare all the statements for reading, writing and destroying sessions for this doctrineAdapter,
     * and do that once, on initialization.
     */
    protected function prepareStatements()
    {
        return true;
    }

}
