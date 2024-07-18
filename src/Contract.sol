// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract FileStorage {
    struct File {
        string ipfsHash;
        address owner;
    }

    mapping(string => File) public files;
    string[] public fileList;
    uint public fileCount;

    event FileUploaded(string name, string ipfsHash, address owner);
    event FileDeleted(string name);

    function uploadFile(string memory name, string memory ipfsHash) public {
        require(files[name].owner == address(0), "File already exists");
        files[name] = File(ipfsHash, msg.sender);
        fileList.push(name);
        fileCount++;
        emit FileUploaded(name, ipfsHash, msg.sender);
    }

    function getFile(string memory name) public view returns (string memory, address) {
        File memory file = files[name];
        require(file.owner != address(0), "File does not exist");
        return (file.ipfsHash, file.owner);
    }

    function deleteFile(string memory name) public {
        require(files[name].owner == msg.sender, "Only the owner can delete the file");
        delete files[name];
        for (uint i = 0; i < fileList.length; i++) {
            if (keccak256(abi.encodePacked(fileList[i])) == keccak256(abi.encodePacked(name))) {
                fileList[i] = fileList[fileList.length - 1];
                fileList.pop();
                break;
            }
        }
        fileCount--;
        emit FileDeleted(name);
    }

    function getAllFiles() public view returns (string[] memory) {
        return fileList;
    }
}