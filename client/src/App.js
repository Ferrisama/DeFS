import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const contractABI = [
  "function uploadFile(string memory name, string memory ipfsHash) public",
  "function getFile(string memory name) public view returns (string memory, address)",
];
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your contract address

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [retrieveName, setRetrieveName] = useState("");

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
      const base64data = reader.result.split(",")[1]; // This gets the base64 data without the prefix
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
        alert(`File uploaded successfully! CID: ${response.data.cid}`);
      } catch (error) {
        console.error("Error uploading file:", error);
        if (error.response) {
          console.error("Error data:", error.response.data);
          console.error("Error status:", error.response.status);
          console.error("Error headers:", error.response.headers);
          alert(
            `Error uploading file: ${
              error.response.data.error || "Unknown error"
            }`
          );
        } else if (error.request) {
          console.error("Error request:", error.request);
          alert("Error uploading file: No response received from server");
        } else {
          console.error("Error message:", error.message);
          alert(`Error uploading file: ${error.message}`);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function retrieveFile() {
    try {
      const response = await axios.get(
        `http://localhost:3000/file/${retrieveName}`
      );
      setFileContent(response.data.content);
    } catch (error) {
      console.error("Error retrieving file:", error);
      alert("Error retrieving file");
    }
  }

  return (
    <div className="App">
      <h1>Decentralized File Storage</h1>
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
        <button onClick={retrieveFile}>Retrieve</button>
      </div>
      <div>
        <h2>File Content:</h2>
        <pre>{fileContent}</pre>
      </div>
    </div>
  );
}

export default App;
