<?php
header('Content-Type: application/javascript');

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }

    return (substr($haystack, -$length) === $needle);
}

$filename = $_GET['filename'];
if (endsWith($filename, '.mid')) {
    $that_file = file_get_contents($filename);
    $that_file_base64 = base64_encode($that_file);
    echo "var song = atob(\"$that_file_base64\");";
} else {
    echo "var song = null;";
}
