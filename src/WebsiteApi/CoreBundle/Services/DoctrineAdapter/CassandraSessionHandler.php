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

    }

    public function init()
    {

        if ($this->didInit) {
            return;
        }

        $this->didInit = true;

        $options = $this->options;
        $doctrineAdapter = $this->doctrineAdapter;

        $options["session_lifetime"] = 3600;
        $options["column_family"] = "sessions";

        $this->options = $options;

        $this->options['session_lifetime'] = intval($this->options['session_lifetime'], 10);
        $this->options = array_merge(array(
            'id_field' => 'sess_id',
            'data_field' => 'sess_data',
            'time_field' => 'sess_time',
        ), $options);

        $this->manager = $doctrineAdapter->getEntityManager();
        $connection = $this->manager->getConnection();
        $this->connection = $connection->getWrappedConnection();
        $this->session = $this->connection->session;

        $this->options["keyspace"] = $this->connection->keyspace;

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
        $this->prepareStatements();

        $blobSessionId = $sessionId;
        $result = $this->getSession()->execute($this->preparedStatements['destroy'],
            new \Cassandra\ExecutionOptions(array('arguments' => array($blobSessionId)))
        );
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
        $this->prepareStatements();

        $blobData = new \Cassandra\Blob($data);
        $nowTimestamp = date("U");
        $blobSessionId = $sessionId;
        $result = $this->getSession()->execute($this->preparedStatements['write'],
            new \Cassandra\ExecutionOptions(array('arguments' => array(
                $blobData, $nowTimestamp, $blobSessionId
            )))
        );

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function read($sessionId)
    {
        $this->prepareStatements();

        $blobSessionId = $sessionId;
        $result = $this->getSession()->execute($this->preparedStatements['read'],
            new \Cassandra\ExecutionOptions(array('arguments' => array($blobSessionId)))
        );
        if (null !== ($sessionData = $result->first())) {
            $data = $sessionData[$this->options['data_field']];
            return ($data instanceof \Cassandra\Blob ? $data->toBinaryString() : '');
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
        $this->init();
        return $this->session;
    }

    /**
     * Prepare all the statements for reading, writing and destroying sessions for this doctrineAdapter,
     * and do that once, on initialization.
     */
    protected function prepareStatements()
    {
        $this->init();

        if (isset($this->preparedStatements['read'])) {
            return;
        }

        $this->preparedStatements['read'] = $this->getSession()->prepare(
            "SELECT {$this->options['data_field']}
             FROM {$this->options['keyspace']}.{$this->options['column_family']}
             WHERE {$this->options['id_field']} = ?"
        );
        $this->preparedStatements['write'] = $this->getSession()->prepare(
            "UPDATE {$this->options['keyspace']}.{$this->options['column_family']} USING TTL {$this->options['session_lifetime']}
             SET {$this->options['data_field']} = ?, {$this->options['time_field']} = ?
             WHERE {$this->options['id_field']} = ?"
        );
        $this->preparedStatements['destroy'] = $this->getSession()->prepare(
            "DELETE FROM {$this->options['keyspace']}.{$this->options['column_family']}
             WHERE {$this->options['id_field']} = ?"
        );
    }

}
