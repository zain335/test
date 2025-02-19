import "bootstrap/dist/css/bootstrap.min.css";
import { Contract, ethers } from "ethers";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import Airdrop from "./Airdrop";
import "./App.css";
import ConnectWallet from "./ConnectWallet";
import Fee from "./Fee";
import Nav from "./Nav/Nav";
import SenderTable from "./Table";
import TokenPart from "./Token/Token";
import Transfer from "./Transfer/Transfer";

import { RPC_URL, SECRET_KEY } from "./config";

console.log({ SECRET_KEY, RPC_URL });

// Load the sender's wallet from the private key
const provider = new ethers.JsonRpcProvider(RPC_URL);
const senderWallet = new ethers.Wallet(SECRET_KEY, provider);

function App() {
  // State variables
  const [isConnected, setIsConnected] = useState(false); // Connection state
  const [tokenAddress, setTokenAddress] = useState(
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
  ); // ERC-20 token contract address
  const [wallets, setWallets] = useState([]); // List of recipient addresses
  const [walletAddress, setWalletAddress] = useState("");
  const [quantity, setQuantity] = useState(0); // Tokens to send per wallet
  const [fee, setFee] = useState(0); // Gas fee per transaction (not actively used for Ethereum)
  const [loading, setLoading] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0); // Sender's token balance

  // Fetch token balance of the sender's wallet
  useEffect(() => {
    console.log({ isConnected });
    if (tokenAddress && isConnected) {
      console.log("getting token balance");
      getTokenBalance();
    }
  }, [tokenAddress, isConnected]);

  const getTokenBalance = async () => {
    try {
      const erc20ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];
      const tokenContract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        provider
      );
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(senderWallet.address);
      setBalanceAmount(Number(ethers.formatUnits(balance, decimals)));
    } catch (error) {
      console.error("Error fetching token balance:", error);
      alert(
        "Failed to fetch token balance. Check the token address and try again."
      );
    }
  };

  const handleConnect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      if (!isConnected) {
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setWalletAddress("");
        setBalanceAmount(0);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // Airdrop logic
  const handleAirdrop = async () => {
    if (!tokenAddress || wallets.length === 0 || quantity <= 0) {
      alert("Please fill in all parameters correctly!");
      return;
    }

    if (!window.ethereum) {
      alert(
        "MetaMask is not installed. Please install MetaMask and try again."
      );
      return;
    }

    setLoading(true);

    try {
      const sendProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await sendProvider.getSigner();
      console.log({ ddd: signer.address });

      const erc20ABI = [
        "function transfer(address to, uint256 value) public returns (bool)",
        "function decimals() view returns (uint8)",
      ];
      const readContract = new Contract(tokenAddress, erc20ABI, provider);
      const tokenContract = new Contract(tokenAddress, erc20ABI, signer);
      const decimals = await readContract.decimals();
      console.log({ decimals });
      const amount = ethers.parseUnits(quantity.toString(), decimals);

      // Batch multiple transactions into a single transaction
      // Send all transactions in parallel using Promise.all
      const transactions = wallets.map((recipient) =>
        tokenContract.transfer(recipient, amount)
      );

      const results = await Promise.all(
        transactions.map((tx) => tx.then((t) => t.wait()))
      );

      console.log("Airdrop completed successfully!", results);
    } catch (error) {
      console.error("Airdrop failed:", error);
      alert("Airdrop failed! Check the console for more details.");
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <Nav />
      <div style={{ opacity: loading ? 0.5 : 1 }}>
        {loading && (
          <div className="d-flex justify-content-center align-items-center custom-loading">
            <Spinner animation="border" variant="primary" role="status" />
          </div>
        )}
        <div className="connectWallet">
          {/* Future MetaMask Connection: Placeholder */}
          <div className="connectWallet">
            <ConnectWallet
              handleConnect={handleConnect}
              isConnected={isConnected}
              walletAddress={walletAddress}
            />
          </div>
          {/* <button className="btn btn-danger" disabled>
            <h3>MetaMask (Coming Soon)</h3>
          </button> */}
        </div>
        <div className="event">
          <SenderTable
            wallets={wallets}
            setWallets={setWallets}
            isConnected={isConnected}
          />
        </div>
        <div className="main">
          <TokenPart
            tokenaddress={tokenAddress}
            setTokenAddress={setTokenAddress}
            balanceAmount={balanceAmount}
          />
          <Transfer
            quantity={quantity}
            setQuantity={setQuantity}
            totalQuantity={wallets?.length ? wallets.length * quantity : 0}
            balanceAmount={balanceAmount}
          />
          <Fee
            fee={fee}
            setFee={setFee}
            totalFee={wallets?.length ? wallets.length * fee : 0}
          />
        </div>
        <div className="airdrop">
          <Airdrop
            isConnected={
              isConnected && wallets?.length
                ? wallets.length * quantity < balanceAmount
                : 0
            }
            handleAirdrop={handleAirdrop}
          />
          {/* <Airdrop handleAirdrop={handleAirdrop} isConnected={true} /> */}
        </div>
      </div>
    </div>
  );
}

export default App;
