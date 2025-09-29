<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;


Route::prefix('utilities')->name('utilities.')->group(function () {

    // File upload with complex error handling (EXACT replica from your current system)
    Route::post('/upload-file', function (Request $request) {
        try {
            if (!$request->hasFile('file')) {
                return response()->json(['error' => 'No file uploaded'], 400);
            }

            $file = $request->file('file');
            $clientId = $request->input('client_id');
            $type = $request->input('type', 'general');

            // Validate file
            if (!$file->isValid()) {
                return response()->json(['error' => 'Invalid file'], 400);
            }

            // Create path based on type and client
            $path = $type . '/' . date('Y/m');
            $fileName = time() . '_' . ($clientId ?? 'general') . '_' . $file->getClientOriginalName();
            $storedPath = $file->storeAs($path, $fileName, 'public');

            return response()->json([
                'success' => true,
                'data' => [
                    'path' => $storedPath,
                    'url' => Storage::url($storedPath),
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ],
                'message' => 'File uploaded successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    })->name('upload-file');
});
