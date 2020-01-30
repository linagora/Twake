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

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\StringType;

class TwakeTextType extends StringType
{
    /**
     * Secret key for aes algorythm
     * @var string
     */
    private $secretKey;
    protected $searchable = false;

    /**
     * Initialization of encryptor
     * @param string $key
     */
    public function setEncryptionKey($key)
    {
        $this->secretKey = $key;
        $this->iv = "twake_constantiv";
    }

    public function convertToPHPValue($original_data, AbstractPlatform $platform)
    {
        if (substr($original_data, 0, 10) == "encrypted_") {
            $data = substr($original_data, 10);
            $data = explode("_", $data);
            $salt = isset($data[1]) ? $data[1] : "";
            $iv = isset($data[2]) ? base64_decode($data[2]) : $this->iv;
            $data = base64_decode($data[0]);
            try {
                $data = openssl_decrypt(
                    $data,
                    "AES-256-CBC",
                    $this->secretKey . $salt,
                    true,
                    $iv
                );
            } catch (\Exception $e) {
                $data = $original_data;
            }
        } else {
            $data = $original_data;
        }

        return $data;
    }

    public function convertToDatabaseValue($data, AbstractPlatform $platform)
    {
        if (!$data) {
            return $data;
        }

        if ($this->searchable) {
            $iv = $this->iv;
            $salt = "";
        } else {
            $iv = openssl_random_pseudo_bytes(16);
            $salt = bin2hex(openssl_random_pseudo_bytes(16));
        }

        return "encrypted_" . trim(
                base64_encode(
                    openssl_encrypt(
                        $data,
                        "AES-256-CBC",
                        $this->secretKey . $salt,
                        true,
                        $iv
                    )
                )
            ) . "_" . $salt . "_" . base64_encode($iv);

    }

    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return "TEXT";
    }

}
