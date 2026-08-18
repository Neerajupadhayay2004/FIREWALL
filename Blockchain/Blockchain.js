const express = require("express");
const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Smart contract configuration
const CONTRACT_ADDRESS = "0x2FB04845083596798A3993cd0079cf725360D0B9";
const RPC_URL = "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = "316aebafb298cd7ff29a947fd7b8b05ed9191820c79503acf95f948e4483b26a";

// Telegram Bot Configuration
// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8507448373:AAEhmx8p1lD-SEDr_u3D5v4hEaTt16oC5PA";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1003369669723";

// Blockchain audit log file
const AUDIT_LOG_FILE = "blockchain_audit.json";

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "value",
                "type": "string"
            }
        ],
        "name": "StringStored",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getString",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_value",
                "type": "string"
            }
        ],
        "name": "storeString",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "storedStrings",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize audit log
function initAuditLog() {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
        fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify({
            records: [],
            metadata: {
                created: new Date().toISOString(),
                version: "1.0"
            }
        }, null, 2));
    }
}

// Calculate hash for data integrity
function calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Add record to audit log
function addToAuditLog(record) {
    const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
    record.localHash = calculateHash(record);
    auditData.records.push(record);
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(auditData, null, 2));
    return record.localHash;
}

// Utility function to create random private key
function createRandomPrivateKey() {
    const wallet = ethers.Wallet.createRandom();
    return {
        privateKey: wallet.privateKey,
        publicAddress: wallet.address
    };
}

// Function to send Telegram message
async function sendTelegramMessage(data) {
    try {
        const message = `✅ *Blockchain Data Stored Successfully*\n\n` +
                       `📦 *Data:* ${data.data}\n` +
                       `🔗 *Transaction Hash:* ${data.transactionHash}\n` +
                       `📊 *Block Number:* ${data.blockNumber}\n` +
                       `⛽ *Gas Used:* ${data.gasUsed}\n` +
                       `🔐 *Hash:* ${data.hash || 'N/A'}\n` +
                       `📅 *Timestamp:* ${new Date().toISOString()}`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.get(telegramUrl, {
            params: {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        });

        return {
            success: true,
            telegramResponse: response.data
        };
    } catch (error) {
        console.error("Telegram Error:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main blockchain interaction function
async function invokeSmartContract(dataToStore) {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        const feeData = await provider.getFeeData();
        const adjustedGasPrice = feeData.gasPrice * BigInt(2);
        
        const tx = await contract.storeString(dataToStore, {
            gasPrice: adjustedGasPrice
        });
        
        const receipt = await tx.wait();
        
        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            from: receipt.from,
            to: receipt.to,
            status: receipt.status
        };
    } catch (error) {
        console.error("Error calling contract function:", error);
        throw error;
    }
}

// Function to verify data on blockchain
async function verifyBlockchainData(index) {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const storedString = await contract.getString(index);
        
        return {
            success: true,
            verified: true,
            index: index,
            data: storedString
        };
    } catch (error) {
        return {
            success: false,
            verified: false,
            error: error.message
        };
    }
}

// Function to update database JSON
function updateDatabaseJson(attacks, clientIp, reasonOfBlock, dbPath = "database.json") {
    try {
        if (!fs.existsSync(dbPath)) {
            console.log(`Database file ${dbPath} not found.`);
            return {
                success: false,
                error: `Database file ${dbPath} not found.`
            };
        }

        const rawData = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(rawData);

        const attackCategories = data.attack_categories;
        if (!attackCategories) {
            console.log("Key 'attack_categories' not found in database.");
            return {
                success: false,
                error: "Key 'attack_categories' not found in database."
            };
        }

        // Normalize attack type to lowercase
        const normalizedAttack = attacks.toLowerCase().replace(/_/g, '');
        let attackKey = null;
        
        // Find matching attack category (case-insensitive)
        for (const key in attackCategories) {
            if (key.toLowerCase().replace(/_/g, '') === normalizedAttack) {
                attackKey = key;
                break;
            }
        }

        if (!attackKey) {
            console.log(`Attack type '${attacks}' not found in database.`);
            return {
                success: false,
                error: `Attack type '${attacks}' not found in database. Available types: ${Object.keys(attackCategories).join(', ')}`
            };
        }

        const existingIds = Object.keys(attackCategories[attackKey]);
        const newId = String(Math.max(...existingIds.map(k => parseInt(k) || 0), 0) + 1);

        const currentTime = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2');

        attackCategories[attackKey][newId] = {
            "Attacker_Ip": clientIp,
            "Attack_On_Endpoint": reasonOfBlock,
            "Attack_Time": currentTime
        };

        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));

        console.log(`[+] Updated database.json | Attack: ${attackKey} | ID: ${newId}`);

        return {
            success: true,
            message: "Database updated successfully",
            attackType: attackKey,
            attackId: newId,
            attackerIp: clientIp,
            endpoint: reasonOfBlock,
            timestamp: currentTime
        };
    } catch (error) {
        console.error("Error updating database:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to add to "worked" section
function addToWorkedSection(blockedIp, reasonForBlock, dbPath = "database.json") {
    try {
        if (!fs.existsSync(dbPath)) {
            console.log(`Database file ${dbPath} not found.`);
            return {
                success: false,
                error: `Database file ${dbPath} not found.`
            };
        }

        const rawData = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(rawData);

        if (!data.worked) {
            data.worked = {};
        }

        const existingIds = Object.keys(data.worked);
        const newId = String(Math.max(...existingIds.map(k => parseInt(k) || 0), 0) + 1);

        const currentTime = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2');

        data.worked[newId] = {
            "Blocked_Ip": blockedIp,
            "Block_At_Time": currentTime,
            "Reason_For_Block": reasonForBlock
        };

        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));

        console.log(`[+] Updated worked section | ID: ${newId}`);

        return {
            success: true,
            message: "IP block recorded successfully",
            blockId: newId,
            blockedIp: blockedIp,
            reason: reasonForBlock,
            timestamp: currentTime
        };
    } catch (error) {
        console.error("Error updating worked section:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== API ENDPOINTS ====================

// 1. Save data to blockchain with Telegram notification
app.post("/SaveBlockChain", async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: "Data parameter is required"
            });
        }
        
        const dataHash = calculateHash(data);
        const result = await invokeSmartContract(data);
        
        const telegramResult = await sendTelegramMessage({
            data: data,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            hash: dataHash
        });
        
        addToAuditLog({
            type: "BLOCKCHAIN_STORAGE",
            data: data,
            dataHash: dataHash,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: "Data stored successfully on blockchain",
            transaction: result,
            dataHash: dataHash,
            telegram: telegramResult
        });
        
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
            details: error.reason || error.code || "Unknown error"
        });
    }
});

// 2. Update database and store on blockchain for transparency
app.post("/UpdateDatabaseWithBlockchain", async (req, res) => {
    try {
        const { attacks, clientIp, reasonOfBlock, dbPath } = req.body;
        
        if (!attacks || !clientIp || !reasonOfBlock) {
            return res.status(400).json({
                success: false,
                error: "Required parameters: attacks, clientIp, reasonOfBlock"
            });
        }
        
        // Update local database
        const dbResult = updateDatabaseJson(attacks, clientIp, reasonOfBlock, dbPath || "database.json");
        
        if (!dbResult.success) {
            return res.status(400).json(dbResult);
        }
        
        // Create blockchain record
        const blockchainData = JSON.stringify({
            type: "ATTACK_LOG",
            attackType: attacks,
            attackerId: dbResult.attackId,
            attackerIp: clientIp,
            endpoint: reasonOfBlock,
            timestamp: dbResult.timestamp
        });
        
        const dataHash = calculateHash(blockchainData);
        
        // Store on blockchain
        const bcResult = await invokeSmartContract(blockchainData);
        
        // Add to audit log
        const localHash = addToAuditLog({
            type: "ATTACK_LOG",
            attackType: attacks,
            attackId: dbResult.attackId,
            attackerIp: clientIp,
            endpoint: reasonOfBlock,
            dataHash: dataHash,
            transactionHash: bcResult.transactionHash,
            blockNumber: bcResult.blockNumber,
            timestamp: dbResult.timestamp
        });
        
        // Send Telegram notification
        await sendTelegramMessage({
            data: `Attack Logged: ${attacks}`,
            transactionHash: bcResult.transactionHash,
            blockNumber: bcResult.blockNumber,
            gasUsed: bcResult.gasUsed,
            hash: dataHash
        });
        
        res.json({
            success: true,
            message: "Attack logged in database and blockchain",
            database: dbResult,
            blockchain: {
                transactionHash: bcResult.transactionHash,
                blockNumber: bcResult.blockNumber,
                dataHash: dataHash,
                localHash: localHash
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Verify data integrity across blockchain and local records
app.post("/VerifyIntegrity", async (req, res) => {
    try {
        const { transactionHash, localHash } = req.body;
        
        if (!transactionHash && !localHash) {
            return res.status(400).json({
                success: false,
                error: "Either transactionHash or localHash is required"
            });
        }
        
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        
        let localRecord;
        if (transactionHash) {
            localRecord = auditData.records.find(r => r.transactionHash === transactionHash);
        } else {
            localRecord = auditData.records.find(r => r.localHash === localHash);
        }
        
        if (!localRecord) {
            return res.status(404).json({
                success: false,
                error: "Record not found in local audit log"
            });
        }
        
        // Recreate the exact structure that was used to create the dataHash
        let originalData;
        if (localRecord.type === "ATTACK_LOG") {
            originalData = JSON.stringify({
                type: "ATTACK_LOG",
                attackType: localRecord.attackType,
                attackerId: localRecord.attackId,
                attackerIp: localRecord.attackerIp,
                endpoint: localRecord.endpoint,
                timestamp: localRecord.timestamp
            });
        } else if (localRecord.type === "IP_BLOCK") {
            originalData = JSON.stringify({
                type: "IP_BLOCK",
                blockId: localRecord.blockId,
                blockedIp: localRecord.blockedIp,
                reason: localRecord.reason,
                timestamp: localRecord.timestamp
            });
        } else if (localRecord.type === "BLOCKCHAIN_STORAGE") {
            originalData = localRecord.data;
        } else {
            originalData = localRecord;
        }
        
        // Recalculate the hash from the blockchain data
        const recalculatedHash = calculateHash(originalData);
        
        // Check if it matches the stored dataHash
        const hashMatch = recalculatedHash === localRecord.dataHash;
        
        // Get blockchain data
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        let blockchainVerified = false;
        let blockchainData = null;
        
        try {
            const tx = await provider.getTransaction(localRecord.transactionHash);
            if (tx) {
                blockchainVerified = true;
                blockchainData = {
                    blockNumber: tx.blockNumber,
                    from: tx.from,
                    to: tx.to,
                    hash: tx.hash
                };
            }
        } catch (error) {
            console.error("Blockchain verification error:", error);
        }
        
        res.json({
            success: true,
            integrity: {
                localHashMatch: hashMatch,
                blockchainVerified: blockchainVerified,
                overallIntegrity: hashMatch && blockchainVerified
            },
            verification: {
                storedHash: localRecord.dataHash,
                recalculatedHash: recalculatedHash,
                hashesMatch: hashMatch
            },
            localRecord: localRecord,
            blockchainData: blockchainData,
            message: hashMatch && blockchainVerified 
                ? "✅ Data integrity verified successfully" 
                : "⚠️ Data integrity verification failed"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Get complete audit trail
app.get("/GetAuditTrail", (req, res) => {
    try {
        const { type, limit, attackType } = req.query;
        
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        let records = auditData.records;
        
        // Filter by type
        if (type) {
            records = records.filter(r => r.type === type);
        }
        
        // Filter by attack type
        if (attackType) {
            records = records.filter(r => r.attackType === attackType);
        }
        
        // Limit results
        if (limit) {
            records = records.slice(-parseInt(limit));
        }
        
        res.json({
            success: true,
            totalRecords: records.length,
            records: records,
            metadata: auditData.metadata
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Get blockchain statistics
app.get("/GetBlockchainStats", async (req, res) => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        
        const count = await contract.getCount();
        const balance = await provider.getBalance(signer.address);
        const feeData = await provider.getFeeData();
        const blockNumber = await provider.getBlockNumber();
        
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        
        res.json({
            success: true,
            blockchain: {
                totalStoredRecords: count.toString(),
                currentBlockNumber: blockNumber,
                contractAddress: CONTRACT_ADDRESS,
                walletAddress: signer.address,
                walletBalance: ethers.formatEther(balance) + " MATIC",
                currentGasPrice: ethers.formatUnits(feeData.gasPrice, "gwei") + " Gwei"
            },
            local: {
                totalAuditRecords: auditData.records.length,
                attackLogs: auditData.records.filter(r => r.type === "ATTACK_LOG").length,
                blockchainStorages: auditData.records.filter(r => r.type === "BLOCKCHAIN_STORAGE").length
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. Batch verify multiple records
app.post("/BatchVerifyIntegrity", async (req, res) => {
    try {
        const { transactionHashes } = req.body;
        
        if (!transactionHashes || !Array.isArray(transactionHashes)) {
            return res.status(400).json({
                success: false,
                error: "transactionHashes array is required"
            });
        }
        
        const results = [];
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        
        for (const txHash of transactionHashes) {
            const localRecord = auditData.records.find(r => r.transactionHash === txHash);
            
            if (!localRecord) {
                results.push({
                    transactionHash: txHash,
                    verified: false,
                    error: "Record not found"
                });
                continue;
            }
            
            const recalculatedHash = calculateHash({
                type: localRecord.type,
                attackType: localRecord.attackType,
                attackId: localRecord.attackId,
                attackerIp: localRecord.attackerIp,
                endpoint: localRecord.endpoint,
                timestamp: localRecord.timestamp
            });
            
            results.push({
                transactionHash: txHash,
                verified: recalculatedHash === localRecord.dataHash,
                localRecord: localRecord
            });
        }
        
        const allVerified = results.every(r => r.verified);
        
        res.json({
            success: true,
            totalChecked: results.length,
            allVerified: allVerified,
            results: results
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. Get attack statistics
app.get("/GetAttackStats", (req, res) => {
    try {
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        const attackLogs = auditData.records.filter(r => r.type === "ATTACK_LOG");
        
        const stats = {};
        const ipStats = {};
        const endpointStats = {};
        
        attackLogs.forEach(log => {
            // Count by attack type
            stats[log.attackType] = (stats[log.attackType] || 0) + 1;
            
            // Count by IP
            ipStats[log.attackerIp] = (ipStats[log.attackerIp] || 0) + 1;
            
            // Count by endpoint
            endpointStats[log.endpoint] = (endpointStats[log.endpoint] || 0) + 1;
        });
        
        // Get top attackers
        const topAttackers = Object.entries(ipStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));
        
        // Get most targeted endpoints
        const topEndpoints = Object.entries(endpointStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([endpoint, count]) => ({ endpoint, count }));
        
        res.json({
            success: true,
            totalAttacks: attackLogs.length,
            attacksByType: stats,
            topAttackers: topAttackers,
            topTargetedEndpoints: topEndpoints,
            uniqueAttackers: Object.keys(ipStats).length,
            uniqueEndpoints: Object.keys(endpointStats).length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 8. Search audit logs
app.post("/SearchAuditLogs", (req, res) => {
    try {
        const { attackerIp, attackType, startDate, endDate, endpoint } = req.body;
        
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        let records = auditData.records;
        
        if (attackerIp) {
            records = records.filter(r => r.attackerIp === attackerIp);
        }
        
        if (attackType) {
            records = records.filter(r => r.attackType === attackType);
        }
        
        if (endpoint) {
            records = records.filter(r => r.endpoint && r.endpoint.includes(endpoint));
        }
        
        if (startDate) {
            records = records.filter(r => new Date(r.timestamp) >= new Date(startDate));
        }
        
        if (endDate) {
            records = records.filter(r => new Date(r.timestamp) <= new Date(endDate));
        }
        
        res.json({
            success: true,
            totalResults: records.length,
            results: records
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 9. Export audit logs
app.get("/ExportAuditLogs", (req, res) => {
    try {
        const { format } = req.query;
        
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        
        if (format === 'csv') {
            let csv = 'Type,Attack Type,Attack ID,Attacker IP,Endpoint,Transaction Hash,Block Number,Timestamp\n';
            
            auditData.records.forEach(record => {
                csv += `${record.type || ''},${record.attackType || ''},${record.attackId || ''},${record.attackerIp || ''},${record.endpoint || ''},${record.transactionHash || ''},${record.blockNumber || ''},${record.timestamp || ''}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
            res.json(auditData);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. Verify blockchain data
app.post("/VerifyBlockchainData", async (req, res) => {
    try {
        const { index, expectedData } = req.body;
        
        if (index === undefined) {
            return res.status(400).json({
                success: false,
                error: "Index parameter is required"
            });
        }
        
        const result = await verifyBlockchainData(index);
        
        if (result.success) {
            if (expectedData !== undefined) {
                const matches = result.data === expectedData;
                res.json({
                    success: true,
                    verified: result.verified,
                    matches: matches,
                    index: index,
                    storedData: result.data,
                    expectedData: expectedData,
                    message: matches ? "Data verification successful - data matches!" : "Data found but does not match expected value"
                });
            } else {
                res.json({
                    success: true,
                    verified: result.verified,
                    index: index,
                    storedData: result.data,
                    message: "Data retrieved successfully from blockchain"
                });
            }
        } else {
            res.status(404).json({
                success: false,
                verified: false,
                error: result.error,
                message: "Failed to verify data on blockchain"
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11. Update database (legacy endpoint)
app.post("/UpdateDatabase", async (req, res) => {
    try {
        const { attacks, clientIp, reasonOfBlock, dbPath } = req.body;
        
        if (!attacks || !clientIp || !reasonOfBlock) {
            return res.status(400).json({
                success: false,
                error: "Required parameters: attacks, clientIp, reasonOfBlock"
            });
        }
        
        const result = updateDatabaseJson(attacks, clientIp, reasonOfBlock, dbPath || "database.json");
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11a. Add IP block to "worked" section
app.post("/BlockIP", async (req, res) => {
    try {
        const { blockedIp, reasonForBlock, dbPath } = req.body;
        
        if (!blockedIp || !reasonForBlock) {
            return res.status(400).json({
                success: false,
                error: "Required parameters: blockedIp, reasonForBlock"
            });
        }
        
        const result = addToWorkedSection(blockedIp, reasonForBlock, dbPath || "database.json");
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11b. Block IP and store on blockchain
app.post("/BlockIPWithBlockchain", async (req, res) => {
    try {
        const { blockedIp, reasonForBlock, dbPath } = req.body;
        
        if (!blockedIp || !reasonForBlock) {
            return res.status(400).json({
                success: false,
                error: "Required parameters: blockedIp, reasonForBlock"
            });
        }
        
        // Add to worked section
        const dbResult = addToWorkedSection(blockedIp, reasonForBlock, dbPath || "database.json");
        
        if (!dbResult.success) {
            return res.status(400).json(dbResult);
        }
        
        // Create blockchain record
        const blockchainData = JSON.stringify({
            type: "IP_BLOCK",
            blockId: dbResult.blockId,
            blockedIp: blockedIp,
            reason: reasonForBlock,
            timestamp: dbResult.timestamp
        });
        
        const dataHash = calculateHash(blockchainData);
        
        // Store on blockchain
        const bcResult = await invokeSmartContract(blockchainData);
        
        // Add to audit log
        const localHash = addToAuditLog({
            type: "IP_BLOCK",
            blockId: dbResult.blockId,
            blockedIp: blockedIp,
            reason: reasonForBlock,
            dataHash: dataHash,
            transactionHash: bcResult.transactionHash,
            blockNumber: bcResult.blockNumber,
            timestamp: dbResult.timestamp
        });
        
        // Send Telegram notification
        await sendTelegramMessage({
            data: `IP Blocked: ${blockedIp}`,
            transactionHash: bcResult.transactionHash,
            blockNumber: bcResult.blockNumber,
            gasUsed: bcResult.gasUsed,
            hash: dataHash
        });
        
        res.json({
            success: true,
            message: "IP block recorded in database and blockchain",
            database: dbResult,
            blockchain: {
                transactionHash: bcResult.transactionHash,
                blockNumber: bcResult.blockNumber,
                dataHash: dataHash,
                localHash: localHash
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 12. Generate wallet
app.get("/generateWallet", (req, res) => {
    try {
        const wallet = createRandomPrivateKey();
        res.json({
            success: true,
            wallet: wallet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 13. Get count
app.get("/getCount", async (req, res) => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const count = await contract.getCount();
        
        res.json({
            success: true,
            count: count.toString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 14. Get string by index
app.get("/getString/:index", async (req, res) => {
    try {
        const { index } = req.params;
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const storedString = await contract.getString(index);
        
        res.json({
            success: true,
            index: index,
            data: storedString
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 15. Health check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Blockchain API is running",
        timestamp: new Date().toISOString()
    });
});

// 16. Get blockchain data by transaction hash
app.post("/GetBlockchainDataByTx", async (req, res) => {
    try {
        const { transactionHash } = req.body;
        
        if (!transactionHash) {
            return res.status(400).json({
                success: false,
                error: "transactionHash is required"
            });
        }
        
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // Get transaction details
        const tx = await provider.getTransaction(transactionHash);
        
        if (!tx) {
            return res.status(404).json({
                success: false,
                error: "Transaction not found"
            });
        }
        
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(transactionHash);
        
        // Try to decode the input data to see what was stored
        let decodedData = null;
        try {
            const iface = new ethers.Interface(CONTRACT_ABI);
            const parsedTx = iface.parseTransaction({ data: tx.data });
            decodedData = parsedTx.args[0]; // The string that was stored
        } catch (e) {
            console.error("Could not decode transaction data:", e.message);
        }
        
        res.json({
            success: true,
            transaction: {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                blockNumber: tx.blockNumber,
                gasPrice: tx.gasPrice?.toString(),
                gasLimit: tx.gasLimit?.toString(),
                data: tx.data
            },
            receipt: {
                status: receipt.status,
                gasUsed: receipt.gasUsed?.toString(),
                logs: receipt.logs
            },
            decodedData: decodedData,
            dataHash: decodedData ? calculateHash(decodedData) : null
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 17. Debug endpoint - Check specific record integrity
app.post("/DebugIntegrity", async (req, res) => {
    try {
        const { transactionHash } = req.body;
        
        if (!transactionHash) {
            return res.status(400).json({
                success: false,
                error: "transactionHash is required"
            });
        }
        
        // Get local record
        const auditData = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf8'));
        const localRecord = auditData.records.find(r => r.transactionHash === transactionHash);
        
        if (!localRecord) {
            return res.status(404).json({
                success: false,
                error: "Record not found in local audit log"
            });
        }
        
        // Get blockchain data
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const tx = await provider.getTransaction(transactionHash);
        
        // Decode blockchain data
        let blockchainStoredData = null;
        try {
            const iface = new ethers.Interface(CONTRACT_ABI);
            const parsedTx = iface.parseTransaction({ data: tx.data });
            blockchainStoredData = parsedTx.args[0];
        } catch (e) {
            console.error("Could not decode:", e.message);
        }
        
        // Recreate what should have been stored
        let expectedBlockchainData;
        if (localRecord.type === "ATTACK_LOG") {
            expectedBlockchainData = JSON.stringify({
                type: "ATTACK_LOG",
                attackType: localRecord.attackType,
                attackerId: localRecord.attackId,
                attackerIp: localRecord.attackerIp,
                endpoint: localRecord.endpoint,
                timestamp: localRecord.timestamp
            });
        } else if (localRecord.type === "IP_BLOCK") {
            expectedBlockchainData = JSON.stringify({
                type: "IP_BLOCK",
                blockId: localRecord.blockId,
                blockedIp: localRecord.blockedIp,
                reason: localRecord.reason,
                timestamp: localRecord.timestamp
            });
        } else {
            expectedBlockchainData = localRecord.data || "N/A";
        }
        
        const expectedHash = calculateHash(expectedBlockchainData);
        const actualBlockchainHash = blockchainStoredData ? calculateHash(blockchainStoredData) : null;
        
        res.json({
            success: true,
            debug: {
                localRecord: localRecord,
                expectedBlockchainData: expectedBlockchainData,
                actualBlockchainData: blockchainStoredData,
                storedDataHash: localRecord.dataHash,
                expectedHash: expectedHash,
                actualBlockchainHash: actualBlockchainHash,
                matches: {
                    localToExpected: localRecord.dataHash === expectedHash,
                    blockchainToExpected: actualBlockchainHash === expectedHash,
                    blockchainToLocal: actualBlockchainHash === localRecord.dataHash
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Initialize audit log on startup
initAuditLog();

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║        🔐 BLOCKCHAIN SECURITY API SERVER                  ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                           ║
║  📝 Contract: ${CONTRACT_ADDRESS.slice(0, 10)}...              ║
║  💼 Wallet: 0x0E3710b3167eeE9D5E7E5430d99542A4e31636A7    ║
╠═══════════════════════════════════════════════════════════╣
║  📍 CORE ENDPOINTS:                                       ║
║  • POST   /SaveBlockChain                                 ║
║  • POST   /UpdateDatabaseWithBlockchain                   ║
║  • POST   /BlockIPWithBlockchain                          ║
║  • POST   /UpdateDatabase                                 ║
║  • POST   /BlockIP                                        ║
║  • POST   /VerifyIntegrity                                ║
║  • POST   /VerifyBlockchainData                           ║
║  • GET    /GetAuditTrail                                  ║
║  • GET    /GetBlockchainStats                             ║
║  • GET    /GetAttackStats                                 ║
║  • POST   /SearchAuditLogs                                ║
║  • POST   /BatchVerifyIntegrity                           ║
║  • GET    /ExportAuditLogs                                ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;