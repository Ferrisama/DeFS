"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import CSVAnalysis from "./CSVAnalysis";
import { useAuth0 } from "@auth0/auth0-react";
import LoginPage from "./LoginPage";
import DiffView from "./DiffView";

function App() {
  const { isAuthenticated, logout, user, isLoading } = useAuth0();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("/");
  const [newFolderName, setNewFolderName] = useState("");
  const [diffView, setDiffView] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [shareAddress, setShareAddress] = useState("");

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:3000/files");
      console.log("Fetched files and folders:", response.data.files);
      setFiles(
        response.data.files.filter((item) => item.folderPath === currentFolder)
      );
    } catch (error) {
      console.error("Error fetching files:", error);
      alert(`Error fetching files: ${error.message}`);
    }
  }, [currentFolder]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated, fetchFiles]);

  function navigateToFolder(folderPath) {
    setCurrentFolder(folderPath);
  }

  async function uploadFile() {
    if (!file || !fileName) {
      alert("Please select a file and enter a file name");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result.split(",")[1];

      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          {
            name: fileName,
            content: base64data,
            folderPath: currentFolder,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Upload response:", response);
        alert(
          `File uploaded successfully! CID: ${response.data.cid}, Version: ${response.data.version}`
        );
        fetchFiles();
        setFile(null);
        setFileName("");
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(`Error uploading file: ${error.message}`);
      }
    };
    reader.readAsDataURL(file);
  }

  async function createFolder() {
    if (!newFolderName) {
      alert("Please enter a folder name");
      return;
    }

    try {
      const newFolderPath = `${currentFolder}${newFolderName}/`;
      const response = await axios.post("http://localhost:3000/folder", {
        folderPath: newFolderPath,
      });
      alert(response.data.message);
      setNewFolderName("");
      fetchFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      alert(`Error creating folder: ${error.message}`);
    }
  }

  async function retrieveFile(name, version = "") {
    try {
      const response = await axios.get(
        `http://localhost:3000/file/${name}${
          version ? `?version=${version}` : ""
        }`
      );
      setFileContent(response.data.content);
      setCurrentFile({
        name,
        version: response.data.version,
        latestVersion: response.data.latestVersion,
        timestamp: response.data.timestamp,
      });
      fetchVersionHistory(name);
    } catch (error) {
      console.error("Error retrieving file:", error);
      alert(`Error retrieving file: ${error.message}`);
    }
  }

  async function fetchVersionHistory(name) {
    try {
      const response = await axios.get(
        `http://localhost:3000/file/${name}/history`
      );
      setVersionHistory(response.data.history);
    } catch (error) {
      console.error("Error fetching version history:", error);
      alert(`Error fetching version history: ${error.message}`);
    }
  }

  async function deleteFile(name) {
    try {
      await axios.delete(`http://localhost:3000/file/${name}`);
      alert(`File ${name} deleted successfully`);
      fetchFiles();
      setCurrentFile(null);
      setFileContent("");
      setVersionHistory([]);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(`Error deleting file: ${error.message}`);
    }
  }

  async function searchFiles() {
    try {
      const response = await axios.get(
        `http://localhost:3000/search?query=${searchQuery}`
      );
      setSearchResults(response.data.results);
    } catch (error) {
      console.error("Error searching files:", error);
      alert(`Error searching files: ${error.message}`);
    }
  }

  async function shareFile(fileName) {
    if (!ethers.isAddress(shareAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/share", {
        fileName,
        sharedWith: shareAddress,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("Error sharing file:", error);
      alert(`Error sharing file: ${error.message}`);
    }
  }

  async function revokeFileSharing(fileName) {
    if (!ethers.isAddress(shareAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/revoke-share", {
        fileName,
        revokedFrom: shareAddress,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("Error revoking file sharing:", error);
      alert(`Error revoking file sharing: ${error.message}`);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-semibold text-gray-800">DFS</h1>
          <p className="text-sm text-gray-600">Welcome, {user.name}</p>
        </div>
        <nav className="mt-4">
          <button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-900">
              Current Folder: {currentFolder}
            </h1>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* File upload form */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="File name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="p-2 border rounded"
                />
                <button
                  onClick={uploadFile}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Create folder form */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Create Folder</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={createFolder}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Create Folder
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Search Files</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={searchFiles}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Search Results</h2>
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((file, index) => (
                    <li
                      key={index}
                      className="py-4 flex items-center justify-between"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => retrieveFile(file.name)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* File and folder list */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Files and Folders</h2>
              <ul className="divide-y divide-gray-200">
                {files.map((item, index) => (
                  <li
                    key={index}
                    className="py-4 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      {item.isFolder ? "📁" : "📄"}
                      <span className="ml-2">{item.name}</span>
                    </span>
                    <div>
                      {item.isFolder ? (
                        <button
                          onClick={() => navigateToFolder(item.name)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Open
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => retrieveFile(item.name)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteFile(item.name)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* File content and version history */}
            {currentFile && (
              <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  Current File: {currentFile.name}
                </h2>
                <p>
                  Version: {currentFile.version} of {currentFile.latestVersion}
                </p>
                <p>Timestamp: {currentFile.timestamp}</p>

                {/* File sharing controls */}
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">File Sharing</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Ethereum address"
                      value={shareAddress}
                      onChange={(e) => setShareAddress(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={() => shareFile(currentFile.name)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => revokeFileSharing(currentFile.name)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Revoke
                    </button>
                  </div>
                </div>

                <h3 className="text-md font-semibold mt-4 mb-2">
                  Version History
                </h3>
                <ul className="divide-y divide-gray-200">
                  {versionHistory.map((version) => (
                    <li
                      key={version.version}
                      className="py-2 flex items-center justify-between"
                    >
                      <span>
                        Version {version.version} - {version.timestamp}
                      </span>
                      <button
                        onClick={() =>
                          retrieveFile(currentFile.name, version.version)
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>

                {fileContent && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">File Content</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                      {fileContent}
                    </pre>
                  </div>
                )}

                {fileContent && <CSVAnalysis csvContent={fileContent} />}
              </div>
            )}

            {/* Diff view */}
            {diffView && (
              <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Diff View</h3>
                <DiffView
                  oldContent={diffView.oldContent}
                  newContent={diffView.newContent}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
