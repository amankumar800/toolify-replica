import React from 'react';

export function AdPlaceholder() {
    return (
        <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2 my-8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Advertisement</span>
            <p className="text-sm text-gray-500">Ad Space (Leaderboard 728x90)</p>
        </div>
    );
}
