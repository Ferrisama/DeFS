# Decentralized File Storage (DFS)

## Project Overview

Decentralized File Storage (DFS) is a secure, blockchain-based file management system that allows users to store, share, and manage files with end-to-end encryption. Built on Ethereum and IPFS, DFS provides a decentralized alternative to traditional cloud storage solutions, ensuring data privacy and integrity.

## Key Features

- **End-to-End Encryption**: All files are encrypted before storage and decrypted only on the client-side.
- **Blockchain-Based Access Control**: Utilizes Ethereum smart contracts for managing file access and permissions.
- **Version Control**: Maintains a history of file versions with the ability to view and rollback to previous versions.
- **File Sharing**: Securely share files with other Ethereum addresses.
- **Folder Management**: Create and navigate through a hierarchical folder structure.
- **File Preview**: In-app preview for various file types including text, images, and PDFs.
- **Search Functionality**: Quick and easy file search across your storage.

## Technologies Used

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Blockchain**: Ethereum (Solidity for smart contracts)
- **Storage**: IPFS (InterPlanetary File System)
- **Authentication**: Auth0
- **Encryption**: CryptoJS

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- An Ethereum wallet (like MetaMask)
- IPFS node (for development, you can use a local node or a service like Infura)

## Installation and Setup

1. Clone the repository:

   ```
   git clone https://github.com/ferrisama/decentralized-file-storage.git
   cd decentralized-file-storage
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:

   ```
   REACT_APP_AUTH0_DOMAIN=your_auth0_domain
   REACT_APP_AUTH0_CLIENT_ID=your_auth0_client_id
   REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
   REACT_APP_IPFS_NODE=your_ipfs_node_address
   ```

4. Deploy the smart contract:

   - Compile and deploy the `FileStorage.sol` contract to your preferred Ethereum network (mainnet, testnet, or local blockchain).
   - Update the `contractAddress` in `App.js` with your deployed contract address.

5. Start the development server:

   ```
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Usage

1. Connect your Ethereum wallet (e.g., MetaMask) to the app.
2. Set an encryption key for your files (remember this key, as it's required for decryption).
3. Upload files using the file upload component.
4. Navigate through your files and folders.
5. Use the search functionality to find specific files.
6. Share files with other Ethereum addresses.
7. View file versions and use the rollback feature if needed.
8. Compare different versions of a file using the Diff View.

## Contributing

Contributions to the Decentralized File Storage project are welcome. Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- [React.js](https://reactjs.org/)
- [Ethereum](https://ethereum.org/)
- [IPFS](https://ipfs.io/)
- [Auth0](https://auth0.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [CryptoJS](https://cryptojs.gitbook.io/docs/)
