import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("DappContract", function () {
  async function deploy() {
    const [owner, alice] = await ethers.getSigners();
    const dapp = await ethers.deployContract("DappContract", ["Hello, EVM!"]);
    return { dapp, owner, alice };
  }

  it("stores the initial message and owner", async function () {
    const { dapp, owner } = await deploy();
    expect(await dapp.message()).to.equal("Hello, EVM!");
    expect(await dapp.owner()).to.equal(owner.address);
  });

  it("updates the message and emits an event", async function () {
    const { dapp, alice } = await deploy();
    await expect(dapp.connect(alice).setMessage("gm"))
      .to.emit(dapp, "MessageChanged")
      .withArgs(alice.address, "gm");
    expect(await dapp.message()).to.equal("gm");
  });

  it("rejects an empty message", async function () {
    const { dapp } = await deploy();
    await expect(dapp.setMessage("")).to.be.revertedWithCustomError(dapp, "EmptyMessage");
  });

  it("increments the counter", async function () {
    const { dapp } = await deploy();
    await dapp.increment();
    await expect(dapp.increment()).to.emit(dapp, "CounterIncremented").withArgs(anyAddress(), 2n);
    expect(await dapp.counter()).to.equal(2n);
  });

  it("handles deposits and withdrawals", async function () {
    const { dapp, alice } = await deploy();
    const amount = ethers.parseEther("1");

    await expect(dapp.connect(alice).deposit({ value: amount }))
      .to.emit(dapp, "Deposited")
      .withArgs(alice.address, amount);
    expect(await dapp.balances(alice.address)).to.equal(amount);
    expect(await dapp.totalDeposits()).to.equal(amount);

    await expect(dapp.connect(alice).withdraw(amount)).to.changeEtherBalances(
      ethers,
      [alice, dapp],
      [amount, -amount],
    );
    expect(await dapp.balances(alice.address)).to.equal(0n);
  });

  it("rejects zero deposits and over-withdrawals", async function () {
    const { dapp, alice } = await deploy();
    await expect(dapp.deposit({ value: 0 })).to.be.revertedWithCustomError(dapp, "ZeroAmount");
    await expect(dapp.connect(alice).withdraw(1n))
      .to.be.revertedWithCustomError(dapp, "InsufficientBalance")
      .withArgs(1n, 0n);
  });

  it("rejects an empty initial message", async function () {
    const factory = await ethers.getContractFactory("DappContract");
    await expect(factory.deploy("")).to.be.revertedWithCustomError(factory, "EmptyInitialMessage");
  });

  it("records deposit and withdraw history", async function () {
    const { dapp, alice } = await deploy();
    const dappAddress = await dapp.getAddress();

    await dapp.connect(alice).deposit({ value: ethers.parseEther("2") });
    await dapp.connect(alice).withdraw(ethers.parseEther("0.5"));

    expect(await dapp.getTransactionCount(alice.address)).to.equal(2n);

    const history = await dapp.getTransactions(alice.address);
    expect(history.length).to.equal(2);
    expect(history[0].transactionType).to.equal("DEPOSIT");
    expect(history[0].from).to.equal(alice.address);
    expect(history[0].to).to.equal(dappAddress);
    expect(history[0].amount).to.equal(ethers.parseEther("2"));
    expect(history[1].transactionType).to.equal("WITHDRAW");
    expect(history[1].from).to.equal(dappAddress);
    expect(history[1].to).to.equal(alice.address);
    expect(history[1].amount).to.equal(ethers.parseEther("0.5"));

    const second = await dapp.getTransaction(alice.address, 1);
    expect(second.transactionType).to.equal("WITHDRAW");
    await expect(dapp.getTransaction(alice.address, 2)).to.be.revertedWithCustomError(
      dapp,
      "InvalidTransactionIndex",
    );
  });

  it("returns balance and account summary", async function () {
    const { dapp, alice } = await deploy();
    await dapp.connect(alice).deposit({ value: ethers.parseEther("3") });
    await dapp.connect(alice).withdraw(ethers.parseEther("1"));

    expect(await dapp.getBalance(alice.address)).to.equal(ethers.parseEther("2"));
    expect(await dapp.connect(alice).getAccountBalance()).to.equal(ethers.parseEther("2"));

    const summary = await dapp.getAccountSummary(alice.address);
    expect(summary.balance).to.equal(ethers.parseEther("2"));
    expect(summary.deposited).to.equal(ethers.parseEther("3"));
    expect(summary.withdrawn).to.equal(ethers.parseEther("1"));
    expect(summary.transactions).to.equal(2n);
  });

  it("rejects the zero address and the contract itself in views", async function () {
    const { dapp } = await deploy();
    await expect(dapp.getBalance(ethers.ZeroAddress)).to.be.revertedWithCustomError(dapp, "InvalidAddress");
    await expect(dapp.getAccountSummary(await dapp.getAddress())).to.be.revertedWithCustomError(
      dapp,
      "SelfAddressNotAllowed",
    );
  });

  it("accepts direct ETH without crediting a balance", async function () {
    const { dapp, alice } = await deploy();
    const amount = ethers.parseEther("1");

    await expect(alice.sendTransaction({ to: await dapp.getAddress(), value: amount }))
      .to.emit(dapp, "DirectEtherReceived")
      .withArgs(alice.address, amount);
    expect(await dapp.totalDeposits()).to.equal(amount);
    expect(await dapp.balances(alice.address)).to.equal(0n);

    await expect(alice.sendTransaction({ to: await dapp.getAddress(), value: 0 })).to.be.revertedWithCustomError(
      dapp,
      "ZeroAmount",
    );
  });
});

function anyAddress() {
  return (value) => ethers.isAddress(value);
}
