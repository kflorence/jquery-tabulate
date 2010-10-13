<?php

$limit = $_GET['limit'] ? $_GET['limit'] : 0;
$offset = $_GET['offset'] ? $_GET['offset'] : 0;

$data = new stdClass;

$data->count = 50;
$data->body = array();

for ($r = $offset; $r < $offset + $limit; $r++) {
	$row = new stdClass;

	for ($c = 0; $c < 3; $c++) {
	    $row->{"col" . ($c + 1)} = "row" . ($r + 1) . ", col " . ($c + 1);
	}
	
	$data->body[] = $row;
}

echo json_encode($data);