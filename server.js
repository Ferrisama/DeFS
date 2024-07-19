import express from "express";
import { create } from "ipfs-http-client";
import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ipfs = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
});

// Load contract ABI and address (you'll need to deploy the contract first)
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./out/Contract.sol/FileStorage.json"))
).abi;
const contractAddress = "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8"; // Replace with your deployed contract address

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

app.use(cors());
app.use(express.json());

app.post("/upload", async (req, res) => {
  try {
    const { name, content, folderPath } = req.body;
    const buffer = Buffer.from(content, "base64");
    const { cid } = await ipfs.add(buffer);
    await contract.uploadFile(name, cid.toString(), folderPath);
    const latestVersion = await contract.getLatestVersion(name);
    res.json({
      success: true,
      cid: cid.toString(),
      version: latestVersion.toNumber(),
      folderPath,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    const latestVersion = await contract.getLatestVersion(name);
    const versionToFetch = version
      ? parseInt(version)
      : latestVersion.toNumber();
    const [ipfsHash, owner, timestamp, folderPath] = await contract.getFile(
      name,
      versionToFetch
    );

    const chunks = [];
    for await (const chunk of ipfs.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString();

    res.json({
      success: true,
      content,
      owner,
      version: versionToFetch,
      latestVersion: latestVersion.toNumber(),
      timestamp: new Date(timestamp * 1000).toISOString(),
      folderPath,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/files", async (req, res) => {
  try {
    const fileCount = await contract.fileCount();
    const files = [];
    const folders = new Set();

    for (let i = 0; i < fileCount; i++) {
      const fileName = await contract.fileList(i);
      const latestVersion = await contract.getLatestVersion(fileName);
      const [, , , folderPath] = await contract.getFile(
        fileName,
        latestVersion
      );

      files.push({
        name: fileName,
        version: latestVersion.toNumber(),
        folderPath,
        isFolder: false,
      });

      // Add all parent folders
      let currentPath = folderPath;
      while (currentPath !== "/") {
        folders.add(currentPath);
        currentPath = path.dirname(currentPath);
      }
    }

    // Add folders to the file list
    for (const folder of folders) {
      files.push({
        name: folder,
        isFolder: true,
        folderPath: path.dirname(folder),
      });
    }

    res.json({ success: true, files });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/folder", async (req, res) => {
  try {
    const { folderPath } = req.body;
    await contract.createFolder(folderPath);
    const exists = await contract.folderExists(folderPath);
    if (exists) {
      res.json({
        success: true,
        message: `Folder ${folderPath} created successfully`,
      });
    } else {
      res.status(500).json({ success: false, error: "Folder creation failed" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    await contract.deleteFile(name);
    res.json({ success: true, message: `File ${name} deleted successfully` });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/file/:name/history", async (req, res) => {
  try {
    const { name } = req.params;
    const latestVersion = await contract.getLatestVersion(name);
    const history = [];

    for (let version = 1; version <= latestVersion; version++) {
      const [ipfsHash, owner, timestamp] = await contract.getFile(
        name,
        version
      );
      history.push({
        version,
        ipfsHash,
        owner,
        timestamp: new Date(timestamp * 1000).toISOString(),
      });
    }

    res.json({ success: true, history });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/file/:name/revert", async (req, res) => {
  try {
    const { name } = req.params;
    const { version } = req.body;

    await contract.revertFile(name, version);

    const latestVersion = await contract.getLatestVersion(name);
    res.json({
      success: true,
      message: `File ${name} reverted to version ${version}`,
      newVersion: latestVersion.toNumber(),
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
