import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export const useComplaintNotifications = () => {
    const [lastChecked, setLastChecked] = useState(localStorage.getItem('lastComplaintCheck') || new Date().toISOString());

    const { data: complaints = [] } = useQuery({
        queryKey: ['nilai-complaints'],
        queryFn: async () => {
            const { data } = await api.get('/api-v1/nilai-complaints');
            return data.data;
        },
        refetchInterval: 30000, // Check every 30 seconds
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        const newResponses = complaints.filter(
            (complaint) => complaint.status !== 'pending' && 
                          new Date(complaint.updated_at) > new Date(lastChecked) &&
                          complaint.notes
        );

        if (newResponses.length > 0) {
            newResponses.forEach((complaint) => {
                toast.success(`Asisten merespons komplain Anda untuk ${complaint.nilai?.modul?.judul}`, {
                    icon: '💬',
                    duration: 5000,
                });
            });

            localStorage.setItem('lastComplaintCheck', new Date().toISOString());
            setLastChecked(new Date().toISOString());
        }
    }, [complaints, lastChecked]);

    return {
        complaints,
        unreadCount: complaints.filter((c) => c.status !== 'pending' && c.notes).length,
    };
};