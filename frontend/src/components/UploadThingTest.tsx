import React, { useState } from 'react';
import { uploadReferenceImage, uploadMultipleReferenceImages } from '../lib/uploadthing';

const UploadThingTest: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSingleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadReferenceImage(file);
      setResult(response);
      console.log('Upload result:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadMultipleReferenceImages(files);
      setResult(response);
      console.log('Multiple upload result:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Multiple upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">UploadThing Integration Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Single Image Upload (Reference Image)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSingleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Multiple Images Upload (Reference Images)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>

        {uploading && (
          <div className="text-blue-600">
            Uploading... Please wait.
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Upload Successful!</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadThingTest;
