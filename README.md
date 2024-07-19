# Decentralized File Storage System

This project is a decentralized file storage system built using Ethereum blockchain, IPFS, and React. It allows users to upload, retrieve, and manage files with version control capabilities.

## Features

- Upload files to IPFS and store metadata on Ethereum blockchain
- Retrieve files from IPFS using blockchain metadata
- Version control: upload multiple versions of a file
- View version history of files
- Revert to previous versions of a file
- Delete files
- Basic CSV data visualization for uploaded CSV files

## Technologies Used

- Solidity for smart contracts
- Foundry for Ethereum development environment
- IPFS for decentralized file storage
- Node.js and Express for the backend server
- React for the frontend
- Ethers.js for Ethereum interaction
- Recharts for data visualization
- Tailwind CSS for styling

## Authentication and Login Flow

This project uses Auth0 for user authentication and implements a login-first approach:

- Users are presented with a login page when they first visit the application.
- Authentication is required to access the main file storage functionality.
- Once logged in, users can access all features of the application.
- Users can log out at any time, which will return them to the login page.

### Login Flow

1. When a user visits the application, they are presented with a login page.
2. The user clicks the "Sign in to get started" button, which initiates the Auth0 login process.
3. After successful authentication, the user is redirected to the main application.
4. The main application displays a personalized welcome message and provides access to all file storage features.
5. Users can log out using the logout button in the top right corner.

This login flow provides several benefits:

- It ensures that all users are authenticated before accessing the application.
- It provides a clear and focused entry point for users.
- It allows for future implementation of user-specific features and data.

### Why This Approach?

While the core file storage functionality doesn't strictly require authentication, this login-first approach:

1. Demonstrates integration of a complete authentication flow.
2. Provides a foundation for future user-specific features.
3. Enhances the perceived security and professionalism of the application.
4. Showcases skills in managing application state and conditional rendering based on auth status.

### Setup

To use Auth0 and this login flow in your local development:

1. Sign up for an Auth0 account and create a new application.
2. In `src/index.js`, replace `YOUR_AUTH0_DOMAIN` and `YOUR_AUTH0_CLIENT_ID` with your Auth0 application values.
3. Ensure your Auth0 application settings include `http://localhost:3000` in the Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins.
4. Run the application and you should be presented with the login page first.

## Prerequisites

- Node.js (v14 or later)
- npm
- Foundry (for Ethereum development)
- IPFS Desktop

## Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/decentralized-file-storage.git
   cd decentralized-file-storage
   ```

2. Install backend dependencies:

   ```
   npm install
   ```

3. Install frontend dependencies:

   ```
   cd client
   npm install
   ```

4. Compile and deploy the smart contract:

   ```
   forge build
   forge create src/Contract.sol:FileStorage --interactive
   ```

   Note the deployed contract address.

5. Update the contract address in `server.js`:

   ```javascript
   const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

6. Start the IPFS Desktop application.

7. Start the backend server:

   ```
   node server.js
   ```

8. In a new terminal, start the React app:

   ```
   cd client
   npm start
   ```

9. Open your browser and navigate to `http://localhost:3001`

## Usage

1. **Upload a File**: Enter a file name, select a file, and click "Upload".
2. **View Files**: The list of uploaded files is displayed on the main page.
3. **Retrieve a File**: Click "View" next to a file name to retrieve its content.
4. **Delete a File**: Click "Delete" next to a file name to remove it from the system.
5. **View Version History**: After retrieving a file, its version history is displayed.
6. **Revert to a Previous Version**: In the version history, click "Revert" next to the desired version.
7. **CSV Visualization**: If the uploaded file is a CSV with specific headers (created_at, temperature, humidity, distance), a chart will be displayed after retrieval.

## Project Structure

- `src/Contract.sol`: Solidity smart contract for file metadata storage
- `server.js`: Express server handling IPFS and Ethereum interactions
- `client/src/App.js`: Main React component for the user interface
- `client/src/CSVAnalysis.js`: React component for CSV data visualization

## Future Enhancements

- User authentication and authorization
- Advanced search and filtering options
- Folder structure for better file organization
- Diff view between file versions
- Mobile-responsive design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
