// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract FileStorage {
    struct File {
        string ipfsHash;
        address owner;
    }

    mapping(string => File) public files;

    event FileUploaded(string name, string ipfsHash, address owner);

    function uploadFile(string memory name, string memory ipfsHash) public {
        require(files[name].owner == address(0), "File already exists");
        files[name] = File(ipfsHash, msg.sender);
        emit FileUploaded(name, ipfsHash, msg.sender);
    }

    function getFile(string memory name) public view returns (string memory, address) {
        File memory file = files[name];
        require(file.owner != address(0), "File does not exist");
        return (file.ipfsHash, file.owner);
    }
}