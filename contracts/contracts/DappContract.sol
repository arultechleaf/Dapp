// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DappContract {
    address public immutable owner;

    string public message;
    uint256 public counter;

    mapping(address => uint256) public balances;

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        uint256 blockNumber;
        string transactionType;
    }

    mapping(address => Transaction[]) private transactionHistory;

    mapping(address => uint256) public totalDeposited;
    mapping(address => uint256) public totalWithdrawn;
    mapping(address => uint256) public transactionCount;

    event MessageChanged(address indexed by, string newMessage);
    event CounterIncremented(address indexed by, uint256 newValue);
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event DirectEtherReceived(address indexed account, uint256 amount);

    error InvalidAddress();
    error SelfAddressNotAllowed();
    error EmptyMessage();
    error EmptyInitialMessage();
    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error InsufficientContractBalance(uint256 requested, uint256 available);
    error TransferFailed();
    error InvalidTransactionIndex();

    constructor(string memory initialMessage) {
        if (bytes(initialMessage).length == 0) {
            revert EmptyInitialMessage();
        }
        owner = msg.sender;
        message = initialMessage;
    }

    function _validateAddress(address account) internal view {
        if (account == address(0)) {
            revert InvalidAddress();
        }

        if (account == address(this)) {
            revert SelfAddressNotAllowed();
        }
    }

    function setMessage(string calldata newMessage) external {
        if (bytes(newMessage).length == 0) {
            revert EmptyMessage();
        }

        message = newMessage;

        emit MessageChanged(msg.sender, newMessage);
    }

    function increment() external {
        counter += 1;

        emit CounterIncremented(msg.sender, counter);
    }

    function deposit() external payable {
        if (msg.value == 0) {
            revert ZeroAmount();
        }

        balances[msg.sender] += msg.value;
        totalDeposited[msg.sender] += msg.value;
        transactionCount[msg.sender] += 1;

        transactionHistory[msg.sender].push(
            Transaction({
                from: msg.sender,
                to: address(this),
                amount: msg.value,
                timestamp: block.timestamp,
                blockNumber: block.number,
                transactionType: "DEPOSIT"
            })
        );

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }

        uint256 available = balances[msg.sender];

        if (amount > available) {
            revert InsufficientBalance(amount, available);
        }

        uint256 contractBalance = address(this).balance;

        if (amount > contractBalance) {
            revert InsufficientContractBalance(
                amount,
                contractBalance
            );
        }

        balances[msg.sender] = available - amount;
        totalWithdrawn[msg.sender] += amount;
        transactionCount[msg.sender] += 1;

        transactionHistory[msg.sender].push(
            Transaction({
                from: address(this),
                to: msg.sender,
                amount: amount,
                timestamp: block.timestamp,
                blockNumber: block.number,
                transactionType: "WITHDRAW"
            })
        );

        emit Withdrawn(msg.sender, amount);

        (bool success, ) =
            payable(msg.sender).call{value: amount}("");

        if (!success) {
            revert TransferFailed();
        }
    }

    function getAccountBalance()
        external
        view
        returns (uint256)
    {
        return balances[msg.sender];
    }

    function getBalance(address account)
        external
        view
        returns (uint256)
    {
        _validateAddress(account);

        return balances[account];
    }

    function totalDeposits()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    function getAccountSummary(address account)
        external
        view
        returns (
            uint256 balance,
            uint256 deposited,
            uint256 withdrawn,
            uint256 transactions
        )
    {
        _validateAddress(account);

        return (
            balances[account],
            totalDeposited[account],
            totalWithdrawn[account],
            transactionCount[account]
        );
    }

    function getTransactionCount(address account)
        external
        view
        returns (uint256)
    {
        _validateAddress(account);

        return transactionHistory[account].length;
    }

    function getTransaction(
        address account,
        uint256 index
    )
        external
        view
        returns (
            address from,
            address to,
            uint256 amount,
            uint256 timestamp,
            uint256 blockNumber,
            string memory transactionType
        )
    {
        _validateAddress(account);

        if (index >= transactionHistory[account].length) {
            revert InvalidTransactionIndex();
        }

        Transaction memory txData =
            transactionHistory[account][index];

        return (
            txData.from,
            txData.to,
            txData.amount,
            txData.timestamp,
            txData.blockNumber,
            txData.transactionType
        );
    }

    function getTransactions(address account)
        external
        view
        returns (Transaction[] memory)
    {
        _validateAddress(account);

        return transactionHistory[account];
    }

    receive() external payable {
        if (msg.value == 0) {
            revert ZeroAmount();
        }

        emit DirectEtherReceived(
            msg.sender,
            msg.value
        );
    }

    fallback() external payable {
        if (msg.value == 0) {
            revert();
        }

        emit DirectEtherReceived(
            msg.sender,
            msg.value
        );
    }
}
