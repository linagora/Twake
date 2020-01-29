<?php
declare(strict_types=1);

namespace WebsiteApi\DriveBundle\Services\ZipStream\Option;

/**
 * Methods enum
 *
 * @method static STORE(): Method
 * @method static DEFLATE(): Method
 */
class Method extends Enum
{
    const STORE = 0x00;
    const DEFLATE = 0x08;
}