import { type Ref, ref, onMounted, onUnmounted } from 'vue';

/**
 * useVideoManager — Composable quản lý video phát trong VideoCard
 *
 * Tính năng:
 * 1. Lazy src loading: Chỉ gán src khi card sắp vào viewport (rootMargin 200px)
 *    → Tránh 20+ HTTP requests đồng thời khi trang load
 * 2. Auto-pause khi cuộn ra khỏi viewport (IntersectionObserver)
 *    → Tránh video chạy ngầm ngoài màn hình
 * 3. Chỉ 1 video phát tại một thời điểm (module-level singleton)
 *    → Không bị nhiều video cùng phát khi hover nhanh
 * 4. Cleanup observer khi unmount → không rò rỉ bộ nhớ
 */

// Singleton: lưu ref đến video element đang phát cuối cùng
let lastPlayingVideo: HTMLVideoElement | null = null;

export function useVideoManager(
  videoRef: Ref<HTMLVideoElement | null>,
  containerRef: Ref<HTMLElement | null>,
  src: string
) {
  let lazyObserver: IntersectionObserver | null = null;
  let playbackObserver: IntersectionObserver | null = null;

  // src ban đầu rỗng — chỉ gán khi card vào viewport
  const lazySrc = ref('');

  onMounted(() => {
    // --- Observer 1: Lazy src loading ---
    // Gán src khi card còn cách viewport 200px (pre-load sớm)
    // Chỉ fire 1 lần rồi disconnect để không tốn tài nguyên
    if (containerRef.value && src) {
      lazyObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              lazySrc.value = src;
              lazyObserver?.disconnect();
              lazyObserver = null;
              break;
            }
          }
        },
        {
          // Asymmetric rootMargin: chỉ mở rộng phía DƯỚI viewport 1500px
          // → Khi trang mount, các card trong 1500px tiếp theo được gán src ngay lập tức
          // → Người dùng scroll xuống hầu như không thấy skeleton
          // → Không lãng phí băng thông cho nội dung phía trên (đã xem qua)
          rootMargin: '0px 0px 3000px 0px',
          threshold: 0,
        }
      );
      lazyObserver.observe(containerRef.value);
    }

    // --- Observer 2: Auto-pause khi cuộn ra ngoài viewport ---
    if (videoRef.value) {
      playbackObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting && videoRef.value && !videoRef.value.paused) {
              videoRef.value.pause();
              if (lastPlayingVideo === videoRef.value) {
                lastPlayingVideo = null;
              }
            }
          }
        },
        { threshold: 0.1 }
      );
      playbackObserver.observe(videoRef.value);
    }
  });

  onUnmounted(() => {
    // Cleanup để tránh memory leak
    if (lazyObserver) {
      lazyObserver.disconnect();
      lazyObserver = null;
    }
    if (playbackObserver && videoRef.value) {
      playbackObserver.unobserve(videoRef.value);
      playbackObserver.disconnect();
    }
    playbackObserver = null;
    if (lastPlayingVideo === videoRef.value) {
      lastPlayingVideo = null;
    }
  });

  const handleMouseEnter = () => {
    if (!videoRef.value || !lazySrc.value) return;

    // Pause video đang phát trước (nếu có và khác video hiện tại)
    if (lastPlayingVideo && lastPlayingVideo !== videoRef.value) {
      lastPlayingVideo.pause();
    }

    videoRef.value.play().catch(() => {
      // Bỏ qua lỗi AbortError thường xảy ra khi play bị interrupt bởi scroll
    });
    lastPlayingVideo = videoRef.value;
  };

  const handleMouseLeave = () => {
    if (!videoRef.value) return;
    videoRef.value.pause();
    if (lastPlayingVideo === videoRef.value) {
      lastPlayingVideo = null;
    }
  };

  return { lazySrc, handleMouseEnter, handleMouseLeave };
}
