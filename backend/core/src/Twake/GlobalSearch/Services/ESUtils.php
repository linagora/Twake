<?php
/**
 * Created by PhpStorm.
 * User: romaricmourgues
 * Date: 08/10/2019
 * Time: 09:33
 */

namespace Twake\GlobalSearch\Services;


use Twake\Core\Services\StringCleaner;

class ESUtils
{
    static function createRange($from, $to, $parameter_name, &$must_list = NULL)
    {
        if (!$to && !$from) {
            return;
        }

        $tmp = Array(
            "range" => Array(
                "$parameter_name" => Array()
            )
        );

        if ($to) {
            $tmp["range"][$parameter_name]["lte"] = ESUtils::simplifyInArray($to);
        }

        if ($from) {
            $tmp["range"][$parameter_name]["gte"] = ESUtils::simplifyInArray($from);
        }

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;
    }

    static function simplifyInArray($data)
    {

        $sc = new StringCleaner();
        return $sc->simplifyInArray($data);

    }

    static function createMatchPhrase($value, $parameter_name, &$must_list = NULL)
    {

        if (!$value) {
            return;
        }

        $tmp = Array(
            "match_phrase" => Array(
                "$parameter_name" => ESUtils::simplifyInArray($value)
            )
        );

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;

    }

    static function createShouldMatch($terms, $parameter_name, $minimum_should_match = "all", &$must_list = NULL)
    {

        if ($terms && !is_array($terms)) {
            $terms = [$terms];
        }

        if ($minimum_should_match == "all") {
            $minimum_should_match = count($terms);
        }

        if (!$terms || count($terms) == 0) {
            return;
        }

        $array = Array();
        foreach ($terms as $term) {
            if ($term) {
                $array[] = Array(
                    "match_phrase" => Array(
                        "$parameter_name" => ESUtils::simplifyInArray($term)
                    )
                );
            }
        }

        $tmp = Array(
            "bool" => Array(
                "should" => $array,
                "minimum_should_match" => $minimum_should_match
            )
        );

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;


    }

    static function createRegexShouldMatch($terms, $parameter_name, $minimum_should_match = "all", &$must_list = NULL)
    {

        if ($terms && !is_array($terms)) {
            $terms = [$terms];
        }

        if ($minimum_should_match == "all") {
            $minimum_should_match = count($terms);
        }

        if (!$terms || count($terms) == 0) {
            return;
        }

        $array = Array();
        foreach ($terms as $term) {
            if ($term) {
                $array[] = Array(
                    "bool" => Array(
                        "filter" => Array(
                            "regexp" => Array(
                                "$parameter_name" => ESUtils::simplifyInArray($term)
                            )
                        )
                    )
                );
            }
        }

        $tmp = Array(
            "bool" => Array(
                "should" => $array,
                "minimum_should_match" => $minimum_should_match
            )
        );

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;
    }

    static function createNestedShouldMatch($terms, $parameter_name, $minimum_should_match = "all", &$must_list = NULL)
    {

        if ($terms && !is_array($terms)) {
            $terms = [$terms];
        }

        if ($minimum_should_match == "all") {
            $minimum_should_match = count($terms);
        }

        if (!$terms || count($terms) == 0) {
            return;
        }

        $parameter_name_root = explode(".", $parameter_name)[0];

        $array = Array();
        foreach ($terms as $term) {

            $array[] = Array(
                "nested" => Array(
                    "path" => $parameter_name_root,
                    "score_mode" => "avg",
                    "query" => Array(
                        "bool" => Array(
                            "should" => Array(
                                Array(
                                    "bool" => Array(
                                        "must" => Array(
                                            "match_phrase" => Array(
                                                "$parameter_name" => ESUtils::simplifyInArray($term)
                                            )
                                        )
                                    )
                                )
                            ),
                            "minimum_should_match" => 1
                        )
                    )
                )
            );
        }

        $tmp = Array(
            "bool" => Array(
                "should" => $array,
                "minimum_should_match" => $minimum_should_match
            )
        );

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;
    }

    static function createNestedRegexShouldMatch($terms, $parameter_name, $minimum_should_match = "all", &$must_list = NULL)
    {

        if ($terms && !is_array($terms)) {
            $terms = [$terms];
        }

        if ($minimum_should_match == "all") {
            $minimum_should_match = count($terms);
        }

        if (!$terms || count($terms) == 0) {
            return;
        }

        $parameter_name_root = explode(".", $parameter_name)[0];

        $array = Array();
        foreach ($terms as $term) {

            $array[] = Array(
                "nested" => Array(
                    "path" => $parameter_name_root,
                    "score_mode" => "avg",
                    "query" => Array(
                        "bool" => Array(
                            "should" => Array(
                                Array(
                                    "bool" => Array(
                                        "filter" => Array(
                                            "regexp" => Array(
                                                "$parameter_name" => ESUtils::simplifyInArray($term)
                                            )
                                        )
                                    )
                                )
                            ),
                            "minimum_should_match" => 1
                        )
                    )
                )
            );
        }

        $tmp = Array(
            "bool" => Array(
                "should" => $array,
                "minimum_should_match" => $minimum_should_match
            )
        );

        if ($must_list !== NULL) {
            $must_list[] = $tmp;
        }

        return $tmp;
    }

}