<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\Backend\ContactService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactController extends Controller
{
    protected $service;

    public function __construct(ContactService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of contacts
     */
    public function index(Request $request)
    {
        $contacts = $this->service->getAll(
            $request->only(['search', 'email', 'date']),
            15
        );

        return Inertia::render('backend/contacts/index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'email', 'date']),
        ]);
    }

    /**
     * Display a specific contact
     */
    public function show($id)
    {
        $contact = $this->service->getById($id);

        return Inertia::render('backend/contacts/show', [
            'contact' => $contact,
        ]);
    }

    /**
     * Update a contact
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'subject' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'sometimes|string|min:10',
        ]);

        $contact = $this->service->update($id, $validated);

        return back()->with('success', 'Contact updated successfully');
    }

    /**
     * Delete a contact
     */
    public function destroy($id)
    {
        $this->service->delete($id);

        return back()->with('success', 'Contact deleted successfully');
    }

    /**
     * Export contacts to CSV with active filters applied.
     */
    public function export(Request $request): StreamedResponse
    {
        $contacts = $this->service->getAll(
            $request->only(['search', 'email', 'date']),
            999999
        );

        $data = $contacts->items();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="contacts-' . date('Y-m-d_His') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () use ($data) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM so Excel opens the file correctly
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, ['Name', 'Email', 'Subject', 'Phone', 'Message', 'Submitted Date']);

            foreach ($data as $contact) {
                fputcsv($output, [
                    $contact->name,
                    $contact->email,
                    $contact->subject ?? '',
                    $contact->phone   ?? '',
                    $contact->message,
                    $contact->created_at?->format('Y-m-d H:i:s') ?? '',
                ]);
            }

            fclose($output);
        }, 200, $headers);
    }
}
