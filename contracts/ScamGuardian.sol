// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IFtsoRegistry.sol";

/**
 * @title ScamGuardian
 * @dev Privacy-preserving AI fraud detection layer.
 */
contract ScamGuardian {
    
    struct AnalysisResult {
        string reportJson;     // Full rich JSON response (score, threat, proofs, attestation)
        bool isProcessed;
    }

    struct Request {
        address requester;
        string encryptedData; // IPFS hash or encrypted string for the TEE
        uint256 timestamp;
    }

    // Mapping from request ID to Request details
    mapping(uint256 => Request) public requests;
    
    // Mapping from request ID to Analysis Result
    mapping(uint256 => AnalysisResult) public results;

    // Counter for request IDs
    uint256 public nextRequestId;

    // Address of the authorized Confidential Compute agent
    address public authorizedAgent;
    
    // Flare FTSO Registry address (Coston2 Testnet)
    IFtsoRegistry public ftsoRegistry;

    // Events
    event AnalysisRequested(uint256 indexed requestId, address indexed requester, string encryptedData);
    event AnalysisCompleted(uint256 indexed requestId, string reportJson);

    modifier onlyAuthorizedAgent() {
        require(msg.sender == authorizedAgent, "Not authorized to submit results");
        _;
    }

    constructor(address _authorizedAgent) {
        authorizedAgent = _authorizedAgent;
        // Coston2 FTSO Registry Address
        ftsoRegistry = IFtsoRegistry(0x6d260D4ee406987f2bDE90B19F96ce75b08861B5);
    }

    /**
     * @dev Fetches the real-time price of a symbol using Flare's FTSO.
     * This is used to detect "pump and dump" or fake price claims in messages.
     */
    function getVerifiedPrice(string memory _symbol) public view returns (uint256 price, uint256 decimals) {
        (price, , decimals) = ftsoRegistry.getCurrentPriceWithDecimals(_symbol);
        return (price, decimals);
    }

    /**
     * @dev Submit a new request for fraud analysis.
     * @param _encryptedData The encrypted metadata or IPFS hash containing transaction info.
     */
    function requestAnalysis(string memory _encryptedData) external returns (uint256) {
        uint256 requestId = nextRequestId++;
        
        requests[requestId] = Request({
            requester: msg.sender,
            encryptedData: _encryptedData,
            timestamp: block.timestamp
        });

        emit AnalysisRequested(requestId, msg.sender, _encryptedData);
        
        return requestId;
    }

    /**
     * @dev Submit the result of the analysis. Only callable by the TEE agent.
     */
    function submitResult(
        uint256 _requestId,
        string memory _reportJson
    ) external onlyAuthorizedAgent {
        require(_requestId < nextRequestId, "Invalid request ID");
        require(!results[_requestId].isProcessed, "Already processed");

        results[_requestId] = AnalysisResult({
            reportJson: _reportJson,
            isProcessed: true
        });

        emit AnalysisCompleted(_requestId, _reportJson);
    }
    
    /**
     * @dev Update the authorized agent address (owner only ideally, but simplified for MVP)
     */
    function setAuthorizedAgent(address _newAgent) external {
        // In a real scenario, restrict this to owner.
        // require(msg.sender == owner, "Not owner");
        authorizedAgent = _newAgent;
    }
}
