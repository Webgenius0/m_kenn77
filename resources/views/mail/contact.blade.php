<?php
use App\Models\Setting;
$systemSettings = Setting::first();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#f4f4f4; padding:30px 0;">
        <tr>
            <td align="center">

                <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                    style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background:#111111; padding:28px 30px;">
                            <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">
                                {{ $systemSettings->site_name ?? config('app.name') }}
                            </h1>
                        </td>
                    </tr>

                    <!-- Title Bar -->
                    <tr>
                        <td align="center"
                            style="background:#f0f0f0; padding:18px 30px; border-bottom:1px solid #e0e0e0;">
                            <h2 style="margin:0; color:#333333; font-size:20px;">
                                📬 New Contact Form Submission
                            </h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:30px 40px; color:#333333; font-size:15px; line-height:1.7;">

                            <p style="margin:0 0 20px;">
                                You have received a new message through your website's contact form.
                                Here are the details:
                            </p>

                            <!-- Details Table -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                style="border:1px solid #e8e8e8; border-radius:6px; overflow:hidden; margin-bottom:24px;">
                                <tr style="background:#f9f9f9;">
                                    <td style="padding:12px 16px; font-weight:bold; color:#555555; width:100px; border-bottom:1px solid #e8e8e8;">
                                        Name
                                    </td>
                                    <td style="padding:12px 16px; color:#222222; border-bottom:1px solid #e8e8e8;">
                                        {{ $contact->name }}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 16px; font-weight:bold; color:#555555; border-bottom:1px solid #e8e8e8;">
                                        Email
                                    </td>
                                    <td style="padding:12px 16px; color:#222222; border-bottom:1px solid #e8e8e8;">
                                        <a href="mailto:{{ $contact->email }}"
                                            style="color:#111111; text-decoration:underline;">{{ $contact->email }}</a>
                                    </td>
                                </tr>
                                @if($contact->phone)
                                <tr style="background:#f9f9f9;">
                                    <td style="padding:12px 16px; font-weight:bold; color:#555555; border-bottom:1px solid #e8e8e8;">
                                        Phone
                                    </td>
                                    <td style="padding:12px 16px; color:#222222; border-bottom:1px solid #e8e8e8;">
                                        {{ $contact->phone }}
                                    </td>
                                </tr>
                                @endif
                                @if($contact->subject)
                                <tr>
                                    <td style="padding:12px 16px; font-weight:bold; color:#555555;">
                                        Subject
                                    </td>
                                    <td style="padding:12px 16px; color:#222222;">
                                        {{ $contact->subject }}
                                    </td>
                                </tr>
                                @endif
                            </table>

                            <!-- Message Box -->
                            <p style="margin:0 0 8px; font-weight:bold; color:#555555; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">
                                Message
                            </p>
                            <div
                                style="background:#f8f9fa; padding:20px; border-left:4px solid #111111; border-radius:0 6px 6px 0; color:#333333; line-height:1.8;">
                                {{ $contact->message }}
                            </div>

                            <!-- Reply Note -->
                            <div
                                style="margin-top:28px; padding:14px 18px; background:#fffbea; border:1px solid #f0e040; border-radius:6px; font-size:14px; color:#7a6a00;">
                                💡 <strong>Tip:</strong> Reply directly to this email and your response will go
                                to <strong>{{ $contact->name }}</strong> at
                                <a href="mailto:{{ $contact->email }}"
                                    style="color:#7a6a00;">{{ $contact->email }}</a>.
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center"
                            style="background:#f9f9f9; padding:22px; color:#999999; font-size:12px; border-top:1px solid #e8e8e8;">
                            © {{ date('Y') }} {{ $systemSettings->site_name ?? config('app.name') }}. All rights
                            reserved.
                            @if($systemSettings?->site_address)
                                <br>{{ $systemSettings->site_address }}
                            @endif
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
