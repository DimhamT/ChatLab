<script setup lang="ts">
/**
 * 语音波形消息
 * 使用轻量级自定义播放器，模拟即时通讯语音消息的展示方式。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const voiceWaveformState = globalThis as typeof globalThis & {
  __chatlabActiveVoicePlayer?: HTMLAudioElement | null
  __chatlabVoiceWaveformCache?: Map<string, number[]>
}

const WAVE_BAR_COUNT = 28
const FALLBACK_BAR_MIN = 28
const FALLBACK_BAR_RANGE = 60

const props = withDefaults(
  defineProps<{
    src: string
    isOwner?: boolean
  }>(),
  {
    isOwner: false,
  }
)

function getSharedActivePlayer() {
  return voiceWaveformState.__chatlabActiveVoicePlayer || null
}

function setSharedActivePlayer(player: HTMLAudioElement | null) {
  voiceWaveformState.__chatlabActiveVoicePlayer = player
}

const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const hasError = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const waveformHeights = ref<number[] | null>(null)
let waveformTaskId = 0

function buildFallbackWaveform(seedSource: string) {
  const seed = seedSource.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
    const value = (seed + index * 17 + (index % 5) * 13) % 100
    return FALLBACK_BAR_MIN + (value % FALLBACK_BAR_RANGE)
  })
}

function getWaveformCache() {
  if (!voiceWaveformState.__chatlabVoiceWaveformCache) {
    voiceWaveformState.__chatlabVoiceWaveformCache = new Map()
  }
  return voiceWaveformState.__chatlabVoiceWaveformCache
}

const barHeights = computed(() => {
  if (waveformHeights.value?.length) return waveformHeights.value

  const cached = getWaveformCache().get(props.src)
  if (cached?.length) return cached

  return buildFallbackWaveform(props.src)
})

const progressRatio = computed(() => {
  if (!duration.value) return 0
  return Math.min(currentTime.value / duration.value, 1)
})

const durationText = computed(() => formatSeconds(duration.value))
const currentTimeText = computed(() => formatSeconds(currentTime.value))
const buttonIcon = computed(() => {
  if (hasError.value) return 'i-heroicons-exclamation-triangle'
  if (isLoading.value) return 'i-heroicons-arrow-path'
  return isPlaying.value ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'
})

function formatSeconds(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00'
  const rounded = Math.round(value)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function syncTime() {
  if (!audio.value) return
  currentTime.value = audio.value.currentTime || 0
}

async function generateWaveform(src: string) {
  const taskId = ++waveformTaskId
  const cache = getWaveformCache()
  const cached = cache.get(src)
  if (cached?.length) {
    if (taskId === waveformTaskId && src === props.src) {
      waveformHeights.value = cached
    }
    return
  }

  try {
    const response = await fetch(src)
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const audioContext = new AudioContext()

    try {
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
      const channelData = decodedBuffer.getChannelData(0)
      const samplesPerBar = Math.max(Math.floor(channelData.length / WAVE_BAR_COUNT), 1)

      const heights = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
        const start = index * samplesPerBar
        const end =
          index === WAVE_BAR_COUNT - 1 ? channelData.length : Math.min(start + samplesPerBar, channelData.length)

        let peak = 0
        for (let cursor = start; cursor < end; cursor++) {
          const amplitude = Math.abs(channelData[cursor] || 0)
          if (amplitude > peak) peak = amplitude
        }

        return 24 + Math.round(peak * 76)
      })

      cache.set(src, heights)
      if (taskId === waveformTaskId && src === props.src) {
        waveformHeights.value = heights
      }
    } finally {
      await audioContext.close()
    }
  } catch (error) {
    console.warn('[VoiceWaveform] Failed to generate real waveform, fallback applied:', error)
    const fallback = buildFallbackWaveform(src)
    getWaveformCache().set(src, fallback)
    if (taskId === waveformTaskId && src === props.src) {
      waveformHeights.value = fallback
    }
  }
}

function bindAudioEvents(instance: HTMLAudioElement) {
  instance.preload = 'metadata'

  instance.addEventListener('loadedmetadata', () => {
    duration.value = Number.isFinite(instance.duration) ? instance.duration : 0
    isLoading.value = false
  })

  instance.addEventListener('durationchange', () => {
    duration.value = Number.isFinite(instance.duration) ? instance.duration : duration.value
  })

  instance.addEventListener('timeupdate', syncTime)

  instance.addEventListener('play', () => {
    const activePlayer = getSharedActivePlayer()
    if (activePlayer && activePlayer !== instance) {
      activePlayer.pause()
    }
    setSharedActivePlayer(instance)
    isPlaying.value = true
    isLoading.value = false
    hasError.value = false
  })

  instance.addEventListener('pause', () => {
    isPlaying.value = false
    if (getSharedActivePlayer() === instance) {
      setSharedActivePlayer(null)
    }
  })

  instance.addEventListener('ended', () => {
    isPlaying.value = false
    currentTime.value = 0
    instance.currentTime = 0
    if (getSharedActivePlayer() === instance) {
      setSharedActivePlayer(null)
    }
  })

  instance.addEventListener('waiting', () => {
    isLoading.value = true
  })

  instance.addEventListener('canplay', () => {
    isLoading.value = false
  })

  instance.addEventListener('error', () => {
    hasError.value = true
    isLoading.value = false
    isPlaying.value = false
  })
}

function setupAudio(src: string) {
  cleanupAudio()
  if (!src) return

  const instance = new Audio(src)
  hasError.value = false
  isLoading.value = true
  duration.value = 0
  currentTime.value = 0
  audio.value = instance

  bindAudioEvents(instance)
  instance.load()
  void generateWaveform(src)
}

function cleanupAudio() {
  waveformTaskId += 1
  if (!audio.value) return

  audio.value.pause()
  audio.value.src = ''
  audio.value.load()

  if (getSharedActivePlayer() === audio.value) {
    setSharedActivePlayer(null)
  }

  audio.value = null
  isPlaying.value = false
  isLoading.value = false
  waveformHeights.value = null
}

async function togglePlayback() {
  if (!audio.value || hasError.value) return

  if (isPlaying.value) {
    audio.value.pause()
    return
  }

  try {
    isLoading.value = true
    await audio.value.play()
  } catch {
    hasError.value = true
    isLoading.value = false
  }
}

watch(
  () => props.src,
  (src) => {
    setupAudio(src)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cleanupAudio()
})
</script>

<template>
  <button
    type="button"
    class="flex w-[min(18rem,70vw)] items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors"
    :class="
      isOwner
        ? 'bg-emerald-100 hover:bg-emerald-200/90 dark:bg-emerald-900/35 dark:hover:bg-emerald-900/50'
        : 'bg-gray-100 hover:bg-gray-200/90 dark:bg-gray-800/85 dark:hover:bg-gray-700/90'
    "
    @click.stop.prevent="togglePlayback"
  >
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      :class="
        isOwner
          ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-gray-950'
          : 'bg-pink-500 text-white dark:bg-pink-400 dark:text-gray-950'
      "
    >
      <UIcon
        :name="buttonIcon"
        class="h-4 w-4"
        :class="[isLoading ? 'animate-spin' : '', !isLoading && !isPlaying && !hasError ? 'translate-x-[1px]' : '']"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex h-9 items-end gap-[3px]">
        <span
          v-for="(height, index) in barHeights"
          :key="index"
          class="w-1 shrink-0 rounded-full transition-colors"
          :class="
            (index + 1) / barHeights.length <= progressRatio
              ? isOwner
                ? 'bg-emerald-600 dark:bg-emerald-300'
                : 'bg-pink-500 dark:bg-pink-300'
              : 'bg-gray-300 dark:bg-gray-500/70'
          "
          :style="{ height: `${height}%` }"
        />
      </div>

      <div
        class="mt-1 flex items-center justify-between text-[11px]"
        :class="isOwner ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-500 dark:text-gray-300'"
      >
        <span>{{ hasError ? '语音不可用' : isPlaying ? currentTimeText : '点击播放' }}</span>
        <span>{{ durationText }}</span>
      </div>
    </div>
  </button>
</template>
