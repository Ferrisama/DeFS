// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";


contract FileStorage is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct FileVersion {
        string ipfsHash;
        uint256 timestamp;
    }

    struct File {
        FileVersion[] versions;
        address owner;
        string folderPath;
    }

    mapping(string => bool) public folders;

    mapping(string => File) public files;
    string[] public fileList;
    uint public fileCount;

    event FileUploaded(string name, string ipfsHash, address owner, uint256 version, string folderPath);
    event FileReverted(string name, uint256 fromVersion, uint256 newVersion);
    event FileDeleted(string name);
    event FolderCreated(string folderPath);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }



    function uploadFile(string memory name, string memory ipfsHash, string memory folderPath) public {
        if (files[name].owner == address(0)) {
            fileList.push(name);
            fileCount++;
            files[name].owner = msg.sender;
            files[name].folderPath = folderPath;
        } else {
            require(files[name].owner == msg.sender, "Only the owner can update the file");
        }
        
        files[name].versions.push(FileVersion(ipfsHash, block.timestamp));
        emit FileUploaded(name, ipfsHash, msg.sender, files[name].versions.length, folderPath);
    }

    function getFile(string memory name, uint256 version) public view returns (string memory, address, uint256, string memory) {
        require(files[name].owner != address(0), "File does not exist");
        require(version > 0 && version <= files[name].versions.length, "Invalid version");
        
        FileVersion memory fileVersion = files[name].versions[version - 1];
        return (fileVersion.ipfsHash, files[name].owner, fileVersion.timestamp, files[name].folderPath);
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
        emit FileUploaded(name, ipfsHash, msg.sender, newVersion, files[name].folderPath);
    }

    function createFolder(string memory folderPath) public {
    require(!folders[folderPath], "Folder already exists");
    folders[folderPath] = true;
    emit FolderCreated(folderPath);
    }
    
    function folderExists(string memory folderPath) public view returns (bool) {
    return folders[folderPath];
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}