import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Pokerコンポーネントの定義
export const Poker = () => {
  // ゲームの状態を管理するためのuseStateフック
  const [deckId, setDeckId] = useState(null); // デッキIDを保存
  const [playerHand, setPlayerHand] = useState([]); // プレイヤーの手札
  const [selectedCards, setSelectedCards] = useState([]); // 交換するカードのインデックス
  const [exchangeCount, setExchangeCount] = useState(0); // カード交換の回数
  const [gamePhase, setGamePhase] = useState('betting'); // ゲームのフェーズ ('betting', 'initial', 'exchange', 'final')
  const [handRank, setHandRank] = useState(''); // プレイヤーの手札の役
  const [loading, setLoading] = useState(false); // ローディング中かどうか
  const [error, setError] = useState(null); // エラーメッセージ
  const [canExchange, setCanExchange] = useState(false); // カード交換が可能かどうか
  const [chip, setChip] = useState(100); // プレイヤーの所持チップ
  const [bet, setBet] = useState(''); // 賭け金
  const [winAmount, setWinAmount] = useState(0); // 勝利金額
  const [payoutMultipliers] = useState({
    // 各役に対する配当倍率
    'ロイヤルストレートフラッシュ': 250,
    'ストレートフラッシュ': 50,
    'フォーカード': 25,
    'フルハウス': 9,
    'フラッシュ': 6,
    'ストレート': 4,
    'スリーカード': 3,
    'ツーペア': 2,
    'ワンペア': 1,
    'ハイカード': 0, // 負けまたは引き分け
  });

  // デッキを作成するuseEffectフック
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

    createNewDeck(); // 初回レンダリング時にデッキを作成
  }, []);

  // カードを引く関数
  const drawCards = useCallback(async (deckId, count) => {
    if (!deckId) {
      return null; // デッキが存在しない場合は何もしない
    }
    setLoading(true); // ローディング状態を開始
    setError(null); // エラーをリセット
    try {
      // カードを引くAPIを呼び出し
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
      const data = await response.json();
      if (data.success && data.cards.length > 0) {
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
  }, []);

  // 初期手札を配る関数
  const dealInitialHand = useCallback(async () => {
    if (deckId && bet > 0) {
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      try {
        const cards = await drawCards(deckId, 5); // 5枚のカードを引く
        if (cards) {
          setPlayerHand(cards); // プレイヤーの手札を設定
          setGamePhase('initial'); // ゲームフェーズを初期フェーズに設定
          setExchangeCount(0); // 交換回数をリセット
          setSelectedCards([]); // 選択されたカードをリセット
          setHandRank(''); // 手札の役をリセット
          setCanExchange(true); // カード交換を可能にする
          setWinAmount(0); // 勝利金額をリセット
        }
      } finally {
        setLoading(false); // ローディング状態を終了
      }
    } else if (bet === 0) {
      setError('チップを賭けてください。'); // 賭け金が0の場合のエラー
    }
  }, [deckId, drawCards, bet]);

  // カードを選択または選択解除する関数
  const toggleSelectCard = (index) => {
    if ((gamePhase === 'initial' || gamePhase === 'exchange') && exchangeCount < 2 && canExchange) {
      setSelectedCards((prevSelected) =>
        prevSelected.includes(index)
          ? prevSelected.filter((i) => i !== index) // 選択解除
          : [...prevSelected, index] // 選択
      );
    }
  };

  // 選択されたカードを交換する関数
  const exchangeSelectedCards = useCallback(async () => {
    if ((gamePhase === 'initial' || gamePhase === 'exchange') && exchangeCount < 2 && selectedCards.length > 0 && deckId && canExchange) {
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      try {
        const cardsToDrawCount = selectedCards.length; // 交換するカードの枚数
        const newCards = await drawCards(deckId, cardsToDrawCount); // 新しいカードを引く

        if (newCards) {
          const newHand = [...playerHand]; // 現在の手札をコピー
          selectedCards.forEach((index, i) => {
            newHand[index] = newCards[i]; // 選択されたカードを新しいカードに置き換える
          });
          setPlayerHand(newHand); // 更新された手札を設定
          setSelectedCards([]); // 選択をリセット
          setExchangeCount((prevCount) => prevCount + 1); // 交換回数を増加
          setGamePhase('exchange'); // ゲームフェーズを交換フェーズに設定
        }
      } finally {
        setLoading(false); // ローディング状態を終了
      }
    }
  }, [deckId, drawCards, playerHand, selectedCards, exchangeCount, gamePhase, canExchange]);

  // 手札を確定する関数
  const finalizeHand = () => {
    if ((gamePhase === 'exchange' || gamePhase === 'initial') && canExchange) {
      const rank = determineHand(playerHand); // 手札の役を判定
      setHandRank(rank); // 判定された役を設定
      setGamePhase('final'); // ゲームフェーズを最終フェーズに設定
      setCanExchange(false); // カード交換を無効化
      calculatePayout(rank); // 配当を計算
    }
  };

  // 配当を計算する関数
  const calculatePayout = (rank) => {
    const multiplier = payoutMultipliers[rank] || 0; // 役に対応する倍率を取得
    const payout = bet * multiplier; // 配当を計算
    setWinAmount(payout); // 勝利金額を設定
    setChip((prevChip) => prevChip + payout); // チップを更新
  };

  // 新しいゲームを開始する関数
  const startNewGame = () => {
    if (deckId) {
      setLoading(true); // ローディング状態を開始
      setError(null); // エラーをリセット
      fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`) // デッキをシャッフル
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // ゲームの状態をリセット
            setPlayerHand([]);
            setGamePhase('betting');
            setHandRank('');
            setCanExchange(false);
            setExchangeCount(0);
            setSelectedCards([]);
            setBet(0);
            setWinAmount(0);
          } else {
            setError('デッキのリシャッフルに失敗しました。'); // エラーメッセージを設定
          }
        })
        .catch((error) => {
          setError('APIリクエスト中にエラーが発生しました。'); // エラーメッセージを設定
          console.error(error); // エラーをコンソールに出力
        })
        .finally(() => setLoading(false)); // ローディング状態を終了
    }
  };

  // 賭け金の変更を処理する関数
  const handleBetChange = (event) => {
    const value = parseInt(event.target.value, 10); // 入力値を整数に変換
    if (!isNaN(value) && value >= 0 && value <= chip) {
      setBet(event.target.value); // 賭け金を設定
    } else if (event.target.value === '') {
      setBet(''); // 空の入力を許可
    }
  };

  // 賭け金を確定してゲームを開始する関数
  const placeBet = () => {
    if (bet !== '' && parseInt(bet, 10) > 0 && gamePhase === 'betting') {
      setChip((prevChip) => prevChip - parseInt(bet, 10)); // 賭け金を差し引く
      dealInitialHand(); // 初期手札を配る
    } else if (bet === '' || parseInt(bet, 10) === 0) {
      setError('賭けるチップ額を入力してください。'); // 賭け金が無効な場合のエラー
    }
  };

  // 手札のランクを取得する関数 (役判定用)
  const getRanks = (hand) => hand.map(card => card.value);

  // 手札のスートを取得する関数 (役判定用)
  const getSuits = (hand) => hand.map(card => card.suit);

  // ランクの出現回数をカウントする関数 (役判定用)
  const countRanks = (ranks) => {
    const counts = {};
    for (const rank of ranks) {
      counts[rank] = (counts[rank] || 0) + 1;
    }
    return counts;
  };

  // ランクを数値に変換する関数 (役判定用)
  const rankToValue = (rank) => {
    if (['2', '3', '4', '5', '6', '7', '8', '9'].includes(rank)) return parseInt(rank, 10);
    if (rank === 'T') return 10;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    if (rank === 'A') return 14;
    return 0;
  };

  // 役を判定する関数 (基本的な判定のみ)
  const determineHand = (hand) => {
    if (!hand || hand.length !== 5) return '';

    const ranks = getRanks(hand).sort((a, b) => rankToValue(a) - rankToValue(b));
    const suits = getSuits(hand);
    const rankCounts = countRanks(ranks);
    const values = ranks.map(rankToValue);

    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = values.every((v, i, a) => i === 0 || v === a[i - 1] + 1) ||
      (new Set(ranks).has('A') && new Set(ranks).has('2') && new Set(ranks).has('3') && new Set(ranks).has('4') && new Set(ranks).has('5'));

    const hasRoyal = new Set(ranks).has('A') && new Set(ranks).has('K') && new Set(ranks).has('Q') && new Set(ranks).has('J') && new Set(ranks).has('T');

    if (isFlush && isStraight && hasRoyal) return 'ロイヤルストレートフラッシュ';
    if (isFlush && isStraight) return 'ストレートフラッシュ';
    if (Object.values(rankCounts).includes(4)) return 'フォーカード';
    if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2)) return 'フルハウス';
    if (isFlush) return 'フラッシュ';
    if (isStraight) return 'ストレート';
    if (Object.values(rankCounts).includes(3)) return 'スリーカード';
    const pairs = Object.values(rankCounts).filter(count => count === 2).length;
    if (pairs === 2) return 'ツーペア';
    if (pairs === 1) return 'ワンペア';
    return 'ハイカード';
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="bg-gradient-to-b from-black to-green-900 min-h-screen py-10 flex flex-col items-center justify-center">
      <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet"></link>
      <h1 className="text-yellow-400 text-5xl font-bold mb-6">ポーカー カジノ</h1>
      <p className="text-white text-lg mb-4">現在のチップ: <span className="text-yellow-400 font-bold">{chip}</span></p>
  
      {gamePhase === 'betting' && (
        <div className="text-center mb-6">
          <label htmlFor="betAmount" className="text-white text-lg">賭けるチップ:</label>
          <input
            type="number"
            id="betAmount"
            className="shadow border border-yellow-400 rounded w-24 py-2 px-3 bg-black text-yellow-400 ml-2"
            value={bet}
            onChange={handleBetChange}
            min="1"
            max={chip}
          />
          <button
            onClick={placeBet}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded shadow-lg ml-4"
          >
            ベット
          </button>
        </div>
      )}
  
      {gamePhase !== 'betting' && (
        <div className="text-center mb-6">
          <h2 className="text-yellow-400 text-2xl font-bold mb-4">あなたの手札</h2>
          <div className="flex justify-center items-center space-x-4">
            {playerHand.map((card, index) => (
              <div
                key={index}
                className={`relative cursor-pointer ${selectedCards.includes(index) ? 'border-yellow-500 border-4 rounded-md' : ''}`}
                onClick={() => toggleSelectCard(index)}
              >
                <img
                  src={card.image}
                  alt={`${card.value} of ${card.suit}`}
                  className="w-24 h-36 rounded-md shadow-md"
                />
              </div>
            ))}
          </div>
          {handRank && <p className="mt-4 text-lg font-semibold text-yellow-300">役: {handRank}</p>}
          {gamePhase === 'exchange' && exchangeCount < 2 && (
            <p className="mt-2 text-sm text-yellow-200">交換回数: {exchangeCount} / 2</p>
          )}
        </div>
      )}
  
      {gamePhase === 'initial' || gamePhase === 'exchange' ? (
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={exchangeSelectedCards}
            disabled={selectedCards.length === 0 || loading || exchangeCount >= 2 || gamePhase === 'final' || !canExchange}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              (selectedCards.length === 0 || loading || exchangeCount >= 2 || gamePhase === 'final' || !canExchange) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            カードを交換
          </button>
          <button
            onClick={finalizeHand}
            disabled={gamePhase === 'final' || playerHand.length === 0}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            確定
          </button>
        </div>
      ) : gamePhase === 'final' ? (
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-green-400">結果を確定しました</p>
        </div>
      ) : null}
  
      <div className="text-center">
        <button
          onClick={startNewGame}
          className="inline-block bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 mt-4"
        >
          新しいゲーム
        </button>
        <Link
          to="/"
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2"
        >
          タイトルに戻る
        </Link>
      </div>
    </div>
  );
};