<?php
  function convertToPHPValue() {
    global $argv;

    $decrypteKey = json_decode($argv[2]);
    $ivDefault = json_decode($argv[3]);

    $decryptedChannel = [];
    
    $encryptedChannel= json_decode($argv[1]);
    foreach($encryptedChannel as $key => $value) {
      if (substr($value, 0, 10) == "encrypted_") {
        $data = substr($value, 10);
        $data = explode("_", $data);
        $salt = isset($data[1]) ? $data[1] : "";
        $iv = isset($data[2]) ? base64_decode($data[2]) : $ivDefault;
        $data = base64_decode($data[0]);

        try {
          $data = openssl_decrypt(
            $data,
            "AES-256-CBC",
            pack("H*", $decrypteKey) . $salt,
            true,
            $iv
          );

          $decryptedChannel[$key] = $data;
        } catch (\Exception $e) {
          $data = $value;
        }
      } else {
        $decryptedChannel[$key] = $value;
      }
    }
    
    return json_encode($decryptedChannel);
  }

echo(convertToPHPValue());


