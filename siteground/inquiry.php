<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect('/');
}

verify_csrf();

$listing = get_listing((int) ($_POST['listing_id'] ?? 0));
$name = trim((string) ($_POST['name'] ?? ''));
$contact = trim((string) ($_POST['contact'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if (!$listing || $name === '' || $contact === '' || $message === '') {
    flash('Please fill out every inquiry field.', 'error');
    redirect('/');
}

$to = $config['app']['inquiry_recipient'];
$subject = 'Mower inquiry: ' . $listing['stock_number'];
$body = "Name: {$name}\nContact: {$contact}\nListing: {$listing['stock_number']} {$listing['year']} {$listing['model']}\n\n{$message}";
$headers = 'From: no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'example.com');

@mail($to, $subject, $body, $headers);
flash('Inquiry sent. The seller will follow up soon.');
redirect('/');
