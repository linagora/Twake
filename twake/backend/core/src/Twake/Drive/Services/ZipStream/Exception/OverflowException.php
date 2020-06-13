<?php
declare(strict_types=1);

namespace Twake\Drive\Services\ZipStream\Exception;

use Twake\Drive\Services\ZipStream\Exception;

/**
 * This Exception gets invoked if a counter value exceeds storage size
 */
class OverflowException extends Exception
{
    public function __construct()
    {
        parent::__construct('File size exceeds limit of 32 bit integer. Please enable "zip64" option.');
    }
}
