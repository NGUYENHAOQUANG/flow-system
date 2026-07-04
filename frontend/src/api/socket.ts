import { io } from 'socket.io-client';
import { useJobStore } from '../store/useJobStore';

export const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

export const setupSocketListeners = () => {
  socket.on('connect', () => {
    console.log('Connected to backend WebSocket');
  });

  socket.on('job:created', (job) => {
    useJobStore.getState().addJob(job);
  });

  socket.on('job:update_status', (data: { jobId: number; status: string; videoUrl?: string }) => {
    useJobStore.getState().updateJobStatus(data.jobId, data.status, data.videoUrl);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from backend');
  });
};
