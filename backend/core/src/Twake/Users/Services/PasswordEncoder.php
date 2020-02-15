<?php

namespace Twake\Users\Services;


class PasswordEncoder
{
    private $algorithm = "sha512";
    private $encodeHashAsBase64 = true;
    private $iterations = 5000;
    private $encodedLength = -1;

    public function __construct()
    {
        $this->encodedLength = \strlen($this->encodePassword('', 'salt'));
    }

    protected function mergePasswordAndSalt(string $password, ?string $salt)
    {
        if (empty($salt)) {
            return $password;
        }

        return $password . '{' . $salt . '}';
    }

    protected function isPasswordTooLong(string $password)
    {
        return \strlen($password) > 4096;
    }

    public function encodePassword(string $raw, ?string $salt)
    {
        if ($this->isPasswordTooLong($raw)) {
            throw new BadCredentialsException('Invalid password.');
        }

        $salted = $this->mergePasswordAndSalt($raw, $salt);
        $digest = hash($this->algorithm, $salted, true);

        for ($i = 1; $i < $this->iterations; ++$i) {
            $digest = hash($this->algorithm, $digest . $salted, true);
        }

        return $this->encodeHashAsBase64 ? base64_encode($digest) : bin2hex($digest);
    }

    public function isPasswordValid(string $encoded, string $raw, ?string $salt)
    {
        if (\strlen($encoded) !== $this->encodedLength || false !== strpos($encoded, '$')) {
            return false;
        }

        return !$this->isPasswordTooLong($raw) && hash_equals($encoded, $this->encodePassword($raw, $salt));
    }
}