<script setup lang="ts">
/**
 * 视频首帧缩略图
 * 仅用于列表预览，避免在消息列表中直接挂载 video 元素影响渲染性能。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  src: string
}>()

const thumbnailUrl = ref<string | null>(null)
const isLoading = ref(false)
const hasError = ref(false)
const videoSize = ref<{ width: number; height: number } | null>(null)

let activeVideo: HTMLVideoElement | null = null
const MAX_PREVIEW_WIDTH = 192
const MAX_PREVIEW_HEIGHT = 192
const MIN_PREVIEW_WIDTH = 120
const MIN_PREVIEW_HEIGHT = 88

function cleanupVideo() {
  if (!activeVideo) return
  activeVideo.src = ''
  activeVideo.load()
  activeVideo = null
}

function captureFrame(video: HTMLVideoElement) {
  try {
    if (!video.videoWidth || !video.videoHeight) {
      // 仅表示缩略图提取失败，不代表视频资源不可播放。
      isLoading.value = false
      cleanupVideo()
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')

    if (!context) {
      // canvas 不可用时保留播放能力，只放弃缩略图。
      isLoading.value = false
      cleanupVideo()
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    thumbnailUrl.value = canvas.toDataURL('image/jpeg', 0.82)
    videoSize.value = {
      width: video.videoWidth,
      height: video.videoHeight,
    }
    hasError.value = false
    isLoading.value = false
  } catch {
    // 抓帧失败不等于视频文件不存在，仍保留播放按钮。
    isLoading.value = false
    cleanupVideo()
  }
  cleanupVideo()
}

function loadThumbnail(src: string) {
  cleanupVideo()
  thumbnailUrl.value = null
  hasError.value = false
  isLoading.value = true
  videoSize.value = null

  const video = document.createElement('video')
  activeVideo = video
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  video.addEventListener(
    'loadedmetadata',
    () => {
      // 主动 seek 到极小时间点，确保拿到可绘制的视频帧。
      const targetTime = video.duration && Number.isFinite(video.duration) ? Math.min(0.05, video.duration / 2) : 0.05
      try {
        video.currentTime = targetTime
      } catch {
        captureFrame(video)
      }
    },
    { once: true }
  )

  video.addEventListener(
    'seeked',
    () => {
      captureFrame(video)
    },
    { once: true }
  )

  video.addEventListener(
    'error',
    () => {
      hasError.value = true
      isLoading.value = false
      cleanupVideo()
    },
    { once: true }
  )

  video.src = src
  video.load()
}

const previewStyle = computed(() => {
  const size = videoSize.value
  if (!size) {
    return {
      width: `${MAX_PREVIEW_WIDTH}px`,
      height: `${Math.round(MAX_PREVIEW_WIDTH * 0.75)}px`,
    }
  }

  const scale = Math.min(MAX_PREVIEW_WIDTH / size.width, MAX_PREVIEW_HEIGHT / size.height, 1)
  const width = Math.max(Math.round(size.width * scale), MIN_PREVIEW_WIDTH)
  const height = Math.max(Math.round(size.height * scale), MIN_PREVIEW_HEIGHT)

  return {
    width: `${width}px`,
    height: `${height}px`,
  }
})

watch(
  () => props.src,
  (src) => {
    if (!src) return
    loadThumbnail(src)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cleanupVideo()
})
</script>

<template>
  <div class="relative overflow-hidden rounded-lg bg-gray-900 text-white" :style="previewStyle">
    <img v-if="thumbnailUrl" :src="thumbnailUrl" alt="视频预览" class="absolute inset-0 h-full w-full object-cover" />
    <div
      v-else
      class="absolute inset-0 flex h-full w-full items-center justify-center bg-linear-to-br from-gray-800 via-gray-900 to-black"
    >
      <div class="text-center text-white/80">
        <UIcon
          :name="hasError ? 'i-heroicons-film' : 'i-heroicons-arrow-path'"
          class="mx-auto h-7 w-7"
          :class="isLoading ? 'animate-spin' : ''"
        />
        <p v-if="hasError" class="mt-2 text-xs">视频不可用</p>
      </div>
    </div>
  </div>
</template>
