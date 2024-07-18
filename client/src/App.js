"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import CSVAnalysis from "./CSVAnalysis";

const contractABI = [
  "function uploadFile(string memory name, string memory ipfsHash) public",
  "function getFile(string memory name) public view returns (string memory, address)",
];
const contractAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // Replace with your contract address

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [retrieveName, setRetrieveName] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const response = await axios.get("http://localhost:3000/files");
      console.log("Fetched files:", response.data);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError(`Error fetching files: ${error.message}`);
    }
  }

  async function uploadFile() {
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!fileName) {
      setError("Please enter a file name");
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
        console.log("Upload response:", response.data);
        alert(`File uploaded successfully! CID: ${response.data.cid}`);
        fetchFiles();
      } catch (error) {
        console.error("Error uploading file:", error);
        setError(`Error uploading file: ${error.message}`);
      }
    };
    reader.readAsDataURL(file);
  }

  async function retrieveFile(name) {
    try {
      const response = await axios.get(`http://localhost:3000/file/${name}`);
      console.log("Retrieved file:", response.data);
      setFileContent(response.data.content);
    } catch (error) {
      console.error("Error retrieving file:", error);
      setError(`Error retrieving file: ${error.message}`);
    }
  }

  async function deleteFile(name) {
    try {
      const response = await axios.delete(`http://localhost:3000/file/${name}`);
      console.log("Delete response:", response.data);
      alert(`File ${name} deleted successfully`);
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      setError(`Error deleting file: ${error.message}`);
    }
  }

  return (
    <div className="App">
      <h1>Decentralized File Storage</h1>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <h2>Upload File</h2>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <input
          type="text"
          placeholder="File name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <button onClick={uploadFile}>Upload</button>
      </div>
      <div>
        <h2>Retrieve File</h2>
        <input
          type="text"
          placeholder="File name to retrieve"
          value={retrieveName}
          onChange={(e) => setRetrieveName(e.target.value)}
        />
        <button onClick={() => retrieveFile(retrieveName)}>Retrieve</button>
      </div>
      <div>
        <h2>File List</h2>
        {files.length === 0 ? (
          <p>No files found</p>
        ) : (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file}
                <button onClick={() => retrieveFile(file)}>Retrieve</button>
                <button onClick={() => deleteFile(file)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2>File Content:</h2>
        <pre>{fileContent || "No file content to display"}</pre>
      </div>
      {fileContent && <CSVAnalysis csvContent={fileContent} />}
    </div>
  );
}

export default App;
