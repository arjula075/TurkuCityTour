import React, { useEffect, useState } from 'react';
import {
    fetchHintsResults,
    fetchCorrectAnswerResults,
    fetchTotalPointsResults
} from '../services/supabaseService';

export default function Results() {
    const [hintResults, setHintResults] = useState([]);
    const [correctResults, setCorrectResults] = useState([]);
    const [totalResults, setTotalResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [hints, corrects, totals] = await Promise.all([
                    fetchHintsResults(),
                    fetchCorrectAnswerResults(),
                    fetchTotalPointsResults()
                ]);
                console.log('Results:', hints, corrects, totals);

                console.log(JSON.stringify(hints));

                const hintAggregated = hints.reduce((acc, curr) => {
                    const key = curr.user_id;
                    acc[key] = acc[key] || {
                        user_id: key,
                        full_name: `${curr.first_name || ''} ${curr.last_name || ''}`.trim(),
                        hints_used: 0
                    };
                    acc[key].hints_used += curr.total_hints_used || 0; // match your actual key
                    return acc;
                }, {});


                const correctAggregated = corrects.reduce((acc, curr) => {
                    const key = curr.user_id;
                    acc[key] = acc[key] || {
                        user_id: key,
                        full_name: `${curr.first_name || ''} ${curr.last_name || ''}`.trim(),
                        correct_points: 0
                    };
                    acc[key].correct_points += 5; // or (curr.correct_count || 1) * 5
                    return acc;
                }, {});

                const totalWithNames = totals.map(row => ({
                    ...row,
                    full_name: `${row.first_name || ''} ${row.last_name || ''}`.trim()
                }));

                setHintResults(Object.values(hintAggregated).sort((a, b) => b.hints_used - a.hints_used));
                setCorrectResults(Object.values(correctAggregated).sort((a, b) => b.correct_points - a.correct_points));
                setTotalResults(totalWithNames.sort((a, b) => b.total_points - a.total_points));
            } catch (err) {
                console.error('Failed to fetch results:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return <div className="p-6">Loading...</div>;
    return (
        <div className="p-6 space-y-12">
            <h1 className="text-6xl font-bold mb-6">Results</h1>

            {/* Hint Usage */}
            <section>
                <h2 className="text-5xl font-semibold mb-4">Hints</h2>
                <table className="w-full border text-4xl">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-2">User</th>
                        <th className="p-2">Hints Used</th>
                    </tr>
                    </thead>
                    <tbody>
                    {hintResults.map((row) => (
                        <tr key={row.user_id}>
                            <td className="p-2">{row.full_name}</td>
                            <td className="p-2">{row.hints_used}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>

            {/* Correct Answers */}
            <section>
                <h2 className="text-5xl font-semibold mb-4">Correct Answers (5 points each)</h2>
                <table className="w-full border text-4xl">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-2">User</th>
                        <th className="p-2">Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {correctResults.map((row) => (
                        <tr key={row.user_id}>
                            <td className="p-2">{row.full_name}</td>
                            <td className="p-2">{row.correct_points}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>

            {/* Total Score */}
            <section>
                <h2 className="text-5xl font-semibold mb-4">Total Points</h2>
                <table className="w-full border text-4xl">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-2">User</th>
                        <th className="p-2">Total Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {totalResults.map((row) => (
                        <tr key={row.user_id}>
                            <td className="p-2">{row.full_name}</td>
                            <td className="p-2">{row.total_points}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}