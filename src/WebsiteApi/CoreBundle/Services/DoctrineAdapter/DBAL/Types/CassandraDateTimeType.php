<?php
/*
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the MIT license. For more information, see
 * <http://www.doctrine-project.org>.
 */

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types;

use WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Platforms\CassandraPlatform;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\DateTimeType;
use Doctrine\DBAL\Types\ConversionException;

/**
 * Type that maps an SQL DATETIME/TIMESTAMP to a PHP DateTime object.
 *
 * @since 2.0
 */
class CassandraDateTimeType extends DateTimeType
{

    /**
     * @param $str
     * @return bool|string
     */
    public function getDateStringFromHex($str)
    {
        if (is_numeric("" . $str)) {
            $time = intval("" . $str) / 1000;
            return date('Y-m-d H:i:s', $time);
        } else {
            $date = unpack('H*', $str);
            $time = hexdec($date[1]) / 1000;
            return date('Y-m-d H:i:s', $time);
        }
    }

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        if ($value === null || $value instanceof \DateTime) {
            return $value;
        }

        $val = \DateTime::createFromFormat($platform->getDateTimeFormatString(), $value);
        if (!$val) {
            $value = $this->getDateStringFromHex($value);
            $val = \DateTime::createFromFormat($platform->getDateTimeFormatString(), $value);
        }
        if (!$val) {
            throw ConversionException::conversionFailedFormat($value, $this->getName(), $platform->getDateTimeFormatString());
        }

        return $val;
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {

        if ($value === null || is_string($value)) {
            return $value;
        }

        $val = null;

        if ($value instanceof \DateTime) {
            $val = $value->format($platform->getDateTimeFormatStringToDatabase());
        }

        if (!$val) {
            throw ConversionException::conversionFailedFormat(
                $value,
                $this->getName(),
                $platform->getDateTimeFormatStringToDatabase()
            );
        }

        return $val;
    }


}
