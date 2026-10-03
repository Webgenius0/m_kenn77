<?php

namespace App\Http\Controllers\API\Contact;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContactStoreRequest;
use App\Mail\ContactMail;
use App\Models\Contact;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;

class ContactApiController extends Controller
{
    use ApiResponse;

    /**
     * Store a newly created contact in the database and notify the site email.
     */
    public function store(ContactStoreRequest $request)
    {
        try {
            $contact = Contact::create($request->validated());

            // Send notification email to the site email defined in Settings
            $setting = Setting::first();
            $siteEmail = $setting?->site_email;

            if ($siteEmail) {
                Mail::to($siteEmail)->send(new ContactMail($contact));
            }

            return $this->successResponse(
                'Contact submitted successfully',
                $contact,
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Failed to submit contact form',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }
}
