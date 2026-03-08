// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PredictionMarket
 * @notice Onchain prediction market protocol on Base using USDC
 * @dev Deploy on Base Sepolia first, then Base Mainnet
 *
 * How it works:
 * 1. Anyone creates a market with a question, end time, and N options
 * 2. Users approve USDC then call placeBet(marketId, optionIndex, amount)
 * 3. All USDC goes into a pool. Each option has its own sub-pool.
 * 4. Creator resolves the market after end time by setting the winning option.
 * 5. Winners claim proportional share of the total pool based on their bet.
 *
 * Deploy: forge create PredictionMarket --constructor-args <USDC_ADDRESS>
 * Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
 */
contract PredictionMarket {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    struct Market {
        address creator;
        string question;
        uint256 endTime;
        bool resolved;
        uint256 winningOption;
        uint256 totalPool;
        uint256 optionCount;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    // marketId => optionIndex => total USDC in that option's pool
    mapping(uint256 => mapping(uint256 => uint256)) public optionPools;
    // marketId => user => optionIndex => amount bet
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userBets;
    // marketId => user => claimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime, uint256 optionCount);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 optionIndex, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 winningOption);
    event Claimed(uint256 indexed marketId, address indexed bettor, uint256 amount);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createMarket(string calldata question, uint256 endTime, uint256 optionCount) external returns (uint256 marketId) {
        require(endTime > block.timestamp, "End time must be in future");
        require(optionCount >= 2 && optionCount <= 10, "2-10 options");

        marketId = marketCount++;
        markets[marketId] = Market({
            creator: msg.sender,
            question: question,
            endTime: endTime,
            resolved: false,
            winningOption: 0,
            totalPool: 0,
            optionCount: optionCount
        });

        emit MarketCreated(marketId, msg.sender, question, endTime, optionCount);
    }

    function placeBet(uint256 marketId, uint256 optionIndex, uint256 amount) external {
        Market storage m = markets[marketId];
        require(m.optionCount > 0, "Market does not exist");
        require(!m.resolved, "Market already resolved");
        require(block.timestamp < m.endTime, "Market has ended");
        require(optionIndex < m.optionCount, "Invalid option");
        require(amount > 0, "Amount must be > 0");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        m.totalPool += amount;
        optionPools[marketId][optionIndex] += amount;
        userBets[marketId][msg.sender][optionIndex] += amount;

        emit BetPlaced(marketId, msg.sender, optionIndex, amount);
    }

    function resolveMarket(uint256 marketId, uint256 winningOption) external {
        Market storage m = markets[marketId];
        require(msg.sender == m.creator, "Only creator can resolve");
        require(block.timestamp >= m.endTime, "Market not ended yet");
        require(!m.resolved, "Already resolved");
        require(winningOption < m.optionCount, "Invalid option");

        m.resolved = true;
        m.winningOption = winningOption;

        emit MarketResolved(marketId, winningOption);
    }

    function claim(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.resolved, "Market not resolved");
        require(!hasClaimed[marketId][msg.sender], "Already claimed");

        uint256 userBet = userBets[marketId][msg.sender][m.winningOption];
        require(userBet > 0, "No winning bet");

        uint256 winPool = optionPools[marketId][m.winningOption];
        uint256 payout = (userBet * m.totalPool) / winPool;

        hasClaimed[marketId][msg.sender] = true;
        usdc.safeTransfer(msg.sender, payout);

        emit Claimed(marketId, msg.sender, payout);
    }

    // View helpers
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getOptionPool(uint256 marketId, uint256 optionIndex) external view returns (uint256) {
        return optionPools[marketId][optionIndex];
    }

    function getUserBet(uint256 marketId, address user, uint256 optionIndex) external view returns (uint256) {
        return userBets[marketId][user][optionIndex];
    }
}
