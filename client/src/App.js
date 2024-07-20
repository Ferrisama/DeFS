"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import CryptoJS from "crypto-js";
import CSVAnalysis from "./CSVAnalysis";
import { useDropzone } from "react-dropzone";
import { useAuth0 } from "@auth0/auth0-react";
import LoginPage from "./LoginPage";
import DiffView from "./DiffView";
import IntegratedFileUpload from "./IntegratedFileUpload";

const contractABI = [
  "function uploadFile(string memory name, string memory ipfsHash) public",
  "function getFile(string memory name) public view returns (string memory, address)",
];
const contractAddress = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F"; // Replace with your contract address

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
  const [encryptionKey, setEncryptionKey] = useState("");

  const [password, setPassword] = useState("");
  const [salt, setSalt] = useState("");
  const [derivedKey, setDerivedKey] = useState("");

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

  useEffect(() => {
    // Generate a random salt if not already set
    if (!salt) {
      const newSalt = CryptoJS.lib.WordArray.random(128 / 8).toString();
      setSalt(newSalt);
      localStorage.setItem("encryptionSalt", newSalt);
    }
  }, [salt]);

  useEffect(() => {
    // Load salt from local storage on component mount
    const savedSalt = localStorage.getItem("encryptionSalt");
    if (savedSalt) {
      setSalt(savedSalt);
    }
  }, []);

  function navigateToFolder(folderPath) {
    setCurrentFolder(folderPath);
  }

  const deriveKey = useCallback(() => {
    if (password && salt) {
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      }).toString();
      setDerivedKey(key);
    }
  }, [password, salt]);

  useEffect(() => {
    deriveKey();
  }, [deriveKey]);

  const saveEncryptionKeys = (newKeys) => {
    setEncryptionKey(newKeys);
    localStorage.setItem("encryptionKeys", JSON.stringify(newKeys));
  };

  const encryptFile = (fileContent, key) => {
    const wordArray = CryptoJS.enc.Utf8.parse(fileContent);
    const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    return encrypted;
  };

  const decryptFile = (encryptedContent, key) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedContent, key);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) {
        throw new Error("Decryption failed. The key might be incorrect.");
      }
      return decryptedStr;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error(
        "Failed to decrypt file. Please check your encryption key."
      );
    }
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  async function uploadFile() {
    if (!file || !fileName || !encryptionKey) {
      alert(
        "Please select a file, enter a file name, and provide an encryption key"
      );
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;
        const encryptedContent = encryptFile(fileContent, encryptionKey);
        const base64EncryptedContent = btoa(encryptedContent);

        console.log("Encryption key used for encryption:", encryptionKey);
        console.log(
          "Encrypted content before upload:",
          base64EncryptedContent.substring(0, 100)
        ); // Log first 100 chars

        const response = await axios.post(
          "http://localhost:3000/upload",
          {
            name: fileName,
            content: base64EncryptedContent,
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
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Error uploading file: ${error.message}`);
    }
  }

  async function retrieveFile(name, version = "") {
    if (!encryptionKey) {
      alert("Please enter an encryption key");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/file/${name}${
          version ? `?version=${version}` : ""
        }`
      );

      console.log("Encryption key used for decryption:", encryptionKey);
      console.log(
        "Encrypted content after download:",
        response.data.content.substring(0, 100)
      ); // Log first 100 chars

      const encryptedContent = atob(response.data.content);
      let decryptedContent;
      try {
        decryptedContent = decryptFile(encryptedContent, encryptionKey);
      } catch (error) {
        alert(error.message);
        return;
      }
      setFileContent(decryptedContent);
      setCurrentFile({
        name,
        version: response.data.version,
        latestVersion: response.data.latestVersion,
        timestamp: response.data.timestamp,
      });
      fetchVersionHistory(name);
      console.log("Decrypted content:", decryptedContent.substring(0, 100)); // Log first 100 chars
    } catch (error) {
      console.error("Error retrieving file:", error);
      alert(`Error retrieving file: ${error.message}`);
    }
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
            {/* Encryption key input */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Encryption Key</h2>
              <input
                type="password"
                placeholder="Enter encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-600 mt-2">
                This key will be used to encrypt and decrypt your files. Make
                sure to remember it, as it cannot be recovered.
              </p>
            </div>
            {/* File upload form */}
            <IntegratedFileUpload
              onFileSelect={handleFileSelect}
              fileName={fileName}
              setFileName={setFileName}
              uploadFile={uploadFile}
            />

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
