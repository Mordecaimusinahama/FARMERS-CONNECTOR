<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// reCAPTCHA verification
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

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verify reCAPTCHA
    if (!verifyRecaptcha($_POST['g-recaptcha-response'])) {
        echo json_encode(['status' => 'error', 'message' => 'Please complete the reCAPTCHA verification']);
        exit;
    }

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
        $mail->Subject = 'New Farmer Registration - Farmers Connector';
        
        $message = "
            <h2>New Farmer Registration</h2>
            <p><strong>Name:</strong> {$_POST['name']}</p>
            <p><strong>Email:</strong> {$_POST['email']}</p>
            <p><strong>Phone:</strong> {$_POST['phone']}</p>
            <p><strong>Farm Size:</strong> {$_POST['farm_size']}</p>
            <p><strong>Location:</strong> {$_POST['location']}</p>
            <p><strong>Current Crops:</strong> {$_POST['crops']}</p>
            <p><strong>Challenges:</strong> {$_POST['challenges']}</p>
            <p><strong>Goals:</strong> {$_POST['goals']}</p>
        ";
        
        $mail->Body = $message;

        $mail->send();
        echo json_encode(['status' => 'success', 'message' => 'Thank you for your interest! We\'ll contact you shortly.']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"]);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Get Started - Farmers Connector</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Join Farmers Connector - Zimbabwe's leading agricultural technology platform. Get started with smart farming solutions today.">
    <meta name="keywords" content="smart farming, agricultural technology, Zimbabwe farming, Zambia farming, precision agriculture">
    <meta name="author" content="Pique Squid Consultancy">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Get Started - Farmers Connector">
    <meta property="og:description" content="Join Zimbabwe's leading agricultural technology platform">
    <meta property="og:image" content="assets/images/og-image.jpg">
    <meta property="og:url" content="https://farmersconnect.co.zw/getting-started">
    
    <!-- Styles -->
    <link href="assets/vendors/bootstrap/bootstrap.min.css" rel="stylesheet">
    <link href="assets/vendors/bootstrap-icons/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Header Section -->
    <header class="fbs__net-navbar navbar navbar-expand-lg dark">
        <!-- Include your header content here -->
    </header>

    <!-- Main Content -->
    <main>
        <section class="section">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow-lg">
                            <div class="card-body p-5">
                                <h1 class="text-center mb-4">Get Started with Farmers Connector</h1>
                                
                                <?php if (isset($success)): ?>
                                    <div class="alert alert-success">
                                        Thank you for your interest! We'll contact you shortly.
                                    </div>
                                <?php endif; ?>
                                
                                <?php if (isset($error)): ?>
                                    <div class="alert alert-danger">
                                        <?php echo $error; ?>
                                    </div>
                                <?php endif; ?>

                                <form method="POST" action="" class="needs-validation" novalidate>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="name" class="form-label">Full Name *</label>
                                            <input type="text" class="form-control" id="name" name="name" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="email" class="form-label">Email Address *</label>
                                            <input type="email" class="form-control" id="email" name="email" required>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="phone" class="form-label">Phone Number *</label>
                                            <input type="tel" class="form-control" id="phone" name="phone" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="farm_size" class="form-label">Farm Size (Hectares) *</label>
                                            <input type="number" class="form-control" id="farm_size" name="farm_size" required>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="location" class="form-label">Farm Location *</label>
                                        <input type="text" class="form-control" id="location" name="location" required>
                                    </div>

                                    <div class="mb-3">
                                        <label for="crops" class="form-label">Current Crops *</label>
                                        <textarea class="form-control" id="crops" name="crops" rows="2" required></textarea>
                                    </div>

                                    <div class="mb-3">
                                        <label for="challenges" class="form-label">Main Farming Challenges *</label>
                                        <textarea class="form-control" id="challenges" name="challenges" rows="3" required></textarea>
                                    </div>

                                    <div class="mb-4">
                                        <label for="goals" class="form-label">Your Farming Goals *</label>
                                        <textarea class="form-control" id="goals" name="goals" rows="3" required></textarea>
                                    </div>

                                    <div class="text-center">
                                        <button type="submit" class="btn btn-primary btn-lg">Submit Application</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer Section -->
    <footer>
        <!-- Include your footer content here -->
    </footer>

    <!-- Scripts -->
    <script src="assets/vendors/bootstrap/bootstrap.bundle.min.js"></script>
    <script>
        // Form validation
        (function () {
            'use strict'
            var forms = document.querySelectorAll('.needs-validation')
            Array.prototype.slice.call(forms).forEach(function (form) {
                form.addEventListener('submit', function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                    form.classList.add('was-validated')
                }, false)
            })
        })()
    </script>
</body>
</html> 