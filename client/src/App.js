"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import CSVAnalysis from "./CSVAnalysis";
import { useAuth0 } from "@auth0/auth0-react";
import LoginPage from "./LoginPage";
import DiffView from "./DiffView";

const contractABI = [
  "function uploadFile(string memory name, string memory ipfsHash) public",
  "function getFile(string memory name) public view returns (string memory, address)",
];
const contractAddress = "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8"; // Replace with your contract address

function App() {
  const { isAuthenticated, logout, user, isLoading } = useAuth0();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [retrieveName, setRetrieveName] = useState("");
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("/");
  const [newFolderName, setNewFolderName] = useState("");
  const [diffView, setDiffView] = useState(null);
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated, currentFolder]);

  async function fetchFiles() {
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
  }

  function navigateToFolder(folderPath) {
    setCurrentFolder(folderPath);
  }

  function navigateUp() {
    const parentFolder = currentFolder.split("/").slice(0, -1).join("/") || "/";
    setCurrentFolder(parentFolder);
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
      await axios.post("http://localhost:3000/folder", {
        folderPath: newFolderPath,
      });
      alert(`Folder ${newFolderPath} created successfully`);
      setNewFolderName("");
      await fetchFiles(); // Refresh the file list immediately after creating a folder
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

  async function compareVersions(name, version1, version2) {
    try {
      const response1 = await axios.get(
        `http://localhost:3000/file/${name}?version=${version1}`
      );
      const response2 = await axios.get(
        `http://localhost:3000/file/${name}?version=${version2}`
      );

      setDiffView({
        oldContent: response1.data.content,
        newContent: response2.data.content,
      });
    } catch (error) {
      console.error("Error comparing versions:", error);
      alert(`Error comparing versions: ${error.message}`);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">
                Decentralized File Storage
              </h1>
              <p>Current Folder: {currentFolder}</p>
              {currentFolder !== "/" && (
                <button
                  onClick={navigateUp}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
                >
                  Up to Parent Folder
                </button>
              )}
              <button
                onClick={() => logout({ returnTo: window.location.origin })}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
              >
                Logout
              </button>
            </div>
            <div className="mt-4">
              <p>Welcome, {user.name}!</p>
              <p className="font-bold">Current Folder: {currentFolder}</p>
              {currentFolder !== "/" && (
                <button
                  onClick={navigateUp}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm mt-2"
                >
                  Up to Parent Folder
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex flex-col">
                  <label className="leading-loose">File Name</label>
                  <input
                    type="text"
                    className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    placeholder="Enter file name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="leading-loose">Select File</label>
                  <input
                    type="file"
                    className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                <button
                  className="bg-blue-500 flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none"
                  onClick={uploadFile}
                >
                  Upload to Current Folder
                </button>
              </div>
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex flex-col">
                  <label className="leading-loose">New Folder Name</label>
                  <input
                    type="text"
                    className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <button
                  className="bg-green-500 flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none"
                  onClick={createFolder}
                >
                  Create Folder in Current Directory
                </button>
              </div>
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-xl font-bold">
                  Files and Folders in {currentFolder}
                </h2>
                <ul>
                  {files.map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center py-2"
                    >
                      <span>
                        {item.isFolder ? "📁 " : "📄 "}
                        {item.name}
                      </span>
                      <div>
                        {item.isFolder ? (
                          <button
                            onClick={() => navigateToFolder(item.name)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm mr-2"
                          >
                            Open Folder
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => retrieveFile(item.name)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm mr-2"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteFile(item.name)}
                              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
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
              {currentFile && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-xl font-bold">
                    Current File: {currentFile.name}
                  </h2>
                  <p>
                    Version: {currentFile.version} of{" "}
                    {currentFile.latestVersion}
                  </p>
                  <p>Timestamp: {currentFile.timestamp}</p>
                  <h3 className="text-lg font-semibold">Version History</h3>
                  <ul>
                    {versionHistory.map((version) => (
                      <li
                        key={version.version}
                        className="flex justify-between items-center"
                      >
                        <span>
                          Version {version.version} - {version.timestamp}
                        </span>
                        <button
                          onClick={() =>
                            retrieveFile(currentFile.name, version.version)
                          }
                          className="text-blue-500 hover:text-blue-600"
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentFile && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h3 className="text-lg font-semibold">Compare Versions</h3>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Version 1"
                      className="px-2 py-1 border rounded"
                      onChange={(e) => setVersion1(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Version 2"
                      className="px-2 py-1 border rounded"
                      onChange={(e) => setVersion2(e.target.value)}
                    />
                    <button
                      onClick={() =>
                        compareVersions(currentFile.name, version1, version2)
                      }
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              )}
              {diffView && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h3 className="text-lg font-semibold">Diff View</h3>
                  <DiffView
                    oldContent={diffView.oldContent}
                    newContent={diffView.newContent}
                  />
                </div>
              )}
              {fileContent && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-xl font-bold">File Content</h2>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                    {fileContent}
                  </pre>
                </div>
              )}
              {fileContent && <CSVAnalysis csvContent={fileContent} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
