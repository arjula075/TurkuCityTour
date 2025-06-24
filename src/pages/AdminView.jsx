import React, { useEffect, useState } from 'react';
import {
    adminHints,
    adminQuestions,
    adminAnswers,
    adminLocations,
    fetchQuestionsAndAnswers,
} from '../services/supabaseService';

import LocationEditor from '../components/admin/LocationEditor';
import HintEditor from '../components/admin/HintEditor';
import QuestionEditor from '../components/admin/QuestionEditor';
import MapCoordinatePicker from '../components/admin/MapCoordinatePicker';

export default function AdminView() {
    const [locations, setLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [hints, setHints] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationToSetCoords, setLocationToSetCoords] = useState(null);

    useEffect(() => {
        async function loadLocations() {
            try {
                const locs = await adminLocations.fetch();
                setLocations(locs);
                if (locs.length > 0) setSelectedLocationId(locs[0].id);
            } catch (e) {
                alert('Failed to load locations: ' + e.message);
            }
        }
        loadLocations();
    }, []);

    useEffect(() => {
        async function loadData() {
            if (!selectedLocationId) return;
            setLoading(true);
            try {
                const hintsData = await adminHints.fetchByLocation(selectedLocationId);
                setHints(hintsData);

                const questionsData = await fetchQuestionsAndAnswers(selectedLocationId);
                setQuestions(questionsData);
            } catch (e) {
                alert('Failed to load hints or questions: ' + e.message);
            }
            setLoading(false);
        }
        loadData();
    }, [selectedLocationId]);

    async function addHint() {
        if (!selectedLocationId) return alert('Select a location first');
        const newHint = { location_id: selectedLocationId, hint_text: '', hint_order: hints.length + 1 };
        try {
            const data = await adminHints.insert(newHint);
            setHints([...hints, ...data]);
        } catch (e) {
            alert('Failed to add hint: ' + e.message);
        }
    }

    function updateHintText(id, text) {
        setHints(hints.map(h => (h.id === id ? { ...h, hint_text: text } : h)));
    }

    async function saveHint(hint) {
        try {
            await adminHints.update(hint.id, { hint_text: hint.hint_text, hint_order: hint.hint_order });
            alert('Hint saved');
        } catch (e) {
            alert('Failed to save hint: ' + e.message);
        }
    }

    async function deleteHint(id) {
        if (!window.confirm('Delete this hint?')) return;
        try {
            await adminHints.delete(id);
            setHints(hints.filter(h => h.id !== id));
        } catch (e) {
            alert('Failed to delete hint: ' + e.message);
        }
    }

    async function handleDeleteLocation(id) {
        if (!window.confirm('Are you sure you want to delete this location?')) return;

        try {
            await adminLocations.delete(id);
            setLocations(prev => prev.filter(loc => loc.id !== id));

            if (selectedLocationId === id) {
                const remaining = locations.filter(loc => loc.id !== id);
                setSelectedLocationId(remaining[0]?.id || null);
            }
        } catch (e) {
            alert('Failed to delete location: ' + e.message);
        }
    }

    async function updateLocationField(id, field, value) {
        setLocations(prev =>
            prev.map(loc => (loc.id === id ? { ...loc, [field]: value } : loc))
        );

        try {
            await adminLocations.update(id, { [field]: value });
        } catch (e) {
            alert(`Failed to update location: ${e.message}`);
        }
    }

    async function handleReorderLocations(updatedList) {
        try {
            setLocations(updatedList);
            await Promise.all(
                updatedList.map((loc, index) =>
                    adminLocations.update(loc.id, { display_order: index + 1 })
                )
            );
        } catch (e) {
            alert('Failed to reorder locations: ' + e.message);
        }
    }

    // Questions and Answers handlers

    const updateQuestionText = (questionId, field, value) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId ? { ...q, [field]: value } : q
            )
        );
    };

    const updateCorrectAnswer = (questionId, newAnswer) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId ? { ...q, correct_answer: newAnswer } : q
            )
        );
    };

    async function toggleCorrectAnswer(questionId, answerId) {
        // Optimistic UI update
        setQuestions(prev =>
            prev.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        answers: q.answers.map(a =>
                            a.id === answerId ? { ...a, is_correct: !a.is_correct } : a
                        ),
                    }
                    : q
            )
        );

        // Find current answer's is_correct value before toggle (optional)
        const question = questions.find(q => q.id === questionId);
        if (!question) return;
        const answer = question.answers.find(a => a.id === answerId);
        if (!answer) return;

        try {
            const updatedAnswer = await adminAnswers.toggleCorrectAnswer(answerId, answer.is_correct);

            // Sync with DB data
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId
                        ? {
                            ...q,
                            answers: q.answers.map(a =>
                                a.id === answerId ? updatedAnswer : a
                            ),
                        }
                        : q
                )
            );
        } catch (e) {
            alert('Failed to save answer status: ' + e.message);
        }
    }

    const saveQuestion = async (question) => {
        try {
            await adminQuestions.update(question.id, {
                question_body: question.question_body,
                question_header: question.question_header,
                correct_answer: question.correct_answer,
            });
            alert('Question saved');
        } catch (e) {
            alert('Failed to save question: ' + e.message);
        }
    };

    const deleteQuestion = async (questionId) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await adminQuestions.delete(questionId);
            setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        } catch (e) {
            alert('Failed to delete question: ' + e.message);
        }
    };

    const addQuestion = async () => {
        if (!selectedLocationId) return alert('Select a location first');
        try {
            const data = await adminQuestions.insert({
                location_id: selectedLocationId,
                question_text: '',
                correct_answer: '',
            });
            setQuestions((prev) => [...prev, data]);
        } catch (e) {
            alert('Failed to add question: ' + e.message);
        }
    };

    // Answer updates

    function updateAnswerText(questionId, answerId, newText) {
        setQuestions(prev =>
            prev.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        answers: q.answers.map(a =>
                            a.id === answerId ? { ...a, answer_text: newText } : a
                        ),
                    }
                    : q
            )
        );
    }

    async function saveAnswer(questionId, answer) {
        const { id, ...rest } = answer;
        try {
            if (id && typeof id === 'string' && id.startsWith('new')) {
                const data = await adminAnswers.insert({ ...rest, question_id: questionId });
                setQuestions(prev =>
                    prev.map(q =>
                        q.id === questionId
                            ? {
                                ...q,
                                answers: q.answers.map(a =>
                                    a.id === id ? data : a
                                ),
                            }
                            : q
                    )
                );
            } else {
                await adminAnswers.update(id, rest);
            }
        } catch (e) {
            alert('Failed to save answer: ' + e.message);
        }
    }

    async function deleteAnswer(questionId, answerId) {
        if (!window.confirm('Delete this answer?')) return;
        try {
            await adminAnswers.delete(answerId);
            setQuestions(prev =>
                prev.map(q =>
                    q.id === questionId
                        ? {
                            ...q,
                            answers: q.answers.filter(a => a.id !== answerId),
                        }
                        : q
                )
            );
        } catch (e) {
            alert('Failed to delete answer: ' + e.message);
        }
    }

    function addAnswer(questionId) {
        const newAnswer = {
            id: `new-${Date.now()}`,
            question_id: questionId,
            answer_text: '',
            is_correct: false,
        };

        setQuestions(prev =>
            prev.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        answers: [...(q.answers || []), newAnswer],
                    }
                    : q
            )
        );
    }
    // Set coordinates to locations
    function handleSetCoordinates(loc) {
        setLocationToSetCoords(loc);
    }

    async function handleSaveCoordinates(latlng) {
        const { lat, lng } = latlng;
        try {
            await adminLocations.update(locationToSetCoords.id, {
                latitude: lat,
                longitude: lng,
            });

            setLocations(prev =>
                prev.map(loc =>
                    loc.id === locationToSetCoords.id ? { ...loc, latitude: lat, longitude: lng } : loc
                )
            );
            setLocationToSetCoords(null);
        } catch (e) {
            alert('Failed to save coordinates: ' + e.message);
        }
    }

    async function handleAddLocation() {
        try {
            const newLoc = await adminLocations.insert({
                name: '',
                description: '',
                latitude: null,
                longitude: null,
                display_order: locations.length + 1,
            });

            const locToAdd = Array.isArray(newLoc) ? newLoc[0] : newLoc;

            setLocations(prev => [...prev, locToAdd]);

            // 👉 Show the map immediately for this new location
            setLocationToSetCoords(locToAdd);

        } catch (e) {
            alert('Failed to add location: ' + e.message);
        }
    }




    const selectedLocationName =
        locations.find(loc => loc.id === selectedLocationId)?.name || '(none selected)';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            <LocationEditor
                locations={locations}
                setLocations={setLocations}
                onDelete={handleDeleteLocation}
                onReorder={handleReorderLocations}
                updateLocationField={updateLocationField}
                onSetCoordinates={handleSetCoordinates}
                onAddLocation={handleAddLocation}
            />

            <div className="mb-6 mt-10">
                <label htmlFor="location-select" className="block mb-2 font-semibold">
                    Select Location for Hints:
                </label>
                <select
                    id="location-select"
                    value={selectedLocationId || ''}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="input-field"
                >
                    {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                            {loc.name}
                        </option>
                    ))}
                </select>
            </div>

            {Array.isArray(hints) && (
                <HintEditor
                    hints={hints}
                    updateHintText={updateHintText}
                    saveHint={saveHint}
                    deleteHint={deleteHint}
                    addHint={addHint}
                    onReorderHints={async (newList) => {
                        setHints(newList);
                        await Promise.all(
                            newList.map((hint, index) =>
                                adminHints.update(hint.id, { hint_order: index + 1 })
                            )
                        );
                    }}
                />
            )}

            <QuestionEditor
                questions={questions}
                updateQuestionText={updateQuestionText}
                toggleCorrectAnswer={toggleCorrectAnswer}
                saveQuestion={saveQuestion}
                deleteQuestion={deleteQuestion}
                addQuestion={addQuestion}
                updateAnswerText={updateAnswerText}
                saveAnswer={saveAnswer}
                deleteAnswer={deleteAnswer}
                addAnswer={addAnswer}
            />
            {locationToSetCoords && (
                <MapCoordinatePicker
                    initialPosition={
                        locationToSetCoords.latitude && locationToSetCoords.longitude
                            ? [locationToSetCoords.latitude, locationToSetCoords.longitude]
                            : null
                    }
                    onCancel={() => setLocationToSetCoords(null)}
                    onSave={handleSaveCoordinates}
                />
            )}

        </div>
    );
}
