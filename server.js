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
const contractAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // Replace with your deployed contract address

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

app.use(cors());
app.use(express.json());

app.post("/upload", async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res
        .status(400)
        .json({ success: false, error: "Name and content are required" });
    }
    const buffer = Buffer.from(content, "base64");
    const { cid } = await ipfs.add(buffer);
    await contract.uploadFile(name, cid.toString());
    res.json({ success: true, cid: cid.toString() });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const [ipfsHash, owner] = await contract.getFile(name);

    const chunks = [];
    for await (const chunk of ipfs.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString();

    res.json({ success: true, content: content, owner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/files", async (req, res) => {
  try {
    const fileCount = await contract.fileCount();
    const files = [];
    for (let i = 0; i < fileCount; i++) {
      const fileName = await contract.fileList(i);
      files.push(fileName);
    }
    res.json({ success: true, files });
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

app.listen(3000, () => console.log("Server running on port 3000"));
