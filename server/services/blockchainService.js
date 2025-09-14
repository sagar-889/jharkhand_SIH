const { ethers } = require('ethers');
const crypto = require('crypto');

// Smart contract ABI (simplified for demonstration)
const CONTRACT_ABI = [
  "function verifyProvider(address provider, string memory data) public returns (bool)",
  "function issueCertificate(address provider, string memory certificateType, uint256 validityPeriod) public returns (uint256)",
  "function verifyCertificate(uint256 certificateId) public view returns (bool)",
  "function revokeCertificate(uint256 certificateId, string memory reason) public returns (bool)",
  "function getCertificate(uint256 certificateId) public view returns (tuple(address provider, string memory type, uint256 issuedAt, uint256 validUntil, bool isActive))",
  "function getProviderVerification(address provider) public view returns (bool)",
  "event ProviderVerified(address indexed provider, string data, uint256 timestamp)",
  "event CertificateIssued(uint256 indexed certificateId, address indexed provider, string certificateType, uint256 timestamp)",
  "event CertificateRevoked(uint256 indexed certificateId, string reason, uint256 timestamp)"
];

let provider = null;
let wallet = null;
let contract = null;

// Initialize blockchain connection only if ETHEREUM_RPC_URL and PRIVATE_KEY look valid
const initBlockchain = () => {
  try {
    if (!process.env.ETHEREUM_RPC_URL) {
      console.warn('ETHEREUM_RPC_URL not set — blockchain features disabled');
      return;
    }

    provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

    const pk = process.env.PRIVATE_KEY || '';
    // Basic check: private key should be 66 chars (0x + 64 hex) or 64 hex chars
    if (!pk || (!pk.startsWith('0x') ? pk.length !== 64 : pk.length !== 66)) {
      console.warn('PRIVATE_KEY missing or appears invalid — skipping wallet creation');
      return;
    }

    wallet = new ethers.Wallet(pk, provider);

    if (process.env.CONTRACT_ADDRESS) {
      contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    } else {
      console.warn('CONTRACT_ADDRESS not set — contract interactions will be disabled');
    }
  } catch (err) {
    console.error('Failed to initialize blockchain client:', err.message || err);
    provider = null;
    wallet = null;
    contract = null;
  }
};

initBlockchain();

// @desc    Verify service provider on blockchain
exports.verifyProvider = async (params) => {
  try {
    if (!contract) {
      return { success: false, error: 'Blockchain not configured on server' };
    }
    const { providerId, providerData, verificationData, certificateType } = params;

    // Create verification data hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(verificationData))
      .digest('hex');

    // Call smart contract to verify provider
    const tx = await contract.verifyProvider(
      providerId,
      verificationHash,
      {
        gasLimit: 500000
      }
    );

    await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash,
      contractAddress: contract.target,
      verificationHash: verificationHash,
      blockNumber: tx.blockNumber
    };
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Issue digital certificate on blockchain
exports.issueCertificate = async (params) => {
  try {
    if (!contract) {
      return { success: false, error: 'Blockchain not configured on server' };
    }
    const { providerId, providerData, certificateType, validityPeriod, description } = params;

    // Create certificate metadata
    const certificateMetadata = {
      providerId: providerId,
      providerData: providerData,
      certificateType: certificateType,
      validityPeriod: validityPeriod,
      description: description,
      issuedAt: new Date().toISOString()
    };

    // Create certificate hash
    const certificateHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(certificateMetadata))
      .digest('hex');

    // Call smart contract to issue certificate
    const tx = await contract.issueCertificate(
      providerId,
      certificateType,
      validityPeriod,
      {
        gasLimit: 600000
      }
    );

    const receipt = await tx.wait();
    
    // Extract certificate ID from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch (e) {
        return false;
      }
    });

    let certificateId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      certificateId = parsed.args.certificateId.toString();
    }

    return {
      success: true,
      transactionHash: tx.hash,
      contractAddress: contract.target,
      certificateId: certificateId,
      certificateHash: certificateHash,
      blockNumber: tx.blockNumber,
      metadata: certificateMetadata
    };
  } catch (error) {
    console.error('Blockchain certificate issuance error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Verify certificate on blockchain
exports.verifyCertificate = async (params) => {
  try {
    if (!contract) {
      return { success: false, error: 'Blockchain not configured on server', isValid: false };
    }
    const { certificateId, contractAddress, blockchainHash } = params;

    // Call smart contract to verify certificate
    const isActive = await contract.verifyCertificate(certificateId);
    
    // Get certificate details
    const certificateDetails = await contract.getCertificate(certificateId);

    return {
      success: true,
      isValid: isActive,
      certificate: {
        id: certificateId,
        provider: certificateDetails.provider,
        type: certificateDetails.type,
        issuedAt: new Date(parseInt(certificateDetails.issuedAt) * 1000),
        validUntil: new Date(parseInt(certificateDetails.validUntil) * 1000),
        isActive: certificateDetails.isActive
      },
      blockchainHash: blockchainHash,
      contractAddress: contractAddress
    };
  } catch (error) {
    console.error('Blockchain certificate verification error:', error);
    return {
      success: false,
      error: error.message,
      isValid: false
    };
  }
};

// @desc    Revoke certificate on blockchain
exports.revokeCertificate = async (params) => {
  try {
    if (!contract) {
      return { success: false, error: 'Blockchain not configured on server' };
    }
    const { certificateId, contractAddress, reason } = params;

    // Call smart contract to revoke certificate
    const tx = await contract.revokeCertificate(
      certificateId,
      reason,
      {
        gasLimit: 400000
      }
    );

    await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: tx.blockNumber
    };
  } catch (error) {
    console.error('Blockchain certificate revocation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Get blockchain network status
exports.getBlockchainNetworkStatus = async () => {
  try {
    if (!provider) {
      return { isConnected: false, error: 'Blockchain provider not configured', lastChecked: new Date().toISOString() };
    }

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getGasPrice();
    const balance = wallet ? await provider.getBalance(wallet.address) : null;

    return {
      networkId: network.chainId.toString(),
      networkName: network.name,
      blockNumber: blockNumber,
      gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' Gwei',
      walletBalance: balance ? ethers.formatEther(balance) + ' ETH' : null,
      isConnected: true,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Blockchain network status error:', error);
    return {
      isConnected: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
};

// @desc    Get provider verification status
exports.getProviderVerificationStatus = async (providerAddress) => {
  try {
    const isVerified = await contract.getProviderVerification(providerAddress);
    
    return {
      success: true,
      isVerified: isVerified,
      providerAddress: providerAddress
    };
  } catch (error) {
    console.error('Get provider verification status error:', error);
    return {
      success: false,
      error: error.message,
      isVerified: false
    };
  }
};

// @desc    Get certificate details from blockchain
exports.getCertificateDetails = async (certificateId) => {
  try {
    const certificate = await contract.getCertificate(certificateId);
    
    return {
      success: true,
      certificate: {
        id: certificateId,
        provider: certificate.provider,
        type: certificate.type,
        issuedAt: new Date(parseInt(certificate.issuedAt) * 1000),
        validUntil: new Date(parseInt(certificate.validUntil) * 1000),
        isActive: certificate.isActive
      }
    };
  } catch (error) {
    console.error('Get certificate details error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Get transaction details
exports.getTransactionDetails = async (transactionHash) => {
  try {
    const tx = await provider.getTransaction(transactionHash);
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    return {
      success: true,
      transaction: {
        hash: transactionHash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value) + ' ETH',
        gasLimit: tx.gasLimit.toString(),
        gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei') + ' Gwei',
        nonce: tx.nonce,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: ethers.formatUnits(receipt.gasPrice, 'gwei') + ' Gwei'
      }
    };
  } catch (error) {
    console.error('Get transaction details error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Get contract events
exports.getContractEvents = async (eventName, fromBlock = 0, toBlock = 'latest') => {
  try {
    const filter = contract.filters[eventName]();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return {
      success: true,
      events: events.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.logIndex,
        args: event.args,
        timestamp: new Date()
      }))
    };
  } catch (error) {
    console.error('Get contract events error:', error);
    return {
      success: false,
      error: error.message,
      events: []
    };
  }
};

// @desc    Estimate gas for transaction
exports.estimateGas = async (methodName, ...args) => {
  try {
    const gasEstimate = await contract[methodName].estimateGas(...args);
    
    return {
      success: true,
      gasEstimate: gasEstimate.toString(),
      gasEstimateGwei: ethers.formatUnits(gasEstimate, 'gwei') + ' Gwei'
    };
  } catch (error) {
    console.error('Estimate gas error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// @desc    Get wallet balance
exports.getWalletBalance = async () => {
  try {
    const balance = await provider.getBalance(wallet.address);
    
    return {
      success: true,
      balance: ethers.formatEther(balance) + ' ETH',
      balanceWei: balance.toString()
    };
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

