<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
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
        $mail->setFrom($_POST['email'], $_POST['contact_person']);
        $mail->addAddress('gmatanda@piquesquid.com');
        $mail->addAddress('walter@piquesquid.com');

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'New ADMA Trade Fair Registration - Farmers Connector';
        
        $message = "
            <h2>New ADMA Trade Fair Registration</h2>
            <p><strong>Company Name:</strong> {$_POST['company_name']}</p>
            <p><strong>Registration Number:</strong> {$_POST['registration_number']}</p>
            <p><strong>Contact Person:</strong> {$_POST['contact_person']}</p>
            <p><strong>Phone:</strong> {$_POST['phone']}</p>
            <p><strong>Email:</strong> {$_POST['email']}</p>
            <p><strong>Business Type:</strong> {$_POST['business_type']}</p>
            <p><strong>Products/Services:</strong> {$_POST['products_services']}</p>
            <p><strong>Booth Size:</strong> {$_POST['booth_size']}</p>
            <p><strong>Special Requirements:</strong> {$_POST['special_requirements']}</p>
        ";
        
        $mail->Body = $message;

        $mail->send();
        echo json_encode(['status' => 'success', 'message' => 'Thank you for your registration. We will contact you shortly with further details.']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => "Registration could not be submitted. Error: {$mail->ErrorInfo}"]);
    }
}
?> 