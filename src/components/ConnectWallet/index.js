import Button from "react-bootstrap/Button";
import { truncateAddress } from "../../utils";

const ConnectWallet = (props) => {
  const { handleConnect, isConnected, walletAddress } = props;

  return (
    <Button
      className={isConnected ? "btn btn-success" : "btn btn-danger"}
      onClick={handleConnect}
    >
      <h3>
        {isConnected ? `${truncateAddress(walletAddress)}` : "Connect Wallet"}
      </h3>
    </Button>
  );
};

export default ConnectWallet;
