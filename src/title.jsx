import React from 'react';
import { useNavigate } from 'react-router-dom';

export const App = () => {
  const navigate = useNavigate();

  const handleGameSelect = (gameName) => {
    if (gameName === 'blackjack') {
      navigate('/blackjack');
    } else if (gameName === 'poker') {
      navigate('/poker');
    } else if (gameName === 'high_low') {
      navigate('/high_low');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-green-900 flex items-center justify-center">
      <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet"></link>
      <div className="text-center p-8 rounded-xl bg-green-800 bg-opacity-90 shadow-2xl border-4 border-yellow-600 max-w-md w-full">
        <h1 className="text-5xl md:text-6xl font-bold text-yellow-300 mb-8 drop-shadow-lg tracking-wide">
          🎲 Trump Game 🎲
        </h1>
        <p className="text-lg text-yellow-200 mb-6">好きなゲームを選んでください！</p>
        <div className="space-y-6">
          <button
            onClick={() => handleGameSelect('blackjack')}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200"
          >
            ♠ BlackJack ♠
          </button>
          <button
            onClick={() => handleGameSelect('poker')}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200"
          >
            ♠ Poker ♠
          </button>
          <button
            onClick={() => handleGameSelect('high_low')}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-800 text-white font-bold rounded-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200"
          >
            ♠ High and Low ♠
          </button>
        </div>
        <p className="mt-8 text-sm text-yellow-400">© 2025 Trump Game Inc. All rights reserved.</p>
      </div>
    </div>
  );
};