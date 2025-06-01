import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cardBackImage from './assets/card_back.png';

// HighLowコンポーネントの定義
export const HighLow = () => {
  // ゲームの状態を管理するためのuseStateフック
  const [deckId, setDeckId] = useState(null); // デッキIDを保存
  const [currentCard, setCurrentCard] = useState(null); // 現在のカード
  const [previousCard, setPreviousCard] = useState(null); // 前回のカード（UIで表示するように修正）
  const [secondCard, setSecondCard] = useState(null); // 次のカード
  const [loading, setLoading] = useState(true); // ローディング中かどうか（UIで表示するように修正）
  const [error, setError] = useState(null); // エラーメッセージ（UIで表示するように修正）
  const [resultMessage, setResultMessage] = useState(''); // 結果メッセージ
  const [chips, setChips] = useState(100); // プレイヤーの所持チップ
  const [bet, setBet] = useState(''); // 賭け金
  const [gameState, setGameState] = useState('betting'); // ゲームの状態 ('betting', 'cardDrawn', 'winChoice', 'lose', etc.)
  const [winnings, setWinnings] = useState(0); // 勝利金額
  // const [pendingGuess, setPendingGuess] = useState(null); // プレイヤーの予想 ('high' または 'low') - 使用されていないため削除

  // 新しいデッキを作成する関数
  const fetchNewDeck = async () => {
    try {
      setLoading(true); // API呼び出し前にローディング開始
      setError(null); // エラーをリセット
      const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDeckId(data.deck_id); // デッキIDを保存
      setLoading(false); // ローディング状態を終了
    } catch (error) {
      console.error("Error fetching new deck:", error); // デバッグ用にコンソールにも出力
      setError(error); // エラーを設定
      setLoading(false); // ローディング状態を終了
    }
  };

  // コンポーネントの初回レンダリング時にデッキを作成
  useEffect(() => {
    fetchNewDeck();
  }, []);

  // 最初のカードを引く関数
  const drawFirstCard = async () => {
    if (!deckId) return; // デッキが存在しない場合は何もしない
    setLoading(true); // ローディング状態を開始
    setError(null); // エラーをリセット
    try {
      const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.cards.length > 0) {
        setCurrentCard(data.cards[0]); // 現在のカードを設定
        setResultMessage(''); // 結果メッセージをリセット
        setSecondCard(null); // 次のカードをリセット
        setPreviousCard(null); // 新しいゲーム開始時に前回のカードをリセット
        setGameState('cardDrawn'); // ゲーム状態を更新
      } else {
        // カードが引けなかった場合のハンドリング（デッキが空など）
        throw new Error('No cards left in the deck or failed to draw a card.');
      }
      setLoading(false); // ローディング状態を終了
    } catch (err) {
      console.error("Error drawing first card:", err); // デバッグ用にコンソールにも出力
      setError(err); // エラーを設定
      setLoading(false); // ローディング状態を終了
    }
  };

  // 次のカードを引く関数
  const drawSecondCard = async (guess) => {
    if (!deckId) return; // デッキが存在しない場合は何もしない
    setLoading(true); // ローディング状態を開始
    setError(null); // エラーをリセット
    try {
      const res = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.cards.length > 0) {
        const newCard = data.cards[0]; // 新しいカードを取得
        setSecondCard(newCard); // 次のカードを設定
        const prevValue = getCardValue(currentCard); // 現在のカードの値を取得
        const currValue = getCardValue(newCard); // 次のカードの値を取得

        // プレイヤーの予想が正しいか判定
        if ((guess === 'high' && currValue > prevValue) || (guess === 'low' && currValue < prevValue)) {
          setResultMessage('当たり！'); // 正解メッセージ
          setWinnings(bet * 2); // 勝利金額を設定
          setGameState('winChoice'); // 勝利後の選択状態に移行
        } else if (currValue === prevValue) {
          setResultMessage('引き分け！'); // 引き分けメッセージ
          setWinnings(bet); // 賭け金をそのまま返す
          setGameState('Draw'); // 引き分け状態に移行
        } else {
          setResultMessage('はずれ！'); // 不正解メッセージ
          setWinnings(0); // 勝利金額を0に設定
          setGameState('lose'); // 負け状態に移行
          if (chips === 0) {
            setGameState('gameOver'); // チップがなくなった場合はゲームオーバー
            setResultMessage('ゲームオーバー！チップがなくなりました。');
          } else {
            // 負けた場合は、次のゲームのために状態をリセット
            setCurrentCard(null);
            setPreviousCard(null);
            setSecondCard(null);
            setGameState('betting'); // 賭け状態に戻る
          }
        }
      } else {
        throw new Error('No cards left in the deck or failed to draw a card.');
      }
      setLoading(false); // ローディング状態を終了
    } catch (err) {
      console.error("Error drawing second card:", err); // デバッグ用にコンソールにも出力
      setError(err); // エラーを設定
      setLoading(false); // ローディング状態を終了
    }
  };

  // カードの値を取得する関数
  const getCardValue = (card) => {
    if (!card) return 0; // カードが存在しない場合は0を返す
    const value = card.value;
    if (value === 'ACE') return 14; // エースは14として扱う
    if (value === 'KING') return 13; // キングは13
    if (value === 'QUEEN') return 12; // クイーンは12
    if (value === 'JACK') return 11; // ジャックは11
    return parseInt(value, 10); // 数字カードはそのままの値
  };

  // プレイヤーの予想を処理する関数
  const handleGuess = (guess) => {
    if (gameState !== 'cardDrawn' || !currentCard) return; // カードが引かれていない場合は何もしない
    setPreviousCard(currentCard); // 現在のカードを前回のカードとして保存
    drawSecondCard(guess); // 次のカードを引く
  };

  // 賭け金の入力を処理する関数
  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10); // 入力値を整数に変換
    // NaNでなく、0より大きく、現在のチップ以下であること
    if (!isNaN(value) && value > 0 && value <= chips) {
      setBet(value); // 賭け金を設定
    } else if (e.target.value === '') { // 入力値が空の場合は、betを空文字列に設定
      setBet('');
    }
  };

  // 賭け金を確定してゲームを開始する関数
  const handleBetSubmit = (e) => {
    e.preventDefault(); // フォームのデフォルト動作を防止
    // betが有効な数値であり、チップが十分にあること
    if (bet > 0 && bet <= chips && gameState === 'betting') {
      setChips(chips - bet); // 賭け金をチップから差し引く
      drawFirstCard(); // 最初のカードを引く
    } else {
        // エラーメッセージを表示するなど、ユーザーへのフィードバックを追加することも可能
        setResultMessage('有効な賭け金を入力してください。');
    }
  };

  // ゲームを継続する関数（ダブルアップ）
  const handleContinueGame = () => {
    setChips(chips + winnings); // 勝利金額をチップに加える（一旦確定させる）
    setBet(winnings); // 勝利金額を次の賭け金に設定
    setWinnings(0); // 勝利金額をリセット
    setCurrentCard(null); // 現在のカードをリセット
    setPreviousCard(null); // 前回のカードをリセット
    setSecondCard(null); // 次のカードをリセット
    setResultMessage(''); // 結果メッセージをリセット
    setGameState('betting'); // 賭け状態に戻る
    drawFirstCard(); // 新しいカードを引く（最初のカードを引くことで'cardDrawn'に移行）
  };

  // 勝利金額を確定して終了する関数
  const handleCashOut = () => {
    setResultMessage(`おめでとうございます！${winnings}チップを獲得しました。`); // 勝利メッセージ
    setChips(chips + winnings); // チップを更新
    setWinnings(0); // 勝利金額をリセット
    setBet(''); // 賭け金をリセット
    setGameState('betting'); // 賭け状態に戻る
    setCurrentCard(null); // 現在のカードをリセット
    setPreviousCard(null); // 前回のカードをリセット
    setSecondCard(null); // 次のカードをリセット
  };

  // 負けた場合の処理（再開）
  const handleLose = () => {
    setWinnings(0); // 勝利金額をリセット
    setBet(''); // 賭け金をリセット
    setSecondCard(null); // 次のカードをリセット
    setCurrentCard(null); // 現在のカードをリセット
    setPreviousCard(null); // 前回のカードをリセット
    setResultMessage(''); // 結果メッセージをリセット
    setGameState('betting'); // 賭け状態に戻る
  };

  // ゲームをリスタートする関数
  const handleRestart = () => {
    setDeckId(null); // デッキIDをリセット
    setCurrentCard(null); // 現在のカードをリセット
    setPreviousCard(null); // 前回のカードをリセット
    setSecondCard(null); // 次のカードをリセット
    setLoading(true); // ローディング状態を開始
    setError(null); // エラーをリセット
    setResultMessage(''); // 結果メッセージをリセット
    setChips(100); // チップを初期値に設定
    setBet(''); // 賭け金を初期値にリセット
    setGameState('betting'); // 賭け状態に戻る
    setWinnings(0); // 勝利金額をリセット
    fetchNewDeck(); // 新しいデッキを作成
  };

  return (
    <div className="bg-gradient-to-b from-black to-green-900 min-h-screen py-10 flex flex-col items-center justify-center">
      <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet"></link>
      <h1 className="text-yellow-400 text-5xl font-bold mb-6">High & Low Casino</h1>
      <p className="text-white text-lg mb-4">現在のチップ: <span className="text-yellow-400 font-bold">{chips}</span></p>

      {/* ローディングとエラーメッセージの表示 */}
      {loading && <p className="text-white text-xl mt-4">カードを準備中...</p>}
      {error && <p className="text-red-500 text-xl mt-4">エラーが発生しました: {error.message}. デッキを再作成してください。</p>}

      {currentCard && gameState !== 'betting' && (
        <div className="flex flex-col items-center justify-center">
          <p className="text-white text-lg mb-4">賭けたチップ: <span className="text-yellow-400 font-bold">{bet}</span></p>
          <div className="bg-black bg-opacity-50 rounded-lg shadow-lg p-6 mb-6 flex items-center space-x-8">
            {/* 前回のカード（もしあれば）の表示 */}
            {previousCard && (
              <div>
                <p className="text-xl font-bold text-yellow-400 mb-2">前回のカード:</p>
                <img
                  src={previousCard.image}
                  alt={`${previousCard.value} of ${previousCard.suit}`}
                  className="w-40 h-60 object-contain border-4 border-yellow-400 rounded-lg"
                />
              </div>
            )}

            <div>
              <p className="text-xl font-bold text-yellow-400 mb-2">現在のカード:</p>
              <img
                src={currentCard.image}
                alt={`${currentCard.value} of ${currentCard.suit}`}
                className="w-40 h-60 object-contain border-4 border-yellow-400 rounded-lg"
              />
            </div>

            <div>
              <p className="text-xl font-bold text-yellow-400 mb-2">次のカード:</p>
              {gameState === 'cardDrawn' ? (
                <img
                  src={cardBackImage}
                  alt="裏返しカード"
                  className="w-40 h-60 object-contain border-4 border-yellow-400 rounded-lg"
                />
              ) : (
                secondCard && (
                  <img
                    src={secondCard.image}
                    alt={`${secondCard.value} of ${secondCard.suit}`}
                    className="w-40 h-60 object-contain border-4 border-yellow-400 rounded-lg"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {resultMessage && <p className="text-yellow-400 text-2xl font-bold mb-4">{resultMessage}</p>}

      {gameState === 'betting' && chips > 0 && ( // チップがある場合のみ賭けフォームを表示
        <form onSubmit={handleBetSubmit} className="flex items-center justify-center space-x-4 mb-4">
          <label htmlFor="betAmount" className="text-white text-lg">賭けるチップ:</label>
          <input
            type="number"
            id="betAmount"
            className="shadow border border-yellow-400 rounded w-24 py-2 px-3 bg-black text-yellow-400"
            value={bet}
            onChange={handleInputChange}
            min="1"
            max={chips}
          />
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded shadow-lg" disabled={!bet || bet > chips || bet <= 0}>
            カードを引く
          </button>
        </form>
      )}

      {gameState === 'betting' && chips === 0 && ( // チップが0の場合はゲームオーバー表示
          <p className="text-red-500 text-xl font-bold mb-4">チップがありません！ゲームオーバーです。</p>
      )}

      {gameState === 'cardDrawn' && (
        <div className="flex space-x-4">
          <button onClick={() => handleGuess('high')} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded shadow-lg font-bold">
            High
          </button>
          <button onClick={() => handleGuess('low')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded shadow-lg font-bold">
            Low
          </button>
        </div>
      )}

      {/* 勝利した場合の選択肢 */}
      {(gameState === 'winChoice' || gameState === 'Draw') && (
        <div className="flex space-x-4 mt-4">
          <button onClick={handleContinueGame} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded shadow-lg font-bold">
            ダブルアップ継続
          </button>
          <button onClick={handleCashOut} className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded shadow-lg font-bold">
            ここで終了
          </button>
        </div>
      )}

      {/* 負けた場合の処理 */}
      {gameState === 'lose' && chips > 0 && (
        <div className="flex space-x-4 mt-4">
          <button onClick={handleLose} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded shadow-lg font-bold">
            続ける
          </button>
        </div>
      )}

      {/* ゲームオーバー時のボタン */}
      {gameState === 'gameOver' && (
        <button onClick={handleRestart} className="mt-6 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded text-black font-bold shadow-lg">
          リスタート
        </button>
      )}

      <Link
        to="/"
        className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 mt-6"
      >
        タイトルに戻る
      </Link>
    </div>
  );
};