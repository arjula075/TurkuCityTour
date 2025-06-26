import React, { useEffect, useState } from 'react';
import { adminUsers, storage, adminImages } from '../../services/supabaseService';
import { createImageWithThumbnail } from '../../utils/imageHandling';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    // images per user, { [userId]: [{ id, image_path, signedUrl }, ...] }
    const [userImages, setUserImages] = useState({});

    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await adminUsers.fetchAll();
                const sorted = [...data].sort((a, b) => a.last_name.localeCompare(b.last_name));
                setUsers(sorted);
            } catch (e) {
                alert('Failed to load users: ' + e.message);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    // Load images for a user when expanding
    async function loadUserImages(userId) {
        try {
            const images = await adminImages.fetchByUserId(userId); // fetch DB rows: id, image_path, etc.
            // For each image, get signed url for preview
            const imagesWithUrls = await Promise.all(
                images.map(async (img) => {
                    const signedUrl = await storage.getSignedUrl(img.thumb_path, 300); // 5 min expiry
                    return { ...img, signedUrl };
                })
            );
            setUserImages(prev => ({ ...prev, [userId]: imagesWithUrls }));
        } catch (e) {
            alert('Failed to load images: ' + e.message);
        }
    }

    const toggleExpand = (id) => {
        if (expandedUserId === id) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(id);
            // load images for this user if not already loaded
            if (!userImages[id]) loadUserImages(id);
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

    // Upload image for user
    const handleImageUpload = async (userId, event) => {
        const file = event.target.files[0];
        if (!file) return;

        const now = Date.now();

        const fileName = `${now}_${file.name}`;
        const thumbFileName = `thumb_${fileName}`;

        const filePath = `${userId}/${fileName}`;
        const thumbPath = `${userId}/${thumbFileName}`;

        try {
            // upload to storage
            const { originalFile, thumbnailFile, fileType } = await createImageWithThumbnail(file);

            // Upload both files
            await storage.uploadFile(filePath, originalFile);
            await storage.uploadFile(thumbPath, thumbnailFile);


            // insert metadata into DB via adminImages service
            await adminImages.insert({
                user_id: userId,
                file_path: filePath,
                file_name: fileName,
                thumb_path: thumbPath,
                is_profile_pic: false,
                content_type: fileType,});

            // reload images list for user
            await loadUserImages(userId);

            // clear file input
            event.target.value = null;
        } catch (e) {
            alert('Failed to upload image: ' + e.message);
        }
    };

    // Delete image
    const handleImageDelete = async (userId, imageId, imagePath) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await adminImages.delete(imageId, imagePath);
            // reload images
            await loadUserImages(userId);
        } catch (e) {
            alert('Failed to delete image: ' + e.message);
        }
    };

    const handleProfileToggle = async (userId, imageId, currentValue) => {
        try {
            let blIsProfile = false;
            if (!currentValue) {
                blIsProfile = true;
            }
            await adminImages.update({ id: imageId }, { is_profile_pic: blIsProfile });
            await loadUserImages(userId); // reload after update
        } catch (e) {
            alert('Failed to update profile image: ' + e.message);
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

        // Reload image list once all uploads are done
        await loadUserImages(userId);

        // Clear input
        event.target.value = null;
    };


    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner mt-12">
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className="border border-gray-300 rounded overflow-hidden bg-white"
                        >
                            <button
                                onClick={() => toggleExpand(user.id)}
                                className="w-full text-left p-4 bg-gray-300 hover:bg-gray-400 focus:outline-none"
                            >
                                <div className="font-medium">
                                    {user.last_name}, {user.first_name}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                            </button>
                            {expandedUserId === user.id && (
                                <div className="p-4 border-t border-gray-300 text-sm text-gray-700 space-y-4">
                                    {/* User fields editable form */}
                                    {Object.entries(user).map(([key, value]) => {
                                        if (key === 'id') {
                                            return (
                                                <div key={key} className="grid grid-cols-[150px_1fr] gap-2 items-center">
                                                    <label className="font-semibold">{key}</label>
                                                    <span>{value}</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={key}
                                                className="grid grid-cols-[150px_1fr] gap-2 items-center"
                                            >
                                                <label className="font-semibold capitalize" htmlFor={`${user.id}-${key}`}>
                                                    {key.replace('_', ' ')}
                                                </label>

                                                {key === 'is_admin' ? (
                                                    <input
                                                        id={`${user.id}-${key}`}
                                                        className="input-admin h-4 w-4"
                                                        type="checkbox"
                                                        checked={!!value}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.checked)
                                                        }
                                                    />
                                                ) : key === 'message' ? (
                                                    <textarea
                                                        id={`${user.id}-${key}`}
                                                        className="input-admin"
                                                        rows={3}
                                                        value={value ?? ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(user.id, key, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    <input
                                                        id={`${user.id}-${key}`}
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

                                    {/* User images section */}
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
                                                            onChange={() => handleProfileToggle(user.id, img.id, img.is_profile_pic)}
                                                            title="Set as profile picture"
                                                        />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <p>one file</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(user.id, e)}
                                            className="border p-1 rounded"
                                        />
                                        <p>directory</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            webkitdirectory="true"
                                            onChange={(e) => handleFolderUpload(user.id, e)}
                                            className="border p-1 rounded"
                                        />
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
