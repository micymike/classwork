<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/xml; charset=utf-8');
header('Content-Disposition: attachment; filename="greenfield_courses.xml"');

$db = Database::getConnection();

$stmt = $db->prepare('SELECT * FROM courses WHERE status = ? ORDER BY code ASC');
$stmt->execute(['active']);
$courses = $stmt->fetchAll();

// Build XML with DOMDocument for proper structure
$dom = new DOMDocument('1.0', 'UTF-8');
$dom->formatOutput = true;

$root = $dom->createElement('courseCatalog');
$root->setAttribute('institution', 'Greenfield Institute');
$root->setAttribute('generated', date('Y-m-d\TH:i:s'));
$root->setAttribute(
    'xmlns:xsi',
    'http://www.w3.org/2001/XMLSchema-instance'
);
$root->setAttribute(
    'xsi:noNamespaceSchemaLocation',
    '../xml/courses.xsd'
);
$dom->appendChild($root);

foreach ($courses as $course) {
    $el = $dom->createElement('course');

    $el->appendChild($dom->createElement('id',          (string)$course['id']));
    $el->appendChild($dom->createElement('code',        htmlspecialchars($course['code'])));
    $el->appendChild($dom->createElement('title',       htmlspecialchars($course['title'])));
    $el->appendChild($dom->createElement('description', htmlspecialchars($course['description'] ?? '')));
    $el->appendChild($dom->createElement('instructor',  htmlspecialchars($course['instructor'])));
    $el->appendChild($dom->createElement('capacity',    (string)$course['capacity']));
    $el->appendChild($dom->createElement('enrolled',    (string)$course['enrolled']));
    $el->appendChild($dom->createElement('schedule',    htmlspecialchars($course['schedule'])));
    $el->appendChild($dom->createElement('credits',     (string)$course['credits']));

    $root->appendChild($el);
}

echo $dom->saveXML();
