<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $message = $_POST['message'];
    $to = "walter@piquesquid.com";
    $subject = "New Career Application from Farmers Connector";
    $body = "Name: $name\nEmail: $email\nMessage: $message";
    $headers = "From: $email";

    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you for your application! We will get back to you soon.";
    } else {
        echo "Sorry, something went wrong. Please try again later.";
    }
}
?> 