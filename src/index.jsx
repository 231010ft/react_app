// Reactライブラリをインポート
import React from 'react';
// ReactDOMライブラリをインポート（ReactアプリをDOMにレンダリングするために使用）
import ReactDOM from 'react-dom/client';
import { App } from './title';
import { Blackjack } from './blackjack';
import { Poker } from './poker';
import { HighLow } from './high_low';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 'root'というIDを持つDOM要素を取得し、Reactのルートを作成
const root = ReactDOM.createRoot(document.getElementById('root'));
// Appコンポーネントをルートにレンダリング
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/trump_app" element={<App />} /> {/* タイトル画面へのルート */}
        <Route path="/blackjack" element={<Blackjack />} /> {/* ブラックジャック画面へのルート */}
        <Route path="/poker" element={<Poker />} />
        <Route path="/high_low" element={<HighLow />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);