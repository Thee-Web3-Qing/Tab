// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @notice Atomic USDC settlement splitter for Tab.
/// @dev Creditor amounts are exact. Tab charges a dynamic fee from 0.5% to 3%
///      using a 0.03 USDC minimum fee floor. Fee wallet is immutable.
contract TabSettlement {
    IERC20 public immutable usdc;
    address public immutable feeWallet;

    uint256 public constant BPS = 10_000;
    uint256 public constant BASE_FEE_BPS = 50;   // 0.5%
    uint256 public constant MAX_FEE_BPS = 300;   // 3%
    uint256 public constant MIN_FEE = 30_000;    // 0.03 USDC at 6 decimals

    event BatchSettled(
        address indexed payer,
        uint256 totalSettlement,
        uint256 tabFee,
        uint256 effectiveFeeBps,
        uint256 recipientCount
    );

    constructor(address usdc_, address feeWallet_) {
        require(usdc_ != address(0), "USDC_ZERO");
        require(feeWallet_ != address(0), "FEE_WALLET_ZERO");
        usdc = IERC20(usdc_);
        feeWallet = feeWallet_;
    }

    function quoteFee(uint256 total) public pure returns (uint256 fee, uint256 effectiveFeeBps) {
        require(total > 0, "TOTAL_ZERO");

        uint256 baseFee = (total * BASE_FEE_BPS + BPS - 1) / BPS;
        uint256 maxFee = (total * MAX_FEE_BPS + BPS - 1) / BPS;

        fee = baseFee;
        if (fee < MIN_FEE) fee = MIN_FEE;
        if (fee > maxFee) fee = maxFee;

        effectiveFeeBps = (fee * BPS + total - 1) / total;
        if (effectiveFeeBps < BASE_FEE_BPS) effectiveFeeBps = BASE_FEE_BPS;
        if (effectiveFeeBps > MAX_FEE_BPS) effectiveFeeBps = MAX_FEE_BPS;
    }

    function settle(address[] calldata recipients, uint256[] calldata amounts) external {
        uint256 length = recipients.length;
        require(length > 0 && length == amounts.length, "BAD_BATCH");

        uint256 total;
        for (uint256 i; i < length; ++i) {
            require(recipients[i] != address(0), "RECIPIENT_ZERO");
            require(amounts[i] > 0, "AMOUNT_ZERO");
            total += amounts[i];
        }

        (uint256 fee, uint256 effectiveFeeBps) = quoteFee(total);

        for (uint256 i; i < length; ++i) {
            require(usdc.transferFrom(msg.sender, recipients[i], amounts[i]), "SETTLEMENT_TRANSFER_FAILED");
        }
        require(usdc.transferFrom(msg.sender, feeWallet, fee), "FEE_TRANSFER_FAILED");

        emit BatchSettled(msg.sender, total, fee, effectiveFeeBps, length);
    }
}
