import { supabase } from './supabaseClient';


const TABLE_NAME = 'images';

export const adminImages = {
    // fetch images metadata for one user
    fetchByUserId: async (userId) => {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // insert new image record (just metadata: user_id + image_path)
    insert: async ({ user_id, file_path, filename }) => {
        console.log('adminImages.insert called with:', { user_id, file_path });
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([{ user_id, file_path, filename }])
            .single();

        if (error) throw error;
        return data;
    },

    // delete image record by id
    // You can optionally delete the storage file here, or do it in your component
    delete: async (id, file_path) => {
        // 1. Delete the storage file
        if (file_path) {
            const { error: storageError } = await storage.deleteFile(file_path);
            if (storageError) throw storageError;
        }

        // 2. Delete DB row
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return data;
    },
};
