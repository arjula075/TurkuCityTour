import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <article className="page-safe-area min-h-screen-safe max-w-2xl mx-auto prose prose-slate">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

            <section className="space-y-4 text-gray-800">
                <h2 className="text-2xl font-semibold">Overview</h2>
                <p>
                    TurkuCityTour (&quot;we&quot;, &quot;the app&quot;) is a location-based city tour game.
                    This policy explains what data we collect, why we collect it, and how it is stored.
                </p>

                <h2 className="text-2xl font-semibold">Data we collect</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>
                        <strong>Account information</strong> — email address, first name, and last name
                        when you register.
                    </li>
                    <li>
                        <strong>Location data</strong> — GPS coordinates while you use the map to show
                        your position and detect arrival at tour stops (within about 50 metres). Location
                        is used only while the app is open; we do not track you in the background.
                    </li>
                    <li>
                        <strong>Game progress</strong> — hints used, answers submitted, scores, and
                        completion status for your assigned tours.
                    </li>
                    <li>
                        <strong>Photos and videos</strong> — optional media you upload for the end-of-game
                        gallery, stored in our cloud storage.
                    </li>
                    <li>
                        <strong>Technical logs</strong> — anonymised client events for troubleshooting
                        (e.g. errors, game state transitions).
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold">How we use your data</h2>
                <p>
                    Data is used solely to run the game: authenticate you, display the map, validate
                    that you reached a stop, record your answers, and show your completion gallery.
                    We do not sell your data or use it for advertising.
                </p>

                <h2 className="text-2xl font-semibold">Storage and processors</h2>
                <p>
                    Data is stored in <strong>Supabase</strong> (PostgreSQL database and object storage)
                    hosted in the EU. Map tiles are loaded from Thunderforest/OpenStreetMap. These
                    providers process requests according to their own privacy policies.
                </p>

                <h2 className="text-2xl font-semibold">Retention</h2>
                <p>
                    Account and progress data are kept while your account is active. Contact your tour
                    organiser or app administrator to request deletion.
                </p>

                <h2 className="text-2xl font-semibold">Your rights</h2>
                <p>
                    Under GDPR you may request access, correction, or deletion of your personal data.
                    Email your tour organiser or the address listed in the App Store / Play Store listing.
                </p>

                <h2 className="text-2xl font-semibold">Children</h2>
                <p>
                    The app is intended for players assigned to a tour by an organiser. Organisers are
                    responsible for obtaining parental consent where required.
                </p>

                <h2 className="text-2xl font-semibold">Contact</h2>
                <p>
                    Questions about this policy: use the contact email in the store listing or ask your
                    tour organiser.
                </p>
            </section>

            <p className="mt-10">
                <Link to="/" className="text-blue-600 hover:underline">
                    Back to login
                </Link>
            </p>
        </article>
    );
}
