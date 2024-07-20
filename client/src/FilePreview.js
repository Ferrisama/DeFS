import React from "react";

const FilePreview = ({ fileContent, fileType }) => {
  const renderPreview = () => {
    switch (fileType) {
      case "text/plain":
      case "application/json":
      case "text/html":
      case "text/css":
      case "application/javascript":
        return <pre className="whitespace-pre-wrap">{fileContent}</pre>;
      case "image/jpeg":
      case "image/png":
      case "image/gif":
        return (
          <img
            src={`data:${fileType};base64,${fileContent}`}
            alt="File preview"
            className="max-w-full h-auto"
          />
        );
      case "application/pdf":
        return (
          <embed
            src={`data:application/pdf;base64,${fileContent}`}
            type="application/pdf"
            width="100%"
            height="600px"
          />
        );
      default:
        return <p>Preview not available for this file type.</p>;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">File Preview</h3>
      <div className="overflow-auto max-h-96">{renderPreview()}</div>
    </div>
  );
};

export default FilePreview;
