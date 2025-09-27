import { expect } from "chai";
import hre from "hardhat";
import { CashRebateTracker } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CashRebateTracker", function () {
  let rebateTracker: CashRebateTracker;
  let owner: SignerWithAddress;
  let authority1: SignerWithAddress;
  let authority2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, authority1, authority2, user1, user2] = await ethers.getSigners();

    const CashRebateTrackerFactory = await ethers.getContractFactory("CashRebateTracker");
    const contract = await CashRebateTrackerFactory.deploy([authority1.address]);
    await contract.waitForDeployment();
    rebateTracker = contract as CashRebateTracker;
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await rebateTracker.owner()).to.equal(owner.address);
    });

    it("Should add initial authorities", async function () {
      expect(await rebateTracker.isAuthorized(authority1.address)).to.be.true;
      expect(await rebateTracker.isAuthorized(authority2.address)).to.be.false;
    });

    it("Should start with zero total records", async function () {
      expect(await rebateTracker.getTotalRecords()).to.equal(0);
    });
  });

  describe("Authority Management", function () {
    it("Should allow owner to add authority", async function () {
      await expect(rebateTracker.addAuthority(authority2.address))
        .to.emit(rebateTracker, "AuthorityAdded")
        .withArgs(authority2.address, owner.address);

      expect(await rebateTracker.isAuthorized(authority2.address)).to.be.true;
    });

    it("Should allow owner to remove authority", async function () {
      await expect(rebateTracker.removeAuthority(authority1.address))
        .to.emit(rebateTracker, "AuthorityRemoved")
        .withArgs(authority1.address, owner.address);

      expect(await rebateTracker.isAuthorized(authority1.address)).to.be.false;
    });

    it("Should not allow non-owner to add authority", async function () {
      await expect(
        rebateTracker.connect(user1).addAuthority(authority2.address)
      ).to.be.revertedWithCustomError(rebateTracker, "OwnableUnauthorizedAccount");
    });

    it("Should not allow adding zero address as authority", async function () {
      await expect(
        rebateTracker.addAuthority(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot add zero address as authority");
    });
  });

  describe("Rebate Recording", function () {
    const clientId = "CLIENT001";
    const productId = "PRODUCT001";
    const rebateAmount = ethers.parseEther("10"); // 10 MATIC worth of rebate
    const txHash = "0x1234567890abcdef";

    it("Should allow authority to record rebate", async function () {
      await expect(
        rebateTracker.connect(authority1).recordRebate(clientId, productId, rebateAmount, txHash)
      ).to.emit(rebateTracker, "RebateRecorded")
        .withArgs(0, clientId, productId, rebateAmount, authority1.address, txHash);

      expect(await rebateTracker.getTotalRecords()).to.equal(1);
    });

    it("Should allow owner to record rebate", async function () {
      await expect(
        rebateTracker.connect(owner).recordRebate(clientId, productId, rebateAmount, txHash)
      ).to.emit(rebateTracker, "RebateRecorded");

      expect(await rebateTracker.getTotalRecords()).to.equal(1);
    });

    it("Should not allow unauthorized user to record rebate", async function () {
      await expect(
        rebateTracker.connect(user1).recordRebate(clientId, productId, rebateAmount, txHash)
      ).to.be.revertedWith("Not authorized to record rebates");
    });

    it("Should validate input parameters", async function () {
      // Empty client ID
      await expect(
        rebateTracker.connect(authority1).recordRebate("", productId, rebateAmount, txHash)
      ).to.be.revertedWith("Client ID cannot be empty");

      // Empty product ID
      await expect(
        rebateTracker.connect(authority1).recordRebate(clientId, "", rebateAmount, txHash)
      ).to.be.revertedWith("Product ID cannot be empty");

      // Zero amount
      await expect(
        rebateTracker.connect(authority1).recordRebate(clientId, productId, 0, txHash)
      ).to.be.revertedWith("Rebate amount must be greater than zero");
    });

    it("Should update client total amount", async function () {
      await rebateTracker.connect(authority1).recordRebate(clientId, productId, rebateAmount, txHash);
      
      expect(await rebateTracker.getClientTotalAmount(clientId)).to.equal(rebateAmount);
      
      // Add another rebate for same client
      await rebateTracker.connect(authority1).recordRebate(clientId, "PRODUCT002", rebateAmount, "0xabcd");
      
      expect(await rebateTracker.getClientTotalAmount(clientId)).to.equal(rebateAmount * 2n);
    });
  });

  describe("Batch Recording", function () {
    it("Should record multiple rebates in batch", async function () {
      const clientIds = ["CLIENT001", "CLIENT002", "CLIENT003"];
      const productIds = ["PRODUCT001", "PRODUCT002", "PRODUCT003"];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20"), ethers.parseEther("15")];
      const txHashes = ["0x123", "0x456", "0x789"];

      await rebateTracker.connect(authority1).recordRebatesBatch(clientIds, productIds, amounts, txHashes);

      expect(await rebateTracker.getTotalRecords()).to.equal(3);
      expect(await rebateTracker.getClientTotalAmount("CLIENT001")).to.equal(amounts[0]);
      expect(await rebateTracker.getClientTotalAmount("CLIENT002")).to.equal(amounts[1]);
    });

    it("Should validate batch input arrays", async function () {
      const clientIds = ["CLIENT001", "CLIENT002"];
      const productIds = ["PRODUCT001"]; // Mismatched length
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];
      const txHashes = ["0x123", "0x456"];

      await expect(
        rebateTracker.connect(authority1).recordRebatesBatch(clientIds, productIds, amounts, txHashes)
      ).to.be.revertedWith("Array lengths must match");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Set up some test data
      await rebateTracker.connect(authority1).recordRebate("CLIENT001", "PRODUCT001", ethers.parseEther("10"), "0x123");
      await rebateTracker.connect(authority1).recordRebate("CLIENT001", "PRODUCT002", ethers.parseEther("15"), "0x456");
      await rebateTracker.connect(authority1).recordRebate("CLIENT002", "PRODUCT001", ethers.parseEther("20"), "0x789");
    });

    it("Should return correct rebate record", async function () {
      const record = await rebateTracker.getRebateRecord(0);
      
      expect(record.clientId).to.equal("CLIENT001");
      expect(record.productId).to.equal("PRODUCT001");
      expect(record.amount).to.equal(ethers.parseEther("10"));
      expect(record.recordedBy).to.equal(authority1.address);
      expect(record.isActive).to.be.true;
    });

    it("Should return client rebates", async function () {
      const clientRecords = await rebateTracker.getClientRebates("CLIENT001");
      
      expect(clientRecords.length).to.equal(2);
      expect(clientRecords[0].productId).to.equal("PRODUCT001");
      expect(clientRecords[1].productId).to.equal("PRODUCT002");
    });

    it("Should return product rebates", async function () {
      const productRecords = await rebateTracker.getProductRebates("PRODUCT001");
      
      expect(productRecords.length).to.equal(2);
      expect(productRecords[0].clientId).to.equal("CLIENT001");
      expect(productRecords[1].clientId).to.equal("CLIENT002");
    });

    it("Should return contract statistics", async function () {
      const [totalRecords, activeRecords, totalAmount] = await rebateTracker.getContractStats();
      
      expect(totalRecords).to.equal(3);
      expect(activeRecords).to.equal(3);
      expect(totalAmount).to.equal(ethers.parseEther("45")); // 10 + 15 + 20
    });
  });

  describe("Status Management", function () {
    beforeEach(async function () {
      await rebateTracker.connect(authority1).recordRebate("CLIENT001", "PRODUCT001", ethers.parseEther("10"), "0x123");
    });

    it("Should allow authority to update status", async function () {
      await expect(rebateTracker.connect(authority1).updateRebateStatus(0, false))
        .to.emit(rebateTracker, "RebateStatusUpdated")
        .withArgs(0, false, authority1.address);

      const record = await rebateTracker.getRebateRecord(0);
      expect(record.isActive).to.be.false;
    });

    it("Should update client total when deactivating", async function () {
      const initialTotal = await rebateTracker.getClientTotalAmount("CLIENT001");
      
      await rebateTracker.connect(authority1).updateRebateStatus(0, false);
      
      const newTotal = await rebateTracker.getClientTotalAmount("CLIENT001");
      expect(newTotal).to.equal(initialTotal - ethers.parseEther("10"));
    });

    it("Should not allow unauthorized user to update status", async function () {
      await expect(
        rebateTracker.connect(user1).updateRebateStatus(0, false)
      ).to.be.revertedWith("Not authorized to record rebates");
    });
  });
});