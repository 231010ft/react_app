import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import cardBackImage from './assets/card_back.png'; // カードの裏面画像をインポート

// Blackjackコンポーネントの定義
export const Blackjack = () => {
  // ゲームの状態を管理するためのuseStateフック
  const [deckId, setDeckId] = useState(null); // デッキIDを保存
  const [playerCards, setPlayerCards] = useState([]); // プレイヤーのカード
  const [dealerCards, setDealerCards] = useState([]); // ディーラーのカード
  const [remaining, setRemaining] = useState(52); // 残りのカード枚数
  const [loading, setLoading] = useState(false); // ローディング中かどうか
  const [error, setError] = useState(null); // エラーメッセージ
  const [playerBurst, setPlayerBurst] = useState(false); // プレイヤーがバーストしたか
  const [dealerBurst, setDealerBurst] = useState(false); // ディーラーがバーストしたか
  const [isPlayerTurn, setIsPlayerTurn] = useState(false); // プレイヤーのターンかどうか
  const [gameEnded, setGameEnded] = useState(false); // ゲームが終了したかどうか
  const [gameResult, setGameResult] = useState(null); // ゲームの結果
  const [isDealerFirstCardHidden, setIsDealerFirstCardHidden] = useState(true); // ディーラーの最初のカードを隠すかどうか
  const [playerChips, setPlayerChips] = useState(10); // プレイヤーの所持チップ
  const [betAmount, setBetAmount] = useState(0); // 賭け金
  const [canBet, setCanBet] = useState(false); // 賭けが可能かどうか
  const [showBettingBox, setShowBettingBox] = useState(false); // 賭けボックスを表示するかどうか
  const [isBlackjack, setIsBlackjack] = useState(false); // プレイヤーがブラックジャックかどうか

  // デッキを作成するためのuseEffectフック
  useEffect(() => {
    const createNewDeck = async () => {
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      try {
        // デッキを作成するAPIを呼び出し
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const data = await response.json();
        if (data.success) {
          setDeckId(data.deck_id); // デッキIDを保存
          setRemaining(data.remaining); // 残りのカード枚数を保存
        } else {
          setError('デッキの作成に失敗しました。'); // エラーメッセージを設定
        }
      } catch (error) {
        setError('APIリクエスト中にエラーが発生しました。'); // エラーメッセージを設定
        console.error(error); // エラーをコンソールに出力
      } finally {
        setLoading(false); // ローディング状態を終了
      }
    };

    createNewDeck(); // コンポーネントの初回レンダリング時にデッキを作成
  }, []);

  // カードを引く関数
  const drawCards = useCallback(async (count) => {
    if (!deckId) {
      alert('デッキが作成されていません。'); // デッキがない場合の警告
      return null;
    }
    if (remaining < count) {
      alert('デッキに十分なカードがありません。'); // 残りカードが足りない場合の警告
      return null;
    }

    setLoading(true); // ローディング状態を開始
    setError(null); // エラーをリセット
    try {
      // カードを引くAPIを呼び出し
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
      const data = await response.json();
      if (data.success && data.cards.length > 0) {
        setRemaining(data.remaining - count); // 残りカード枚数を更新
        return data.cards; // 引いたカードを返す
      } else {
        setError('カードを引くのに失敗しました。'); // エラーメッセージを設定
        return null;
      }
    } catch (error) {
      setError('APIリクエスト中にエラーが発生しました。'); // エラーメッセージを設定
      console.error(error); // エラーをコンソールに出力
      return null;
    } finally {
      setLoading(false); // ローディング状態を終了
    }
  }, [deckId, remaining]);

  // カードの値を取得する関数
  const getCardValue = (value) => {
    if (value === 'ACE') return 1; // エースは1として扱う
    if (['KING', 'QUEEN', 'JACK'].includes(value)) return 10; // 絵札は10として扱う
    return parseInt(value, 10); // 数字カードはそのままの値
  };

  // カードの合計値を計算する関数
  const calculateTotal = useCallback((cards) => {
    let sum = cards.reduce((total, card) => total + getCardValue(card.value), 0); // 合計値を計算
    const aceCount = cards.filter(card => card.value === 'ACE').length; // エースの枚数をカウント
    for (let i = 0; i < aceCount; i++) {
      if (sum + 10 <= 21) {
        sum += 10; // エースを11として扱う場合
      }
    }
    return sum; // 合計値を返す
  }, []);

  // プレイヤーとディーラーの合計値を計算
  const playerTotal = calculateTotal(playerCards);
  const dealerTotal = calculateTotal(dealerCards);

  // 初期カードを配る関数
  const dealInitialCards = useCallback(async () => {
    if (betAmount > 0 && playerChips >= betAmount && deckId) {
      setShowBettingBox(false); // 賭けボックスを非表示
      setCanBet(false); // 賭けを無効化
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      setPlayerCards([]); // プレイヤーのカードをリセット
      setDealerCards([]); // ディーラーのカードをリセット
      setPlayerBurst(false); // プレイヤーのバースト状態をリセット
      setDealerBurst(false); // ディーラーのバースト状態をリセット
      setGameEnded(false); // ゲーム終了状態をリセット
      setGameResult(null); // ゲーム結果をリセット
      setIsDealerFirstCardHidden(true); // ディーラーの最初のカードを隠す
      setIsPlayerTurn(true); // プレイヤーのターンを開始
      setIsBlackjack(false); // ブラックジャック状態をリセット

      setPlayerChips(prevChips => prevChips - betAmount); // 賭け金を差し引く

      const initialPlayerCards = await drawCards(2); // プレイヤーに2枚配る
      const initialDealerCards = await drawCards(2); // ディーラーに2枚配る

      if (initialPlayerCards && initialDealerCards) {
        setPlayerCards(initialPlayerCards); // プレイヤーのカードを設定
        setDealerCards(initialDealerCards); // ディーラーのカードを設定

        const initialPlayerTotal = calculateTotal(initialPlayerCards);
        if (initialPlayerTotal === 21) {
          setIsBlackjack(true); // ブラックジャックの場合
          setGameEnded(true); // ゲーム終了
          setIsPlayerTurn(false); // プレイヤーのターン終了
          setIsDealerFirstCardHidden(false); // ディーラーのカードを公開
        }
      }
      setLoading(false); // ローディング状態を終了
    } else if (betAmount <= 0) {
      alert('賭けるチップの枚数を入力してください。'); // 賭け金が0以下の場合の警告
    } else if (playerChips < betAmount) {
      alert('チップが足りません。'); // チップが足りない場合の警告
    }
  }, [betAmount, playerChips, deckId, drawCards, calculateTotal]);

    // プレイヤーがカードを引く関数
    const playerDrawCard = async () => {
      if (isPlayerTurn && !gameEnded && !playerBurst) { // プレイヤーのターン中でゲームが終了しておらず、バーストしていない場合
        const cards = await drawCards(1); // 1枚カードを引く
        if (cards) {
          setPlayerCards([...playerCards, cards[0]]); // プレイヤーのカードリストに追加
        }
      }
    };
  
    // ディーラーがカードを引く関数
    const dealerDrawCard = useCallback(async () => {
      if (gameEnded || dealerBurst) { // ゲームが終了しているか、ディーラーがバーストしている場合は何もしない
        return;
      }
      const cards = await drawCards(1); // 1枚カードを引く
      if (cards) {
        setDealerCards([...dealerCards, cards[0]]); // ディーラーのカードリストに追加
      }
    }, [gameEnded, dealerBurst, drawCards, dealerCards]);
  
    // プレイヤーが「スタンド」を選択した場合の処理
    const playerStand = () => {
      if (isPlayerTurn && !gameEnded) { // プレイヤーのターン中でゲームが終了していない場合
        setIsPlayerTurn(false); // プレイヤーのターンを終了
        setIsDealerFirstCardHidden(false); // ディーラーの最初のカードを公開
      }
    };
  
    // ゲームをリセットする関数
    const resetGame = async () => {
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      try {
        // デッキをシャッフルするAPIを呼び出し
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
        const data = await response.json();
        if (data.success) {
          // ゲームの状態を初期化
          setPlayerCards([]);
          setDealerCards([]);
          setRemaining(data.remaining);
          setPlayerBurst(false);
          setDealerBurst(false);
          setIsPlayerTurn(false); // 賭けフェーズに戻る
          setGameEnded(false);
          setGameResult(null);
          setIsDealerFirstCardHidden(true);
          setBetAmount(0);
          setCanBet(true);
          setShowBettingBox(true); // 賭けボックスを表示
          setIsBlackjack(false);
        } else {
          setError('デッキのリシャッフルに失敗しました。'); // エラーメッセージを設定
        }
      } catch (error) {
        setError('APIリクエスト中にエラーが発生しました。'); // エラーメッセージを設定
        console.error(error); // エラーをコンソールに出力
      } finally {
        setLoading(false); // ローディング状態を終了
      }
    };
  
    // プレイヤーがバーストした場合の処理
    useEffect(() => {
      if (playerTotal > 21 && !playerBurst) { // プレイヤーの合計が21を超えた場合
        setPlayerBurst(true); // プレイヤーがバーストした状態に設定
        setIsPlayerTurn(false); // プレイヤーのターンを終了
        setGameEnded(true); // ゲームを終了
      }
    }, [playerTotal, playerBurst, setIsPlayerTurn]);
  
    // ディーラーのターンの処理
    useEffect(() => {
      if (!isPlayerTurn && !gameEnded && playerCards.length > 0) { // プレイヤーのターンが終了し、ゲームが終了していない場合
        if (dealerTotal < 17) { // ディーラーの合計が17未満の場合
          setTimeout(dealerDrawCard, 1500); // 少し間隔を開けてディーラーがカードを引く
        } else {
          setGameEnded(true); // ディーラーのターンが終了したらゲームを終了
        }
      }
    }, [isPlayerTurn, gameEnded, dealerTotal, dealerDrawCard, playerCards.length]);
  
    // ディーラーがバーストした場合の処理
    useEffect(() => {
      if (dealerTotal > 21 && !dealerBurst) { // ディーラーの合計が21を超えた場合
        setDealerBurst(true); // ディーラーがバーストした状態に設定
        setGameEnded(true); // ゲームを終了
      }
    }, [dealerTotal, dealerBurst, setGameEnded]);
  
    // ゲーム終了時の結果を計算する処理
    useEffect(() => {
      if (gameEnded) { // ゲームが終了した場合
        let result = '';
        let payout = 0;
        if (isBlackjack) { // プレイヤーがブラックジャックの場合
          result = 'ブラックジャック！プレイヤーの勝ち！';
          payout = betAmount * 1.5; // 賭け金の1.5倍を払い戻し
        } else if (playerBurst) { // プレイヤーがバーストした場合
          result = 'ディーラーの勝ち！';
        } else if (dealerBurst) { // ディーラーがバーストした場合
          result = 'プレイヤーの勝ち！';
          payout = betAmount; // 賭け金を払い戻し
        } else if (playerTotal > dealerTotal) { // プレイヤーの合計がディーラーより大きい場合
          result = 'プレイヤーの勝ち！';
          payout = betAmount; // 賭け金を払い戻し
        } else if (dealerTotal > playerTotal) { // ディーラーの合計がプレイヤーより大きい場合
          result = 'ディーラーの勝ち！';
        } else { // 引き分けの場合
          result = '引き分け！';
          payout = betAmount; // 賭け金をそのまま返す
        }
        setGameResult(result); // ゲーム結果を設定
        setPlayerChips(prevChips => prevChips + payout); // プレイヤーのチップを更新
        setCanBet(true); // 次の賭けを可能にする
        setShowBettingBox(false); // 賭けボックスを非表示
      }
    }, [gameEnded, playerTotal, dealerTotal, playerBurst, dealerBurst, betAmount, isBlackjack]);
  
    // ゲーム終了後に賭けボックスを表示する処理
    useEffect(() => {
      if (gameEnded) {
        setCanBet(true); // 賭けを可能にする
        setShowBettingBox(true); // 賭けボックスを表示
      }
    }, [gameEnded]);
  
    // 賭け金の変更を処理する関数
    const handleBetChange = (event) => {
      const value = parseInt(event.target.value, 10); // 入力値を整数に変換
      setBetAmount(isNaN(value) ? 0 : value); // 無効な値の場合は0を設定
    };
  
    // ゲーム開始が可能かどうかを判定
    const canDeal = betAmount > 0 && playerChips >= betAmount && deckId && canBet;
  
    // ゲームがアクティブかどうかを判定
    const isGameActive = playerCards.length > 0 && !gameEnded;

    return (
      <div className="bg-gradient-to-b from-black to-green-900 min-h-screen py-10 flex flex-col items-center justify-center">
        <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet"></link>
        <div className="bg-green-800 rounded-lg shadow-xl p-8 w-full max-w-3xl text-white">
          <h1 className="text-yellow-400 text-5xl font-bold mb-6 text-center">BlackJack</h1>
          <div className="text-center mb-6">
            <p className="text-lg">現在のチップ: <span className="text-yellow-300 font-bold">{playerChips}</span></p>
            {showBettingBox && (
              <div className="mt-4">
                <label htmlFor="bet" className="block text-sm font-bold mb-2">賭けるチップ:</label>
                <input
                  type="number"
                  id="bet"
                  className="shadow appearance-none border border-yellow-400 rounded w-24 py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline text-center"
                  min="1"
                  max={playerChips}
                  value={betAmount}
                  onChange={handleBetChange}
                />
                <button
                  onClick={dealInitialCards}
                  disabled={!canDeal || loading}
                  className={`bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full shadow-md mt-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    !canDeal && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  ゲーム開始
                </button>
              </div>
            )}
            {deckId && <p className="text-xs mt-2">デッキID: {deckId}</p>}
            <p className="text-xs">残りのカード数: {remaining}</p>
            {error && <p className="text-red-500">{error}</p>}
          </div>
    
          <div className="mb-8">
            <h2 className="text-yellow-400 text-2xl font-bold mb-4 text-center">ディーラー</h2>
            <div className="flex justify-center items-center space-x-4">
              {dealerCards.map((card, index) => (
                <div key={index} className="relative">
                  <img
                    src={index === 0 && isPlayerTurn && isDealerFirstCardHidden ? cardBackImage : card.image}
                    alt={index === 0 && isPlayerTurn && isDealerFirstCardHidden ? '裏向きのカード' : `${card.value} of ${card.suit}`}
                    className="w-24 h-36 rounded-md shadow-md"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-center">合計: {isPlayerTurn && isDealerFirstCardHidden ? '?' : dealerTotal}</p>
            {dealerBurst && <p className="text-red-500 font-bold text-center">バースト!</p>}
          </div>
    
          <div className="mb-8">
            <h2 className="text-yellow-400 text-2xl font-bold mb-4 text-center">Player</h2>
            <div className="flex justify-center items-center space-x-4">
              {playerCards.map((card, index) => (
                <div key={index} className="relative">
                  <img
                    src={card.image}
                    alt={`${card.value} of ${card.suit}`}
                    className="w-24 h-36 rounded-md shadow-md"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-center">合計: {playerTotal}</p>
            {playerBurst && <p className="text-red-500 font-bold text-center">バースト!</p>}
            {isBlackjack && <p className="text-green-500 font-bold text-center">ブラックジャック!</p>}
          </div>
    
          <div className="mt-6 flex justify-center space-x-4">
            {isPlayerTurn && !gameEnded && (
              <>
                <button
                  onClick={playerDrawCard}
                  disabled={playerBurst || !isGameActive}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  ヒット
                </button>
                <button
                  onClick={playerStand}
                  disabled={!isGameActive}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  スタンド
                </button>
              </>
            )}
            {gameEnded && gameResult && (
              <p className="text-lg font-bold mt-4 text-center text-yellow-400">{gameResult}</p>
            )}
            <button
              onClick={resetGame}
              className="bg-gray-400 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded-full mt-4 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              新しいゲーム
            </button>
            <Link
              to="/"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              タイトルに戻る
            </Link>
          </div>
        </div>
      </div>
    );
};