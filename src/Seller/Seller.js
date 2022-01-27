import { Component } from "react";
import Button from "@material-ui/core/Button";
import "./folio.css";
//import axios from 'axios';

import ccfTokenAbi from "../abi/ccf-abi";
import PendingItems from "./PendingItems/PendingItems";

const Web3 = require("web3");
const tokenAddress = "0xdA203998849c654a4fA45abA656896f900A4F19D";

class SellerPanel extends Component {
  constructor() {
    super();
    this.state = {
      walletConnected: false,
      currentAccountAddress: "",
      priceOfProduct: 0,
      pendingLogs: [],
    };
  }

  onChange = (e) => {
    this.setState({ [e.target.id]: e.target.value });
  };

  setWalletState = (e) => {
    this.setState({ walletConnected: e });
  };
  ethEnabled = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      window.web3 = new Web3(window.ethereum);
      this.setWalletState(true);
      return true;
    }
    return false;
  };
  getAccount = async () => {
    var accounts, account;
    accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    return account;
  };

  setPendingLogs(e) {
    this.setState({ pendingLogs: e });
  }

  async getPendingLogs(userAddress) {
    const provider = new Web3(window.web3.currentProvider);
    var ccfContract = new provider.eth.Contract(ccfTokenAbi, tokenAddress);

    const res = await ccfContract.methods
      .getPendingLogOfBuyer(userAddress.toString())
      .call();
    console.log("res---------------", res);

    const logs = await Promise.all(
      res.map(async (pendId) => {
        const logres = await ccfContract.methods.pendinglogs(pendId).call();
        return logres;
      })
    );
    console.log("logs---------------", logs);

    this.setPendingLogs(logs);

    // await ccfContract.methods.getPendingLogOfBuyer(userAddress.toString()).call().then(res => {
    //   res.
    //     map(pendId => {
    //       ccfContract.methods.pendinglogs(pendId).call().then(res => {

    //         this.setPendingLogs(this.state.pendingLogs.push(res));
    //       })
    //   });

    //   return res;
    // }).catch(err => {
    //   console.log(err);
    // });
  }

  clickConnectWallet = () => {
    this.getAccount()
      .then((res) => {
        console.log(res);
        const _currentAccount = res;
        this.setWalletState(true);
        this.setState({ currentAccountAddress: _currentAccount.toString() });
        this.getPendingLogs(_currentAccount.toString());
      })
      .catch((err) => console.log(err));
  };

  async getPriceById(proId) {
    const provider = new Web3(window.web3.currentProvider);
    var ccfContract = new provider.eth.Contract(ccfTokenAbi, tokenAddress);

    this.togglePanel(true);
    await ccfContract.methods
      .getPriceOfProduct(proId)
      .call()
      .then((res) => {
        console.log("getPriceFinished", res.length);
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  addProduct = () => {
    const provider = new Web3(window.web3.currentProvider);
    const DraqleContract = new provider.eth.Contract(ccfTokenAbi, tokenAddress);
    console.log(this.state.currentAccountAddress);

    DraqleContract.methods
      .addProduct(this.state.priceOfProduct)
      .send({ from: this.state.currentAccountAddress.toString() })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.pendingLogs !== this.state.pendingLogs) {
      console.log("pendingLogs state has changed.", this.state.pendingLogs);
    }
  }

  componentDidMount() {}

  render() {
    return (
      <div className="container-fluid">
        {this.state.walletConnected === false ? (
          <div className="container">
            <div className="btn_wallet_container">
              <Button className="btn_wallet" onClick={this.clickConnectWallet}>
                Connect Wallet
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: "4rem",
            }}
            className="row"
          >
            <div>{this.state.currentAccountAddress}</div>
            {this.state.pendingLogs.map((info) => {
              if (
                info.refundedByBuyer ||
                info.claimedBySeller === true ||
                info.seller.toUpperCase() !==
                  this.state.currentAccountAddress.toString().toUpperCase()
              )
                return null;
              return (
                <PendingItems
                  key={info.productId}
                  cur_Account={this.state.currentAccountAddress}
                  pendingId={info.pendingId}
                  productId={info.productId}
                  depoAmount={info.depoAmount}
                  productOwner={info.seller}
                  confirmedBySeller={info.confirmedBySeller}
                  disputedByBuyer={info.disputedByBuyer}
                  refundedBySeller={info.refundedBySeller}
                />
              );
            })}
            <form className="form-buy" noValidate onSubmit={this.onSubmit}>
              <div className="input-field col s12">
                <label htmlFor="priceOfProduct">Product Price</label>
                <input
                  style={{
                    width: "400px",
                  }}
                  onChange={this.onChange}
                  value={this.state.priceOfProduct}
                  id="priceOfProduct"
                  type="number"
                />
              </div>
              <div className="input-field col s12">
                <Button className="btn_buy" onClick={this.addProduct}>
                  add product
                </Button>
              </div>
            </form>
          </div>
        )}
        <div className="loadingPanel"></div>
      </div>
    );
  }
}

export default SellerPanel;
