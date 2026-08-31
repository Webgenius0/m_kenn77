<?php

namespace App\Http\Controllers\API\Contact;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContactStoreRequest;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactApiController extends Controller
{
    use ApiResponse;

    /**
     * Store a newly created contact in the database.
     */
    public function store(ContactStoreRequest $request)
    {
        try {
            $contact = Contact::create($request->validated());

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
