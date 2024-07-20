import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function IntegratedFileUpload({
  onFileSelect,
  fileName,
  setFileName,
  uploadFile,
}) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
        setFileName(acceptedFiles[0].name);
      }
    },
    [onFileSelect, setFileName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload File</h2>
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:border-blue-500 transition duration-300"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop a file here, or click to select a file</p>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="File name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={uploadFile}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </div>
    </div>
  );
}

export default IntegratedFileUpload;
