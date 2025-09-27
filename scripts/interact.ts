import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [user] = await ethers.getSigners();
  
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }
  
  console.log("🔗 Connecting to CashRebateTracker at:", contractAddress);
  
  // Connect to the deployed contract
  const CashRebateTracker = await ethers.getContractFactory("CashRebateTracker");
  const rebateTracker = CashRebateTracker.attach(contractAddress);
  
  console.log("👤 Using account:", user.address);
  
  // Check if user is authorized
  const isAuthorized = await rebateTracker.isAuthorized(user.address);
  console.log("🔐 Account authorized:", isAuthorized);
  
  if (!isAuthorized) {
    console.log("⚠️  Account not authorized to record rebates");
    console.log("Ask the contract owner to call addAuthority() with your address");
    return;
  }
  
  // Example: Record multiple rebates
  const rebateExamples = [
    {
      clientId: "CLIENT_001",
      productId: "LAPTOP_PRO_2024",
      amount: ethers.parseEther("0.1"), // 0.1 MATIC rebate
      txHash: "0x1a2b3c4d5e6f"
    },
    {
      clientId: "CLIENT_002", 
      productId: "SMARTPHONE_X",
      amount: ethers.parseEther("0.05"), // 0.05 MATIC rebate
      txHash: "0x7g8h9i0j1k2l"
    },
    {
      clientId: "CLIENT_003",
      productId: "TABLET_MINI",
      amount: ethers.parseEther("0.03"), // 0.03 MATIC rebate
      txHash: "0x3m4n5o6p7q8r"
    }
  ];
  
  console.log("\n📝 Recording rebates...");
  
  for (const rebate of rebateExamples) {
    try {
      console.log(`⏳ Recording rebate for ${rebate.clientId}...`);
      
      const tx = await rebateTracker.recordRebate(
        rebate.clientId,
        rebate.productId,
        rebate.amount,
        rebate.txHash
      );
      
      console.log(`✅ Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Rebate recorded for ${rebate.clientId}`);
      
    } catch (error) {
      console.error(`❌ Failed to record rebate for ${rebate.clientId}:`, error);
    }
  }
  
  // Query contract statistics
  console.log("\n📊 Contract Statistics:");
  const [totalRecords, activeRecords, totalAmount] = await rebateTracker.getContractStats();
  
  console.log("📈 Total Records:", totalRecords.toString());
  console.log("✅ Active Records:", activeRecords.toString());
  console.log("💰 Total Rebate Amount:", ethers.formatEther(totalAmount), "MATIC");
  
  // Query specific client rebates
  console.log("\n🔍 Client Rebate History:");
  
  for (const clientId of ["CLIENT_001", "CLIENT_002", "CLIENT_003"]) {
    try {
      const clientRecords = await rebateTracker.getClientRebates(clientId);
      const clientTotal = await rebateTracker.getClientTotalAmount(clientId);
      
      console.log(`\n👤 ${clientId}:`);
      console.log(`   Total Rebates: ${ethers.formatEther(clientTotal)} MATIC`);
      console.log(`   Number of Records: ${clientRecords.length}`);
      
      clientRecords.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`     Product: ${record.productId}`);
        console.log(`     Amount: ${ethers.formatEther(record.amount)} MATIC`);
        console.log(`     Active: ${record.isActive}`);
        console.log(`     Recorded: ${new Date(Number(record.timestamp) * 1000).toLocaleString()}`);
      });
      
    } catch (error) {
      console.log(`⚠️  No records found for ${clientId}`);
    }
  }
  
  // Example batch recording
  console.log("\n📦 Testing batch recording...");
  
  const batchClientIds = ["BATCH_001", "BATCH_002", "BATCH_003"];
  const batchProductIds = ["PRODUCT_A", "PRODUCT_B", "PRODUCT_C"];
  const batchAmounts = [
    ethers.parseEther("0.02"),
    ethers.parseEther("0.04"), 
    ethers.parseEther("0.01")
  ];
  const batchTxHashes = ["0xbatch1", "0xbatch2", "0xbatch3"];
  
  try {
    const batchTx = await rebateTracker.recordRebatesBatch(
      batchClientIds,
      batchProductIds,
      batchAmounts,
      batchTxHashes
    );
    
    console.log("✅ Batch transaction sent:", batchTx.hash);
    await batchTx.wait();
    console.log("✅ Batch rebates recorded successfully");
    
    // Show updated stats
    const [newTotalRecords] = await rebateTracker.getContractStats();
    console.log("📈 New Total Records:", newTotalRecords.toString());
    
  } catch (error) {
    console.error("❌ Batch recording failed:", error);
  }
  
  console.log("\n🎉 Interaction demo completed!");
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export default main;