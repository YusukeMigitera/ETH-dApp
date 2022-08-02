import React, { useEffect, useState } from "react";
import "./App.css";
/* ethers 変数を使えるようにする*/
import { ethers } from "ethers";
/* ABIファイルを含むWavePortal.jsonファイルをインポートする*/
import abi from "./utils/WavePortal.json";

const App = () => {
  // ユーザのパブリックウォレットを保存するための状態変数を定義
  const [currentAccount, setCurrentAccount] = useState("");
  // ユーザのメッセージを保存するための状態変数を定義
  const [messageValue, setMessageValue] = useState("");
  // すべてのwavesを保存する状態変数
  const [allWaves, setAllWaves] = useState([]);
  console.log("currentAccount: ", currentAccount);
  //
  const [balance, setBalance] = useState("");
  // デプロイされたコントラクトのアドレスを保持する変数を作成
  const contractAddress = "0x61954A7192b2C608F7ea3e610a0bB480689fe49c";
  // ABIの内容を参照する変数を作成
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        // コントラクトからgetAllWavesメソッドを呼び出す
        const waves = await wavePortalContract.getAllWaves();
        // UIに必要なのはaddress, timestamp, messageだけ
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        // Stateにデータ格納
        setAllWaves(wavesCleaned);

        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        setBalance(ethers.utils.formatEther(contractBalance));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // `emit`されたイベントに反応する
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message, win) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          win: win,
        },
      ]);
    };

    // NewWaveイベントがコントラクトから発信されたとき情報を受け取る
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }
    // メモリリークを防ぐためNewWaveのイベントを解除
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  /* window.ethereumにアクセスできることを確認する */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /* ユーザのウォレットへのアクセスが許可されているか確認する */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };
  // connectWalletメソッド
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }
      // ウォレットへのアクセス許可を求める
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  // waveの回数をカウントする関数を実装
  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // コントラクト資金
        let contractBalance = balance;
        console.log("Contract balance:", balance);
        // コントラクトに👋（wave）を書き込む。TKG
        const waveTxn = await wavePortalContract.wave(
          messageValue ? messageValue : "TKG",
          {
            gasLimit: 300000,
          }
        );
        console.log("Mining...", await waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", await waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // コントラクトの残高が減っていることを確認
        let contractBalance_post = await provider.getBalance(
          wavePortalContract.address
        );
        if (contractBalance_post < contractBalance) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        setBalance(ethers.utils.formatEther(contractBalance));
        console.log("Contract balance after wave:", balance);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  //Webページがロードされたとき下記の関数を実行する
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
          WELCOME!
        </div>

        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、
          <span role="img" aria-label="hand-wave">
            👋
          </span>
          を送ってください
          <span role="img" aria-label="shine">
            ✨
          </span>
        </div>
        <br />
        <p>Contract Balance: {balance} ETH</p>
        <br />
        {/* ウォレットコネクトのボタンを実装 */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <div className="connectedDiv">
            Wallet Connected
          </div>
        )}
        {/* メッセージボックス */}
        {currentAccount && (
          <textarea
            name="messageArea"
            className="waveText"
            placeholder="メッセージはこちら"
            type="text"
            id="message"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
        )}
        {/* waveボタンwave関数 */}
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {/* 履歴を表示 */}
        {currentAccount &&
          allWaves
            .slice(0)
            .reverse()
            .map((wave, index) => {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#F8F8F8",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                  <div>Prize: {wave.win ? "won" : "didn't win"}</div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
export default App;
