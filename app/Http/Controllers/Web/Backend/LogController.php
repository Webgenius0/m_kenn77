<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Opcodes\LogViewer\Facades\LogViewer;
use Opcodes\LogViewer\Http\Resources\LevelCountResource;
use Opcodes\LogViewer\Http\Resources\LogResource;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LogController extends Controller
{
    public function index(Request $request)
    {
        $file = LogViewer::getFiles()->first();

        if (! $file) {
            return Inertia::render('backend/logs/index', [
                'logs' => [
                    'data' => [],
                    'links' => [],
                ],
                'pagination' => null,
            ]);
        }

        $logQuery = $file->logs();

        $logQuery->scan();

        $logs = $logQuery->paginate(20);
        $logs->withPath(route('admin.log.index'));

        return Inertia::render('backend/logs/index', [
            'logs' => LogResource::collection($logs)->resolve(),
            'links' => $logs->linkCollection()->toArray(),
            'pagination' => [
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function clear()
    {
        file_put_contents(storage_path('logs/laravel.log'), '');

        return back()->with('success', 'Logs cleared successfully.');
    }

    /**
     * Export all log entries across all log files to a CSV download.
     */
    public function export(): StreamedResponse
    {
        $files = LogViewer::getFiles();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="system-logs-' . date('Y-m-d_His') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () use ($files) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM so Excel opens the file correctly
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, ['Date', 'Level', 'Message', 'Context', 'Stack Trace']);

            foreach ($files as $file) {
                $logQuery = $file->logs();
                $logQuery->scan();

                // Stream in chunks to avoid loading everything into memory at once
                $page      = 1;
                $perPage   = 200;

                do {
                    $paginator = $logQuery->paginate($perPage, $page);
                    $resolved  = LogResource::collection($paginator)->resolve();

                    foreach ($resolved as $log) {
                        $context = '';
                        if (!empty($log['context']) && is_array($log['context'])) {
                            $context = json_encode($log['context'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                        }

                        fputcsv($output, [
                            $log['datetime']    ?? '',
                            $log['level']       ?? '',
                            $log['message']     ?? '',
                            $context,
                            $log['stack_trace'] ?? '',
                        ]);
                    }

                    $page++;
                } while ($paginator->hasMorePages());
            }

            fclose($output);
        }, 200, $headers);
    }
}
