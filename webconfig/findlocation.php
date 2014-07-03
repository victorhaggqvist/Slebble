<?php
header('Content-Type: application/json');

$ch = curl_init("https://api.trafiklab.se/samtrafiken/resrobot/FindLocation.json?key=a1266429df0741304cce5fe9ac811755&coordSys=RT90&apiVersion=2.1&from=".$_GET['from']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$output = curl_exec($ch);

curl_close($ch);

echo utf8_encode($output);
 ?>
