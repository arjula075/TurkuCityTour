import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchUserProfile, adminImages, storage } from '../services/supabaseService';
import { Carousel } from 'react-responsive-3d-carousel';
import 'react-responsive-3d-carousel/dist/styles.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function GameComplete() {
    const { user } = useAuthContext();
    const [message, setMessage] = useState('');
    const [images, setImages] = useState([]);
    const [profilePic, setProfilePic] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        async function loadData() {
            try {
                if (user?.id) {
                    const profile = await fetchUserProfile(user.id);
                    setMessage(profile?.message ?? 'Thanks for playing!');

                    const imgMeta = await adminImages.fetchByUserId(user.id);

                    const thumbSignedUrls = await Promise.all(
                        imgMeta.map(img => storage.getSignedUrl(img.thumb_path))
                    );
                    const fullSignedUrls = await Promise.all(
                        imgMeta.map(img => storage.getSignedUrl(img.file_path))
                    );

                    const imgObjects = imgMeta.map((img, i) => ({
                        thumb: thumbSignedUrls[i],
                        full: fullSignedUrls[i],
                        isProfile: img.is_profile_pic
                    }));

                    setImages(imgObjects);

                    const profileImage = imgObjects.find(img => img.isProfile);
                    if (profileImage) {
                        setProfilePic(profileImage.thumb);
                    }
                }
            } catch (err) {
                console.error('Error loading GameComplete:', err.message);
            }
        }

        loadData();
    }, [user]);

    const handleImageClick = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="p-4 text-center">
            {profilePic && (
                <img
                    src={profilePic}
                    alt="Profile"
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
            )}

            <h1 className="text-5xl font-bold mb-4">🎉 Game Complete!</h1>
            <p className="text-4xl mb-6 whitespace-pre-line">{message}</p>

            <button
                className="btn-pill2"
                onClick={() => window.location.href = '/'}
            >
                Back to Start
            </button>

            {images.length > 0 && (
                <div className="mb-6 h-[300px] mt-6">
                    <Carousel
                        items={images.map((img, i) => (
                            <img
                                key={i}
                                src={img.thumb}
                                alt={`User pic ${i}`}
                                className="rounded-xl object-cover h-[260px] mx-auto cursor-pointer"
                                onClick={() => handleImageClick(i)}
                            />
                        ))}
                        swipeable
                        swipeDirection="vertical"
                        autoPlay={false}
                        containerHeight="100%"
                    />
                </div>
            )}

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={images.map(img => ({ src: img.full }))}
                index={lightboxIndex}
            />
        </div>
    );
}
