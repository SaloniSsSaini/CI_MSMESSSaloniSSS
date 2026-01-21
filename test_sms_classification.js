// Quick test for enhanced Data Processor Agent
const dataProcessorAgent = require('./backend/src/services/agents/dataProcessorAgent');

// Sample SMS data from the user's Excel file
const sampleSMSData = [
    // Should be FILTERED (OTPs, promos, food, recharge)
    { text: "<#> 704982 is your Zomato verification code. Enjoy :-)", senderAddress: "JM-ZOMATO" },
    { text: "Extra Data, ONLY on Rs299! Recharge NOW with Rs299 & get EXTRA 500MB", senderAddress: "VP-611123" },
    { text: "Rs.95.15 on Zomato charged via Simpl. Food, groceries, commute", senderAddress: "JK-SmplPL" },
    { text: "Dear 62803681XX, KOL vs RAJ, T20 Match is live on My11circle. Prize Pool - 4,25,00,000", senderAddress: "JK-MYCRCL" },
    { text: "50% Daily Data quota used as on 02-May-22 20:15. Jio Number : 6280368198", senderAddress: "JP-JioPay" },

    // Should PASS - Bank transactions
    { text: "Your VPA sanju39chd@okaxis linked to Indian Bank a/c no. XXXXXX4658 is debited for Rs.299.00 and credited to euronetgpay.pay@icici (UPI Ref no 212355781017).-Indian Bank", senderAddress: "VM-IndBnk" },
    { text: "Received Rs.600.00 in your a/c 91XX3635 from One97 Communications Limited on 6-5-2022.Ref no: 5C05RA03uMM5. Queries? Call 01204456456 :PPBL", senderAddress: "AX-PAYTMB" },
    { text: "Your VPA 6280368198@paytm linked to Indian Bank a/c no. XXXXXX4658 is debited for Rs.3500.00 and credited to 7082282508@ybl (UPI Ref no 212287937861).-Indian Bank", senderAddress: "VK-IndBnk" },

    // Should PASS - Vehicle service (no URL in this one)
    { text: "Service of your Maruti Suzuki car is overdue. Please get service as per Schedule to keep enjoying benefits of Warranty. Call CM Autos 9915003004", senderAddress: "BZ-CMAUTO" },
];

async function test() {
    console.log("=".repeat(70));
    console.log("ENHANCED DATA PROCESSOR AGENT - SMS CLASSIFICATION TEST");
    console.log("=".repeat(70));

    const result = await dataProcessorAgent.processTransactions(sampleSMSData);

    console.log("\n📊 STATISTICS:");
    console.log("   Total Input:      " + result.statistics.totalInput);
    console.log("   Filtered Out:     " + result.statistics.filteredOut);
    console.log("   Total Processed:  " + result.statistics.totalProcessed);
    console.log("   Classified:       " + result.statistics.successfullyClassified);

    console.log("\n❌ FILTERED SMS (" + result.filtered.length + "):");
    result.filtered.forEach((f, i) => {
        console.log("   " + (i + 1) + ". [" + f.sender + "] " + f.original);
    });

    console.log("\n✅ CLASSIFIED TRANSACTIONS (" + result.classified.length + "):");
    result.classified.forEach((tx, i) => {
        console.log("   " + (i + 1) + ". [" + tx.category + "] Rs." + (tx.amount || 0) + " - " + (tx.vendor || 'unknown'));
        console.log("      Type: " + (tx.transactionType || 'n/a') + " | Method: " + (tx.classificationMethod || 'n/a'));
    });

    console.log("\n" + "=".repeat(70));
    console.log("TEST COMPLETE");
}

test().catch(console.error);
