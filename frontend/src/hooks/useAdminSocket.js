// src/hooks/useAdminSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useAdminSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.tenant_id && user?.role !== 'super_admin') return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join tenant room so backend can target this admin
      if (user.tenant_id) {
        socket.emit('join_tenant', user.tenant_id);
      }
    });

    socket.on('new_booking', (data) => {
      toast.success(
        `🔔 नवीन बुकिंग! ${data.pooja_name} — #${data.booking_code}`,
        { duration: 8000, icon: '🪔' }
      );
    });

    return () => socket.disconnect();
  }, [user?.id]);
}
