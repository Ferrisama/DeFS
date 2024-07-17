const express = require("express");
const { create } = require("ipfs-http-client");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
const ipfs = create({ url: "http://localhost:5001" });

// Load contract ABI and address (you'll need to deploy the contract first)
const contractABI = JSON.parse(
  fs.readFileSync("./out/Contract.sol/FileStorage.json")
).abi;
const contractAddress = "0x..."; // Replace with your deployed contract address

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

app.use(express.json());

app.post("/upload", async (req, res) => {
  try {
    const { name, content } = req.body;
    const { cid } = await ipfs.add(content);
    await contract.uploadFile(name, cid.toString());
    res.json({ success: true, cid: cid.toString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/file/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const [ipfsHash, owner] = await contract.getFile(name);
    const content = await ipfs.cat(ipfsHash);
    res.json({ success: true, content: content.toString(), owner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
