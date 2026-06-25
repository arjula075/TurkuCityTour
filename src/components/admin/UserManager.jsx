import React, { useEffect, useState } from 'react';
import {
    adminUsers,
    storage,
    adminImages,
    clearAllUserProgress,
    gameAssignments
} from '../../services/supabaseService';
import { createImageWithThumbnail } from '../../utils/imageHandling';
import { extractThumbnail } from '../../utils/thumbnailExtractor';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState([]);
    const [userGameMap, setUserGameMap] = useState({});
    const [userImages, setUserImages] = useState({});

    useEffect(() => {
        async function loadData() {
            try {
                const [userList, gameList] = await Promise.all([
                    adminUsers.fetchAll(),
                    gameAssignments.fetchGames()
                ]);

                const sortedUsers = [...userList].sort((a, b) => a.last_name.localeCompare(b.last_name));
                setUsers(sortedUsers);
                setGames(gameList);

                const map = {};
                await Promise.all(
                    sortedUsers.map(async (user) => {
                        const assigned = await gameAssignments.fetchByUser(user.id);
                        map[user.id] = assigned;
                    })
                );
                setUserGameMap(map);
            } catch (e) {
                alert('Failed to load data: ' + e.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const toggleExpand = (id) => {
        if (expandedUserId === id) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(id);
            if (!userImages[id]) loadUserImages(id);
        }
    };

    const loadUserImages = async (userId) => {
        try {
            const images = await adminImages.fetchByUserId(userId);
            const imagesWithUrls = await Promise.all(
                images.map(async (img) => {
                    const signedThumb = img.thumb_path
                        ? await storage.getSignedUrl(img.thumb_path, 300)
                        : null;

                    const signedFull = await storage.getSignedUrl(img.file_path, 600);

                    return {
                        ...img,
                        signedUrl: signedThumb, // for images
                        fullUrl: signedFull,     // always used (e.g. for video or fallback)
                    };
                })
            );

            setUserImages(prev => ({ ...prev, [userId]: imagesWithUrls }));
        } catch (e) {
            alert('Failed to load images: ' + e.message);
        }
    };


    const handleFieldChange = async (userId, field, newValue) => {
        setUsers(prev =>
            prev.map(user =>
                user.id === userId ? { ...user, [field]: newValue } : user
            )
        );
        try {
            await adminUsers.update(userId, { [field]: newValue });
        } catch (e) {
            alert(`Failed to update ${field}: ` + e.message);
        }
    };

    const handleMediaUpload = async (userId, event) => {
        console.log(event.target.files);
        const file = event.target.files[0];
        if (!file) return;

        const now = Date.now();
        const fileName = `${now}_${file.name}`;
        const filePath = `${userId}/${fileName}`;

        try {
            const fileType = file.type;
            console.log(fileType);

            if (fileType.startsWith("image/")) {
                // image logic (unchanged)
                const { originalFile, thumbnailFile } = await createImageWithThumbnail(file);
                await storage.uploadFile(filePath, originalFile);
                await storage.uploadFile(`${userId}/thumb_${fileName}`, thumbnailFile);
            } else if (fileType.startsWith("video/")) {
                // upload video as-is, no thumbnail
                const thumbnailFile = await extractThumbnail(file);
                const thumbFileName = `thumb_${fileName}`;
                const thumbPath = `${userId}/${thumbFileName}`;
                await storage.uploadFile(filePath, file);
                await storage.uploadFile(thumbPath, thumbnailFile);
            } else {
                alert("Unsupported file type.");
                return;
            }

        await adminImages.insert({
            user_id: userId,
            file_path: filePath,
            file_name: fileName,
            thumb_path: `${userId}/thumb_${fileName}`,
            is_profile_pic: false,
            content_type: fileType,
        });


            await loadUserImages(userId);
            event.target.value = null;
        } catch (e) {
            alert("Failed to upload media: " + e.message);
        }
    };


    const handleFolderUpload = async (userId, event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        for (const file of files) {
            try {
                const now = Date.now();
                const fileName = `${now}_${file.name}`;
                const thumbFileName = `thumb_${fileName}`;
                const filePath = `${userId}/${fileName}`;
                const thumbPath = `${userId}/${thumbFileName}`;
                const { originalFile, thumbnailFile, fileType } = await createImageWithThumbnail(file);

                await storage.uploadFile(filePath, originalFile);
                await storage.uploadFile(thumbPath, thumbnailFile);

                await adminImages.insert({
                    user_id: userId,
                    file_path: filePath,
                    file_name: fileName,
                    thumb_path: thumbPath,
                    is_profile_pic: false,
                    content_type: fileType,
                });
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
            }
        }
        await loadUserImages(userId);
        event.target.value = null;
    };

    const handleImageDelete = async (userId, imageId, imagePath) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await adminImages.delete(imageId, imagePath);
            await loadUserImages(userId);
        } catch (e) {
            alert('Failed to delete image: ' + e.message);
        }
    };

    const handleProfileToggle = async (userId, imageId, currentValue) => {
        try {
            const blIsProfile = !currentValue;
            await adminImages.update({ id: imageId }, { is_profile_pic: blIsProfile });
            await loadUserImages(userId);
        } catch (e) {
            alert('Failed to update profile image: ' + e.message);
        }
    };

    const toggleGameAssignment = async (userId, gameId) => {
        const isAssigned = userGameMap[userId]?.includes(gameId);
        try {
            if (isAssigned) {
                await gameAssignments.unassign(userId, gameId);
                setUserGameMap(prev => ({
                    ...prev,
                    [userId]: prev[userId].filter(id => id !== gameId)
                }));
            } else {
                await gameAssignments.assign(userId, gameId);
                setUserGameMap(prev => ({
                    ...prev,
                    [userId]: [...(prev[userId] || []), gameId]
                }));
            }
        } catch (e) {
            alert('Failed to update game assignment: ' + e.message);
        }
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner mt-12">
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="border border-gray-300 rounded bg-white overflow-hidden">
                            <button
                                onClick={() => toggleExpand(user.id)}
                                className="w-full text-left p-4 bg-gray-300 hover:bg-gray-400 focus:outline-none"
                            >
                                <div className="font-medium">{user.last_name}, {user.first_name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                            </button>

                            {expandedUserId === user.id && (
                                <div className="p-4 border-t space-y-4 text-sm text-gray-700">
                                    {Object.entries(user).map(([key, value]) => {
                                        if (key === 'id') return (
                                            <div key={key} className="grid grid-cols-[150px_1fr] gap-2 items-center">
                                                <label className="font-semibold">{key}</label>
                                                <span>{value}</span>
                                            </div>
                                        );

                                        return (
                                            <div key={key} className="grid grid-cols-[150px_1fr] gap-2 items-center">
                                                <label className="font-semibold capitalize">{key.replace('_', ' ')}</label>
                                                {key === 'is_platform_admin' ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={!!value}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.checked)
                                                        }
                                                    />
                                                ) : key === 'message' ? (
                                                    <textarea
                                                        className="input-admin"
                                                        rows={3}
                                                        value={value ?? ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    <input
                                                        className="input-admin"
                                                        type="text"
                                                        value={value ?? ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.value)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div>
                                        <h3 className="font-semibold mb-2">Assigned Games</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {games.map((game) => {
                                                const assigned = userGameMap[user.id]?.includes(game.id);
                                                return (
                                                    <button
                                                        key={game.id}
                                                        onClick={() => toggleGameAssignment(user.id, game.id)}
                                                        className={`px-3 py-1 rounded text-xs border ${
                                                            assigned
                                                                ? 'bg-green-100 border-green-500 text-green-800'
                                                                : 'bg-gray-100 border-gray-400 text-gray-700'
                                                        }`}
                                                    >
                                                        {game.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Images</h3>
                                        <div className="flex flex-wrap gap-3 mb-2">
                                            {(userImages[user.id] || []).map(img => (
                                                <div key={img.id} className="relative inline-block">
                                                    <img
                                                        src={img.signedUrl}
                                                        alt="User upload"
                                                        className="w-24 h-24 object-cover rounded border"
                                                    />
                                                    <button
                                                        onClick={() => handleImageDelete(user.id, img.id, img.image_path)}
                                                        className="absolute top-0 right-0 bg-orange-200 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-orange-300"
                                                        title="Delete image"
                                                        type="button"
                                                    >
                                                        &times;
                                                    </button>
                                                    <label className="absolute bottom-0 right-0 bg-white p-1 rounded-tl shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!img.is_profile_pic}
                                                            onChange={() =>
                                                                handleProfileToggle(user.id, img.id, img.is_profile_pic)
                                                            }
                                                            title="Set as profile picture"
                                                        />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4 mt-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Upload a single image</label>
                                                <label className="inline-block btn-pill-sm bg-slate-600 text-white cursor-pointer px-4 py-2">
                                                    Choose File
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleMediaUpload(user.id, e)}
                                                    />
                                                </label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Upload a folder of images</label>
                                                <label className="inline-block btn-pill-sm bg-slate-600 text-white cursor-pointer px-4 py-2">
                                                    Choose Folder
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        webkitdirectory="true"
                                                        className="hidden"
                                                        onChange={(e) => handleFolderUpload(user.id, e)}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <button
                                                className="btn-pill-sm"
                                                onClick={async () => {
                                                    if (window.confirm(`Clear progress for ${user.first_name} ${user.last_name}?`)) {
                                                        try {
                                                            await clearAllUserProgress(user.id);
                                                            alert('User progress cleared.');
                                                        } catch (e) {
                                                            alert('Failed to clear progress: ' + e.message);
                                                        }
                                                    }
                                                }}
                                            >
                                                Clear Game Progress
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
