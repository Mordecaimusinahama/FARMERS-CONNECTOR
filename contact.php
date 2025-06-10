<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// reCAPTCHA verification
/*
function verifyRecaptcha($recaptcha_response) {
    $secret_key = "6LeccVgrAAAAAPhhaa7xBjDZD6xDm69qz_iz6P7Y";
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = array(
        'secret' => $secret_key,
        'response' => $recaptcha_response
    );

    $options = array(
        'http' => array(
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        )
    );

    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    $result = json_decode($response);

    return $result->success;
}
*/

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verify reCAPTCHA
    /*
    if (!verifyRecaptcha($_POST['g-recaptcha-response'])) {
        echo json_encode(['status' => 'error', 'message' => 'Please complete the reCAPTCHA verification']);
        exit;
    }
    */

    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'your-email@gmail.com'; // Replace with your email
        $mail->Password = 'your-app-password'; // Replace with your app password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Recipients
        $mail->setFrom($_POST['email'], $_POST['name']);
        $mail->addAddress('gmatanda@piquesquid.com');
        $mail->addAddress('walter@piquesquid.com');

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'New Contact Form Submission - Farmers Connector';
        
        $message = "
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {$_POST['name']}</p>
            <p><strong>Email:</strong> {$_POST['email']}</p>
            <p><strong>Phone:</strong> {$_POST['phone']}</p>
            <p><strong>Subject:</strong> {$_POST['subject']}</p>
            <p><strong>Message:</strong> {$_POST['message']}</p>
        ";
        
        $mail->Body = $message;

        $mail->send();
        echo json_encode(['status' => 'success', 'message' => 'Thank you for your message. We will get back to you soon.']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"]);
    }
}
?> 