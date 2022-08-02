// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;
import "hardhat/console.sol";

contract WavePortal {
    uint256 totalWaves;

    // 乱数生成の基盤シード
    uint256 private seed;
    // NewWaveイベントの作成
    event NewWave(
        address indexed from,
        string message,
        bool win,
        uint256 timestamp
    );
    // Wave構造体の作成
    struct Wave {
        address waver; // (wave)を送ったユーザのアドレス
        string message; // ユーザが送ったメッセージ
        bool win;
        uint256 timestamp; // (wave)を送った瞬間のタイムスタンプ
    }

    Wave[] waves; // Wave構造体の配列waves
    address[] senders;

    // アドレスと数値を関連付ける
    mapping(address => uint256) public lastWaveAt;
    mapping(address => uint256) public prize;
    mapping(string => uint256) public food;

    constructor() payable {
        console.log("We have been costructed!");
        // 初期シード
        seed = (block.timestamp + block.difficulty) % 100;
    }

    function wave(string memory _message) public {
        // 前回の送信から4週間以上経過していることを確認
        require(
            lastWaveAt[msg.sender] + 4 weeks < block.timestamp,
            "Wait 4 weeks"
        );

        // タイムスタンプを更新
        lastWaveAt[msg.sender] = block.timestamp;
        food[_message] += 1;

        totalWaves += 1;
        console.log("%s waved w/ message %s", msg.sender, _message);

        // 乱数生成
        seed = (block.difficulty + block.timestamp + seed) % 100;
        console.log("Random # generated: %d", seed);

        bool winFlag = true;
        // ETHを獲得する確率50%
        if (seed <= 50) {
            console.log("%s won!", msg.sender);
            // 👋（wave）を送った全ユーザに0.0001ETHを送る
            uint256 prizeAmount = 0.0001 ether;
            require(
                prizeAmount * senders.length <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );
            for (uint256 i = 0; i < senders.length; i++) {
                prize[senders[i]] += 1;
                (bool success, ) = (senders[i]).call{value: prizeAmount}(""); // 送金を行う
                require(success, "Failed to withdraw money from contract.");
            }
        } else {
            winFlag = false;
            console.log("%s did not win.", msg.sender);
        }
        // 👋（wave）とメッセージを配列に格納
        waves.push(Wave(msg.sender, _message, winFlag, block.timestamp));
        senders.push(msg.sender);

        // コントラクトでemitされたイベントの通知をフロントで取得できるようにする
        emit NewWave(msg.sender, _message, winFlag, block.timestamp);
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() public view returns (uint256) {
        console.log("We have %d total waves!", totalWaves);
        return totalWaves;
    }
}
