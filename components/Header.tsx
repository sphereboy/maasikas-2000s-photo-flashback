import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center py-6 mb-8">
      <img
        src="https://i.imgur.com/Q366UnZ.png"
        alt="Maasikas Ajamasin - a retro-styled logo"
        className="w-full max-w-2xl mx-auto mb-4"
      />
      <h1 className="text-4xl sm:text-5xl font-bold font-orbitron tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-400">
        2000s Flashback
      </h1>
      <p className="mt-2 text-lg text-gray-400">Transform your photos with an early 2000s vibe.</p>
    </header>
  );
};