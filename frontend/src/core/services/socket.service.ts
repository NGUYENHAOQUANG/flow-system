import { onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useJobStore } from '@/feature/jobs/store/useJobStore';
import type { Job } from '@/feature/jobs/types';

let socket: Socket | null = null;

export function useSocket() {
  const jobStore = useJobStore();

  const connect = () => {
    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL || '', {
        transports: ['websocket'],
      });
    }

    socket.on('connect', () => {
      console.log('Connected to backend WebSocket');
    });

    socket.on('job:created', (job: Job) => {
      jobStore.addJob(job);
    });

    socket.on('job:update_status', (data: { jobId: number; status: string; videoUrl?: string }) => {
      jobStore.updateJobStatus(data.jobId, data.status, data.videoUrl);
    });

    socket.on('job:file_uploaded', (data: { jobId: number; videoUrl: string }) => {
      jobStore.handleFileUploaded(data.jobId, data.videoUrl);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
    });
  };

  const disconnect = () => {
    if (socket) {
      socket.off('connect');
      socket.off('job:created');
      socket.off('job:update_status');
      socket.off('disconnect');
      socket.disconnect();
      socket = null;
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connect,
    disconnect,
  };
}
