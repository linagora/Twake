<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Platforms\Keywords;

use Doctrine\DBAL\Platforms\Keywords\KeywordList;

/**
 * Cassandra Keywordlist
 *
 * @license    BSD http://www.opensource.org/licenses/bsd-license.php
 * @author Thang Tran <thang.tran@pyramid-consulting.com>
 */
class CassandraKeywords extends KeywordList
{
    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'Cassandra';
    }

    /**
     * {@inheritdoc}
     * ref. http://www.datastax.com/documentation/cql/3.0/cql/cql_reference/keywords_r.html
     */
    protected function getKeywords()
    {
        return array(
            'ADD',
            'ALLOW',
            'ALTER',
            'AND',
            'ANY',
            'APPLY',
            'ASC',
            'AUTHORIZE',
            'BATCH',
            'BEGIN',
            'BIGINT',
            'BOOLEAN',
            'BLOB',
            'BY',
            'COLUMNFAMILY',
            'CREATE',
            'DELETE',
            'DESC',
            'DROP',
            'EACH_QUORUM',
            'FROM',
            'GRANT',
            'IN',
            'INDEX',
            'INET',
            'INSERT',
            'INTO',
            'KEYSPACE',
            'KEYSPACES',
            'LIMIT',
            'LOCAL_ONE',
            'LOCAL_QUORUM',
            'MODIFY',
            'NORECURSIVE',
            'OF',
            'ON',
            'ONE',
            'ORDER',
            'PASSWORD',
            'PRIMARY',
            'QUORUM',
            'RENAME',
            'REVOKE',
            'SCHEMA',
            'SELECT',
            'SET',
            'TABLE',
            'TO',
            'TOKEN',
            'THREE',
            'TRUNCATE',
            'TWO',
            'UNLOGGED',
            'UPDATE',
            'USE',
            'USING',
            'WHERE',
            'WITH'
        );
    }
}
