import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchUserProfile, adminImages, storage, clearUserProgress } from '../services/supabaseService';
import { Carousel } from 'react-responsive-3d-carousel';
import 'react-responsive-3d-carousel/dist/styles.css';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';


export default function GameComplete() {
    const { user } = useAuthContext();
    const [message, setMessage] = useState('');
    const [images, setImages] = useState([]);
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideoSrc, setCurrentVideoSrc] = useState(null);


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
                        imgMeta.map(img => storage.getSignedUrl(img.file_path, 600))
                    );

                    const imgObjects = await Promise.all(
                        imgMeta.map(async (img) => {
                            const isVideo = img.content_type?.startsWith('video/');

                            const fileUrl = img.file_path
                                ? await storage.getSignedUrl(img.file_path, 600)
                                : null;

                            const thumbUrl = img.thumb_path
                                ? await storage.getSignedUrl(img.thumb_path)
                                : null;

                            return {
                                type: isVideo ? 'video' : 'image',
                                src: fileUrl,
                                thumb: thumbUrl,
                                poster: isVideo ? thumbUrl : undefined,
                                isProfile: img.is_profile_pic,
                                originalFileName: img.file_name,
                            };
                        })
                    );

                    const filteredImages = imgObjects.filter(img => img.src);
                    setImages(filteredImages);

                    const profileImage = imgObjects.find(img => img.isProfile);
                    if (profileImage) {
                        setProfilePic(profileImage.thumb);
                    }
                }
            } catch (err) {
                console.error('Error loading GameComplete:', err.message);
            } finally {
                setLoading(false); // Hide loader once everything is done
            }
        }

        loadData();
    }, [user]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
            </div>
        );
    }
    else {


        return (
            <div className="flex flex-col min-h-[100dvh] relative pb-[320px]"> {/* Extra bottom space */}
                {/* Top: Profile + Header */}
                <div className="flex flex-col items-center p-4">
                    {profilePic && (
                        <img
                            src={profilePic}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover mb-2"
                        />
                    )}
                    <h1 className="text-5xl font-bold">🎉 Game Complete!</h1>
                </div>

                {/* Middle: Scrollable Message */}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[320px] text-center">
                    <p className="text-4xl whitespace-pre-line">{message}</p>
                </div>

                {/* Bottom: Fixed Footer */}
                <div className="fixed bottom-0 left-0 w-full bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-4 shadow-inner z-50">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            className="btn-pill2"
                            onClick={async () => {
                                if (user?.id) {
                                    await clearUserProgress(user.id);
                                    window.location.href = '/';
                                }
                            }}
                        >
                            Back to Start
                        </button>

                        {images.length > 0 && (
                            <>
                                <button
                                    className="btn-pill2"
                                    onClick={async () => {
                                        for (const img of images) {
                                            const response = await fetch(img.src);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);

                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = img.originalFileName || (img.type === 'video' ? 'video.mp4' : 'image.jpg');
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        }
                                    }}
                                >
                                    Download My Pictures
                                </button>

                                <PhotoProvider>
                                    <div className="w-full max-h-[260px] carousel-speed-fast">
                                        <Carousel
                                            items={images.map((media, i) =>
                                                media.type === 'image' ? (
                                                    <PhotoView key={i} src={media.src}>
                                                        <img
                                                            src={media.thumb}
                                                            alt={`User media ${i}`}
                                                            className="rounded-xl object-cover h-[260px] mx-auto cursor-pointer"
                                                        />
                                                    </PhotoView>
                                                ) : (
                                                    <img
                                                        key={i}
                                                        src={media.poster || media.thumb}
                                                        alt={`Video ${i}`}
                                                        className="rounded-xl object-cover h-[260px] mx-auto cursor-pointer"
                                                        onClick={() => {
                                                            setCurrentVideoSrc(media.src);
                                                            setShowVideoModal(true);
                                                        }}
                                                    />
                                                )
                                            )}
                                            swipeable
                                            swipeDirection="horizontal"
                                            autoPlay={false}
                                            containerHeight="100%"
                                        />
                                    </div>
                                </PhotoProvider>


                            </>
                        )}
                    </div>
                </div>
                {showVideoModal && currentVideoSrc && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                        <div className="relative w-full max-w-4xl">
                            <button
                                onClick={() => {
                                    setShowVideoModal(false);
                                    setCurrentVideoSrc(null);
                                }}
                                className="absolute top-4 right-4 text-white text-2xl z-10"
                            >
                                ✕
                            </button>
                            <video
                                src={currentVideoSrc}
                                controls
                                autoPlay
                                className="w-full h-auto max-h-[90vh] rounded-lg"
                            />
                        </div>
                    </div>
                )}

            </div>
        );

    }
}
