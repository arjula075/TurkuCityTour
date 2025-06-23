// FinalMessage.jsx
import React from 'react';

export default function FinalMessage({ message }) {
  return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">🎉 Congratulations!</h1>
        <p className="text-xl">{message || 'Thanks for playing!'}</p>
      </div>
  );
}
