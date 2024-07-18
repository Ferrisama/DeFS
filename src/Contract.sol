// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract FileStorage {
    struct FileVersion {
        string ipfsHash;
        uint256 timestamp;
    }

    struct File {
        FileVersion[] versions;
        address owner;
    }

    mapping(string => File) public files;
    string[] public fileList;
    uint public fileCount;

    event FileUploaded(string name, string ipfsHash, address owner, uint256 version);
    event FileReverted(string name, uint256 fromVersion, uint256 newVersion);
    event FileDeleted(string name);

    function uploadFile(string memory name, string memory ipfsHash) public {
        if (files[name].owner == address(0)) {
            fileList.push(name);
            fileCount++;
            files[name].owner = msg.sender;
        } else {
            require(files[name].owner == msg.sender, "Only the owner can update the file");
        }
        
        files[name].versions.push(FileVersion(ipfsHash, block.timestamp));
        emit FileUploaded(name, ipfsHash, msg.sender, files[name].versions.length);
    }

    function getFile(string memory name, uint256 version) public view returns (string memory, address, uint256) {
        require(files[name].owner != address(0), "File does not exist");
        require(version > 0 && version <= files[name].versions.length, "Invalid version");
        
        FileVersion memory fileVersion = files[name].versions[version - 1];
        return (fileVersion.ipfsHash, files[name].owner, fileVersion.timestamp);
    }

    function getLatestVersion(string memory name) public view returns (uint256) {
        require(files[name].owner != address(0), "File does not exist");
        return files[name].versions.length;
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

    function revertFile(string memory name, uint256 versionToRevert) public {
        require(files[name].owner == msg.sender, "Only the owner can revert the file");
        require(versionToRevert > 0 && versionToRevert <= files[name].versions.length, "Invalid version");
        
        string memory ipfsHash = files[name].versions[versionToRevert - 1].ipfsHash;
        files[name].versions.push(FileVersion(ipfsHash, block.timestamp));
        
        uint256 newVersion = files[name].versions.length;
        emit FileReverted(name, versionToRevert, newVersion);
        emit FileUploaded(name, ipfsHash, msg.sender, newVersion);
    }
}