"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import CSVAnalysis from "./CSVAnalysis";

const contractABI = [
  "function uploadFile(string memory name, string memory ipfsHash) public",
  "function getFile(string memory name) public view returns (string memory, address)",
];
const contractAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed"; // Replace with your contract address

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [retrieveName, setRetrieveName] = useState("");
  const [retrieveVersion, setRetrieveVersion] = useState("");
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const response = await axios.get("http://localhost:3000/files");
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
      alert(`Error fetching files: ${error.message}`);
    }
  }

  async function uploadFile() {
    if (!file) {
      alert("Please select a file");
      return;
    }
    if (!fileName) {
      alert("Please enter a file name");
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

  async function revertFile(name, version) {
    try {
      const response = await axios.post(
        `http://localhost:3000/file/${name}/revert`,
        { version }
      );
      alert(response.data.message);
      fetchFiles();
      retrieveFile(name, response.data.newVersion);
    } catch (error) {
      console.error("Error reverting file:", error);
      alert(`Error reverting file: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">
                Decentralized File Storage
              </h1>
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
                  Upload
                </button>
              </div>
              <div className="pt-4 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                <p>File List</p>
                <ul className="mt-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {file.name} (Version: {file.version})
                      </span>
                      <div>
                        <button
                          className="text-blue-500 hover:text-blue-600"
                          onClick={() => retrieveFile(file.name)}
                        >
                          View
                        </button>
                        <button
                          className="ml-2 text-red-500 hover:text-red-600"
                          onClick={() => deleteFile(file.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {currentFile && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold">
                    Current File: {currentFile.name}
                  </h2>
                  <p>
                    Version: {currentFile.version} of{" "}
                    {currentFile.latestVersion}
                  </p>
                  <p>Timestamp: {currentFile.timestamp}</p>
                  <h3 className="text-lg font-semibold mt-2">
                    Version History
                  </h3>
                  <ul className="mt-2">
                    {versionHistory.map((version) => (
                      <li
                        key={version.version}
                        className="flex justify-between items-center"
                      >
                        <span>
                          Version {version.version} - {version.timestamp}
                        </span>
                        <div>
                          <button
                            className="text-blue-500 hover:text-blue-600"
                            onClick={() =>
                              retrieveFile(currentFile.name, version.version)
                            }
                          >
                            View
                          </button>
                          {version.version !== currentFile.version && (
                            <button
                              className="ml-2 text-green-500 hover:text-green-600"
                              onClick={() =>
                                revertFile(currentFile.name, version.version)
                              }
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fileContent && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold">File Content</h2>
                  <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto">
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
