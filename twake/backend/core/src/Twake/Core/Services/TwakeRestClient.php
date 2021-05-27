<?php

namespace Twake\Core\Services;

use App\App;
use Common\Http\Response;

if (!function_exists('http_parse_headers')) {
    function http_parse_headers($raw_headers)
    {
        $headers = array();
        $key = '';

        foreach (explode("\n", $raw_headers) as $i => $h) {
            $h = explode(':', $h, 2);

            if (isset($h[1])) {
                if (!isset($headers[$h[0]]))
                    $headers[$h[0]] = trim($h[1]);
                elseif (is_array($headers[$h[0]])) {
                    $headers[$h[0]] = array_merge($headers[$h[0]], array(trim($h[1])));
                } else {
                    $headers[$h[0]] = array_merge(array($headers[$h[0]]), array(trim($h[1])));
                }

                $key = $h[0];
            } else {
                if (substr($h[0], 0, 1) == "\t")
                    $headers[$key] .= "\r\n\t" . trim($h[0]);
                elseif (!$key)
                    $headers[0] = trim($h[0]);
            }
        }

        return $headers;
    }
}

class TwakeRestClient
{
    private $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
    }

    public function get($url, $curl_options = [])
    {
        return $this->request("GET", $url, [], $curl_options);
    }

    public function post($url, $data, $curl_options = [])
    {
        return $this->request("POST", $url, $data, $curl_options);
    }

    public function put($url, $data, $curl_options = [])
    {
        return $this->request("PUT", $url, $data, $curl_options);
    }

    public function delete($url, $curl_options = [])
    {
        return $this->request("DELETE", $url, [], $curl_options);
    }

    public function request($method, $url, $data, $curl_options = [])
    {

        if ($this->app) $this->app->getCounter()->startTimer("external_requests");

        $options = [];
        foreach ($curl_options as $key => $opt) {
            $options[$key] = $opt;
        }

        $options[CURLOPT_RETURNTRANSFER] = true;
        $options[CURLOPT_HEADER] = true;

        $options[CURLOPT_URL] = $url;
        $options[CURLOPT_CUSTOMREQUEST] = strtoupper($method);
        $options[CURLOPT_POSTFIELDS] = $data;

        $curl = curl_init();
        curl_setopt_array($curl, $options);

        $response = curl_exec($curl);
        $obj_response = new Response();

        $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);

        $content = substr($response, $headerSize);
        $content = empty($content) ? '' : $content;
        $obj_response->setContent($content);

        $headers = substr($response, 0, $headerSize);
        $headers = http_parse_headers($headers);
        $obj_response->headers->reset($headers);

        $curl_data = (object)curl_getinfo($curl);
        $obj_response->httpStatus($curl_data->http_code);

        if ($this->app) $this->app->getCounter()->stopTimer("external_requests");

        return $obj_response;
    }

}