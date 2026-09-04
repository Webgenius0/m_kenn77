<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'How can I contact Pink House?',
                'answer' => 'You can contact us through the contact form on our website or by using the phone number and email address listed on our contact page.',
                'sort_order' => 1,
                'status' => true,
            ],
            [
                'question' => 'How do I book a stay?',
                'answer' => "Search your dates, choose a home, and complete the booking in a few steps. You'll receive an instant confirmation email with your itinerary and check-in details.",
                'sort_order' => 2,
                'status' => true,
            ],
            [
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept all major credit cards, debit cards, bank transfers, and digital payment methods. All payments are processed through secure 256-bit SSL encryption.',
                'sort_order' => 3,
                'status' => true,
            ],
            [
                'question' => 'What is your cancellation policy?',
                'answer' => 'Enjoy flexible cancellations up to 14 days prior to your check-in date. Full details can be reviewed in your booking agreement prior to confirmation.',
                'sort_order' => 4,
                'status' => true,
            ],
            [
                'question' => 'Are pets allowed?',
                'answer' => 'Many of our handpicked homes are pet-friendly! Filter listings by pet preferences or contact our concierge team to make special accommodations.',
                'sort_order' => 5,
                'status' => true,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                $faq
            );
        }
    }
}
