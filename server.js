import express from "express";
import { create } from "ipfs-http-client";
import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";

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
const contractAddress = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F"; // Replace with your deployed contract address

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

const fileCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const searchIndex = {};
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(limiter);

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 file uploads per hour
  message: "Too many file uploads from this IP, please try again after an hour",
});

app.post("/upload", uploadLimiter, async (req, res) => {
  try {
    const { name, content, folderPath } = req.body;
    const buffer = Buffer.from(content, "base64");
    console.log("Received encrypted content:", content.substring(0, 100)); // Log first 100 chars
    const { cid } = await ipfs.add(buffer);
    await contract.uploadFile(name, cid.toString(), folderPath);
    const latestVersion = await contract.getLatestVersion(name);

    // Add to search index
    searchIndex[name.toLowerCase()] = {
      name,
      folderPath,
      content: buffer.toString().toLowerCase(),
    };

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

    const cacheKey = `file:${name}:${version || "latest"}`;
    const cachedFile = fileCache.get(cacheKey);

    if (cachedFile) {
      return res.json(cachedFile);
    }

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
    const content = Buffer.concat(chunks).toString("base64");
    console.log("Sending encrypted content:", content.substring(0, 100)); // Log first 100 chars

    const fileData = {
      success: true,
      content,
      owner,
      version: versionToFetch,
      latestVersion: latestVersion.toNumber(),
      timestamp: new Date(timestamp * 1000).toISOString(),
      folderPath,
    };

    fileCache.set(cacheKey, fileData);

    res.json(fileData);
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
        folderPath: path.dirname(folder) + "/",
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

    // First, check if the folder already exists
    const exists = await contract.folderExists(folderPath);

    if (exists) {
      // If the folder already exists, return a success response
      res.json({
        success: true,
        message: `Folder ${folderPath} already exists`,
      });
    } else {
      // If the folder doesn't exist, create it
      await contract.createFolder(folderPath);
      res.json({
        success: true,
        message: `Folder ${folderPath} created successfully`,
      });
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

app.get("/search", (req, res) => {
  const { query } = req.query;
  const results = Object.values(searchIndex).filter(
    (file) =>
      file.name.toLowerCase().includes(query.toLowerCase()) ||
      file.content.includes(query.toLowerCase())
  );
  res.json({ success: true, results });
});

app.post("/share", async (req, res) => {
  try {
    const { fileName, sharedWith } = req.body;
    await contract.shareFile(fileName, sharedWith);
    res.json({
      success: true,
      message: `File ${fileName} shared with ${sharedWith}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/revoke-share", async (req, res) => {
  try {
    const { fileName, revokedFrom } = req.body;
    await contract.revokeFileSharing(fileName, revokedFrom);
    res.json({
      success: true,
      message: `File sharing revoked for ${fileName} from ${revokedFrom}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
