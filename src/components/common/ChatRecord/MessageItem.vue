<script setup lang="ts">
/**
 * 单条消息展示组件 - 气泡样式
 * 支持 Owner 消息显示在右侧（类似聊天界面）
 * 支持图片、表情包等多媒体消息
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ChatRecordMessage } from './types'
import VideoThumbnail from './VideoThumbnail.vue'
import VoiceWaveform from './VoiceWaveform.vue'
import { useLayoutStore } from '@/stores/layout'
import { useSessionStore } from '@/stores/session'

const { t } = useI18n()

const props = defineProps<{
  /** 消息数据 */
  message: ChatRecordMessage
  /** 是否为目标消息（需要高亮） */
  isTarget?: boolean
  /** 高亮关键词 */
  highlightKeywords?: string[]
  /** 是否处于筛选模式（显示上下文按钮） */
  isFiltered?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-context', messageId: number): void
  (e: 'jump-to-reply', platformMessageId: string): void
}>()

const layoutStore = useLayoutStore()
const sessionStore = useSessionStore()

// 判断当前消息是否是 Owner 发送的
const isOwner = computed(() => {
  const ownerId = sessionStore.currentSession?.ownerId
  if (!ownerId) return false
  return props.message.senderPlatformId === ownerId
})

// 基于发送者名称生成一致的颜色索引
const colorIndex = computed(() => {
  const name = props.message.senderName || ''
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 16
})

// 现代优雅配色方案（16 种颜色）
// 参考 Linear, Notion 等现代产品的配色风格
const colorPalette = [
  { avatar: 'bg-rose-400 dark:bg-rose-500', name: 'text-rose-600 dark:text-rose-400' },
  { avatar: 'bg-pink-400 dark:bg-pink-500', name: 'text-pink-600 dark:text-pink-400' },
  { avatar: 'bg-fuchsia-400 dark:bg-fuchsia-500', name: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { avatar: 'bg-purple-400 dark:bg-purple-500', name: 'text-purple-600 dark:text-purple-400' },
  { avatar: 'bg-violet-400 dark:bg-violet-500', name: 'text-violet-600 dark:text-violet-400' },
  { avatar: 'bg-indigo-400 dark:bg-indigo-500', name: 'text-indigo-600 dark:text-indigo-400' },
  { avatar: 'bg-blue-400 dark:bg-blue-500', name: 'text-blue-600 dark:text-blue-400' },
  { avatar: 'bg-sky-400 dark:bg-sky-500', name: 'text-sky-600 dark:text-sky-400' },
  { avatar: 'bg-cyan-400 dark:bg-cyan-500', name: 'text-cyan-600 dark:text-cyan-400' },
  { avatar: 'bg-teal-400 dark:bg-teal-500', name: 'text-teal-600 dark:text-teal-400' },
  { avatar: 'bg-emerald-400 dark:bg-emerald-500', name: 'text-emerald-600 dark:text-emerald-400' },
  { avatar: 'bg-green-400 dark:bg-green-500', name: 'text-green-600 dark:text-green-400' },
  { avatar: 'bg-lime-500 dark:bg-lime-600', name: 'text-lime-600 dark:text-lime-400' },
  { avatar: 'bg-amber-400 dark:bg-amber-500', name: 'text-amber-600 dark:text-amber-400' },
  { avatar: 'bg-orange-400 dark:bg-orange-500', name: 'text-orange-600 dark:text-orange-400' },
  { avatar: 'bg-red-400 dark:bg-red-500', name: 'text-red-600 dark:text-red-400' },
]

const currentColor = computed(() => colorPalette[colorIndex.value])
const avatarColor = computed(() => currentColor.value.avatar)
const nameColor = computed(() => currentColor.value.name)

// 气泡颜色（Owner 使用绿色，其他人使用灰色；媒体消息使用透明背景）
const bubbleColor = computed(() => {
  if (isImage.value || isVoice.value || isVideo.value || isFile.value || isEmoji.value || isForward.value) return ''
  return isOwner.value ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-800'
})

// 显示名称（包含别名）
const displayName = computed(() => {
  const name = props.message.senderName || ''
  const aliases = props.message.senderAliases || []

  // 如果有别名，在名称后面括号显示第一个别名
  if (aliases.length > 0) {
    return `${name}（${aliases[0]}）`
  }
  return name
})

// 获取头像字符（支持 emoji）
const avatarLetter = computed(() => {
  const name = props.message.senderName || ''
  if (!name) return '?'

  // 使用 Intl.Segmenter 正确分割字符串（包括 emoji）
  // 对于不支持的浏览器，使用 spread operator 作为 fallback
  try {
    const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' })
    const segments = [...segmenter.segment(name)]
    if (segments.length > 0) {
      return segments[0].segment
    }
  } catch {
    // Fallback: 使用 spread operator 处理 emoji
    const chars = [...name]
    if (chars.length > 0) {
      const firstChar = chars[0]
      // 检查是否是字母或汉字，如果是则转大写
      if (/^[a-zA-Z]$/.test(firstChar)) {
        return firstChar.toUpperCase()
      }
      return firstChar
    }
  }

  return '?'
})

// 判断消息类型
const isImage = computed(() => props.message.type === 1)
const isVoice = computed(() => props.message.type === 2)
const isVideo = computed(() => props.message.type === 3)
const isFile = computed(() => props.message.type === 4)
const isEmoji = computed(() => props.message.type === 5)
const isReply = computed(() => props.message.type === 25)
const isForward = computed(() => props.message.type === 26)
const isSystemMessage = computed(() => props.message.type === 80)
const isRecall = computed(() => props.message.type === 81)
const isCall = computed(() => props.message.type === 23)

interface CallInfo {
  callType: 'video' | 'voice' | 'missed' | 'rejected' | 'unknown'
  label: string
  duration?: string
}

const callInfo = computed<CallInfo | null>(() => {
  if (!isCall.value) return null

  const rawContent = props.message.content || ''
  let items: string[] = []

  try {
    if (rawContent.startsWith('[')) {
      items = JSON.parse(rawContent)
    }
  } catch {
    items = [rawContent]
  }

  if (!items || items.length === 0) {
    return { callType: 'unknown', label: '通话' }
  }

  const first = items[0] || ''
  const duration = items[1]

  if (first === '视频通话' || first === '' || /^\d{1,2}:\d{2}:\d{2}$/.test(first)) {
    return { callType: 'video', label: '视频通话', duration: duration || first }
  }
  if (first === '语音通话') {
    return { callType: 'voice', label: '语音通话', duration }
  }
  if (first === '对方未接听') {
    return { callType: 'missed', label: '对方未接听' }
  }
  if (first === '对方已拒绝') {
    return { callType: 'rejected', label: '对方已拒绝' }
  }

  return { callType: 'unknown', label: first || '通话' }
})

const callDisplayContent = computed(() => {
  if (!callInfo.value) return ''
  if (callInfo.value.duration) {
    return callInfo.value.duration
  }
  return callInfo.value.label
})

function resolveAssetUrl(content: string | null | undefined): string | null {
  const rawContent = (content || '').trim()
  if (!rawContent) return null
  if (rawContent.startsWith('assets/') || rawContent.startsWith('/assets/')) {
    return 'asset://' + rawContent.replace(/^\/?assets\//, '')
  }
  return rawContent
}

// 获取图片URL
const imageUrl = computed(() => {
  if (!isImage.value) return null
  return resolveAssetUrl(props.message.content)
})

function resolveMarkedMediaUrl(content: string | null | undefined, marker: string): string | null {
  const rawContent = (content || '').trim()
  if (!rawContent) return null

  const normalized = rawContent.startsWith(marker) ? rawContent.slice(marker.length).trim() : rawContent
  if (!normalized || /^\[[^\]]+\]$/.test(normalized)) return null

  return resolveAssetUrl(normalized)
}

function normalizeReplyPreview(content: string | null | undefined): string {
  const rawContent = (content || '').trim()
  if (!rawContent) return ''

  const assetMatch = rawContent.match(/assets\/[^\s]+\.(\w+)/i)
  if (!assetMatch) return rawContent

  const extension = assetMatch[1].toLowerCase()

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'heic'].includes(extension)) {
    return '[图片]'
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(extension)) {
    return '[视频]'
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'opus', 'flac'].includes(extension)) {
    return '[语音]'
  }

  return '[文件]'
}

function resolveReplyEmojiUrls(content: string | null | undefined): string[] | null {
  const rawContent = (content || '').trim()
  if (!rawContent || !rawContent.startsWith('[')) return null

  try {
    const parsed = JSON.parse(rawContent)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const urls = parsed
      .filter((item): item is string => typeof item === 'string')
      .filter((item) => item.startsWith('assets/emoji/') || item.startsWith('/assets/emoji/'))
      .map((item) => resolveAssetUrl(item))
      .filter((item): item is string => !!item)

    return urls.length > 0 ? urls : null
  } catch {
    return null
  }
}

const voiceUrl = computed(() => {
  if (!isVoice.value) return null
  return resolveMarkedMediaUrl(props.message.content, '[语音]')
})

const videoUrl = computed(() => {
  if (!isVideo.value) return null
  return resolveMarkedMediaUrl(props.message.content, '[视频]')
})

const replyBodyEmojiUrls = computed(() => {
  if (!isReply.value) return null
  return resolveReplyEmojiUrls(props.message.content)
})

function extractFileName(pathOrName: string) {
  const normalized = pathOrName.split(/[\\/]/).pop() || pathOrName
  return normalized.trim()
}

function getFileExtension(fileName: string) {
  const extension = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
  return extension.toLowerCase()
}

function isMissingFilePlaceholder(fileName: string) {
  return /^notfound\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(fileName.trim())
}

const fileInfo = computed(() => {
  if (!isFile.value) return null

  const rawContent = (props.message.content || '').trim()
  if (!rawContent) return null

  if (rawContent.startsWith('assets/') || rawContent.startsWith('/assets/')) {
    const fileName = extractFileName(rawContent)
    return {
      openPath: isMissingFilePlaceholder(fileName) ? null : rawContent,
      fileName,
      extension: isMissingFilePlaceholder(fileName) ? '' : getFileExtension(fileName),
      isMissing: isMissingFilePlaceholder(fileName),
    }
  }

  const markerMatch = rawContent.match(/^\[(?:File|文件):\s*(.+)\]$/i)
  if (markerMatch) {
    const fileName = extractFileName(markerMatch[1])
    return {
      openPath: null,
      fileName,
      extension: getFileExtension(fileName),
      isMissing: false,
    }
  }

  const fileName = extractFileName(rawContent)
  return {
    openPath: rawContent,
    fileName,
    extension: getFileExtension(fileName),
    isMissing: false,
  }
})

const filePreviewMeta = computed(() => {
  if (fileInfo.value?.isMissing) {
    return {
      badge: 'MISS',
      icon: 'i-heroicons-exclamation-triangle',
      cover: 'from-gray-400 to-slate-500',
      description: '文件不存在',
    }
  }

  const extension = fileInfo.value?.extension || ''

  if (['pdf'].includes(extension)) {
    return {
      badge: 'PDF',
      icon: 'i-heroicons-document-text',
      cover: 'from-red-500 to-rose-600',
      description: 'PDF 文件',
    }
  }
  if (['doc', 'docx', 'pages', 'rtf', 'txt', 'md'].includes(extension)) {
    return {
      badge: extension.toUpperCase() || 'DOC',
      icon: 'i-heroicons-document-text',
      cover: 'from-blue-500 to-sky-600',
      description: `${extension.toUpperCase() || 'DOC'} 文件`,
    }
  }
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(extension)) {
    return {
      badge: extension.toUpperCase() || 'XLS',
      icon: 'i-heroicons-table-cells',
      cover: 'from-emerald-500 to-green-600',
      description: `${extension.toUpperCase() || 'XLS'} 文件`,
    }
  }
  if (['ppt', 'pptx', 'key'].includes(extension)) {
    return {
      badge: extension.toUpperCase() || 'PPT',
      icon: 'i-heroicons-presentation-chart-bar',
      cover: 'from-orange-500 to-amber-600',
      description: `${extension.toUpperCase() || 'PPT'} 文件`,
    }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return {
      badge: extension.toUpperCase() || 'ZIP',
      icon: 'i-heroicons-archive-box',
      cover: 'from-violet-500 to-purple-600',
      description: `${extension.toUpperCase() || 'ZIP'} 文件`,
    }
  }
  return {
    badge: extension ? extension.toUpperCase() : 'FILE',
    icon: 'i-heroicons-document',
    cover: 'from-slate-500 to-gray-600',
    description: extension ? `${extension.toUpperCase()} 文件` : '文件',
  }
})

// 解析转发消息内容
interface ForwardedMessagePreview {
  title: string
  senderName: string
  content: string
  messageCount: number
  messagePreviews: { senderName: string; content: string }[]
}

const forwardPreview = computed<ForwardedMessagePreview | null>(() => {
  if (!isForward.value) return null

  try {
    const rawContent = props.message.content || ''
    let xmlContent = rawContent

    try {
      const parsed = JSON.parse(rawContent)
      if (parsed?.content) {
        xmlContent = parsed.content
      }
    } catch {
      // Not JSON, use as-is
    }

    const titleMatch = xmlContent.match(/<title[^>]*size="34"[^>]*>([^<]+)<\/title>/)
    const summaryMatch = xmlContent.match(/<summary[^>]*>([^<]+)<\/summary>/)
    const title = titleMatch?.[1] || '群聊的聊天记录'
    const summary = summaryMatch?.[1] || ''

    const messageCountMatch = summary.match(/(\d+)/)
    const messageCount = messageCountMatch ? parseInt(messageCountMatch[1]) : 0

    const messagePreviews: { senderName: string; content: string }[] = []
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/g
    let match
    while ((match = titleRegex.exec(xmlContent)) !== null) {
      const text = match[1]
      const fullMatch = match[0]
      if (fullMatch.includes('size="34"')) continue
      const colonIndex = text.indexOf(':  ')
      if (colonIndex !== -1) {
        const senderName = text.substring(0, colonIndex).trim()
        const content = text.substring(colonIndex + 2).trim()
        messagePreviews.push({ senderName, content })
      } else {
        messagePreviews.push({ senderName: '', content: text })
      }
    }

    return {
      title,
      senderName: messagePreviews[0]?.senderName || '',
      content: messagePreviews[0]?.content || '',
      messageCount,
      messagePreviews,
    }
  } catch {
    return null
  }
})

// 解析表情包内容
const emojiItems = computed(() => {
  if (!isEmoji.value) return []
  try {
    const content = props.message.content || ''
    if (content.startsWith('[')) {
      return JSON.parse(content)
    }
    return [content]
  } catch {
    return [props.message.content || '']
  }
})

// 获取表情包的图片URL
const emojiUrls = computed(() => {
  const urls = emojiItems.value.map((item) => {
    if (item.startsWith('assets/') || item.startsWith('/assets/')) {
      const url = 'asset://' + item.replace(/^\/?assets\//, '')
      console.log('[MessageItem] Emoji asset URL:', url)
      return url
    }
    if (item.startsWith('http')) {
      return item
    }
    return item
  })
  console.log('[MessageItem] All emoji URLs:', urls)
  return urls
})

// 高亮关键词
function highlightContent(content: string): string {
  if (!props.highlightKeywords?.length || !content) return content

  const pattern = props.highlightKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  return content.replace(
    regex,
    '<mark class="bg-transparent border-b-2 border-yellow-400 dark:border-yellow-500">$1</mark>'
  )
}

const recallContent = computed(() => {
  if (!isRecall.value) return ''
  const rawContent = props.message.content || ''
  const normalized = rawContent.replace(/^\[系统\]\s*/i, '').trim()
  if (!normalized) return '撤回了一条消息'

  const senderId = props.message.senderPlatformId?.trim()
  const senderLabel = displayName.value || props.message.senderName || senderId

  if (senderId && senderLabel) {
    return normalized.replaceAll(senderId, senderLabel)
  }

  return normalized
})

const systemMessageContent = computed(() => {
  if (!isSystemMessage.value) return ''
  const rawContent = props.message.content || ''
  return rawContent.replace(/^\[系统\]\s*/i, '').trim() || '系统消息'
})

// 打开大图预览
function openImage(url: string) {
  layoutStore.openImagePreviewModal(url)
}

function openVideo(url: string) {
  layoutStore.openVideoPreviewModal(url)
}

async function openFile(path: string | null | undefined) {
  if (!path) return
  const result = await window.cacheApi.openFile(path)
  if (!result.success) {
    console.error('[MessageItem] Failed to open file:', result.error || path)
  }
}
</script>

<template>
  <div
    class="group px-4 py-2 transition-colors"
    :class="{
      'bg-yellow-50/50 dark:bg-yellow-900/10': isTarget,
    }"
  >
    <div v-if="isRecall || isSystemMessage" class="flex items-center justify-center">
      <p
        class="text-center text-xs text-gray-500 dark:text-gray-400"
        :class="isTarget ? 'font-medium text-gray-600 dark:text-gray-300' : ''"
      >
        {{ isRecall ? recallContent : systemMessageContent }}
      </p>
    </div>

    <!-- Owner 消息显示在右侧 -->
    <div v-else class="flex gap-3" :class="isOwner ? 'flex-row-reverse' : ''">
      <!-- 头像 -->
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white overflow-hidden"
        :class="message.senderAvatar ? '' : avatarColor"
      >
        <img
          v-if="message.senderAvatar"
          :src="message.senderAvatar"
          :alt="message.senderName"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ avatarLetter }}</span>
      </div>

      <!-- 消息内容区 -->
      <div class="min-w-0 flex-1" :class="isOwner ? 'flex flex-col items-end' : ''">
        <!-- 发送者名称 -->
        <div class="mb-1 flex items-center gap-2" :class="isOwner ? 'flex-row-reverse' : ''">
          <span class="text-sm font-medium" :class="nameColor">
            {{ displayName }}
          </span>
        </div>

        <!-- 气泡和上下文按钮 -->
        <!-- max-w-[calc(100%-48px)] = 100% - 头像宽度(36px) - gap(12px) -->
        <div class="flex items-start gap-1 max-w-[calc(100%-68px)]" :class="isOwner ? 'flex-row-reverse' : ''">
          <div
            class="relative inline-block rounded-lg transition-shadow"
            :class="[
              bubbleColor,
              isImage || isVoice || isVideo || isFile || isEmoji || isCall ? '' : 'px-3 py-2',
              isTarget ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : '',
            ]"
          >
            <!-- 回复引用样式 -->
            <div
              v-if="message.replyToMessageId"
              class="mb-2 block max-w-full overflow-hidden rounded-md border-l-2 border-gray-300 bg-gray-50/80 px-2 py-1.5 text-xs text-gray-500 transition-colors hover:border-pink-400 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-400 dark:hover:border-pink-500 dark:hover:text-gray-200"
              :class="message.replyToMessageId ? 'cursor-pointer' : ''"
              @click.stop="message.replyToMessageId && emit('jump-to-reply', message.replyToMessageId)"
            >
              <div class="flex min-w-0 items-center gap-1 leading-4">
                <span class="shrink-0 font-medium">{{ t('records.messageItem.replyTo') }}</span>
                <span v-if="message.replyToSenderName" class="min-w-0 truncate text-gray-600 dark:text-gray-300">
                  {{ message.replyToSenderName }}
                </span>
              </div>
              <div
                v-if="message.replyToContent && resolveReplyEmojiUrls(message.replyToContent)"
                class="mt-1 flex flex-wrap items-center gap-1"
              >
                <img
                  v-for="(url, index) in resolveReplyEmojiUrls(message.replyToContent)"
                  :key="`${url}-${index}`"
                  :src="url"
                  class="h-5 w-5 shrink-0 object-contain"
                />
              </div>
              <p v-else-if="message.replyToContent" class="mt-1 line-clamp-2 break-all leading-4 italic">
                {{ normalizeReplyPreview(message.replyToContent) }}
              </p>
            </div>

            <!-- 图片消息 -->
            <img
              v-if="isImage && imageUrl"
              :src="imageUrl"
              class="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              @click="openImage(imageUrl!)"
            />

            <!-- 语音消息 -->
            <div v-else-if="isVoice" class="w-[min(22rem,70vw)]">
              <VoiceWaveform v-if="voiceUrl" :src="voiceUrl" :is-owner="isOwner" />
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">{{ message.content || '[语音]' }}</p>
            </div>

            <!-- 视频消息 -->
            <div v-else-if="isVideo" class="space-y-2">
              <button
                v-if="videoUrl"
                type="button"
                class="group/video relative block w-fit overflow-hidden rounded-lg"
                @click.stop.prevent="openVideo(videoUrl)"
              >
                <VideoThumbnail :src="videoUrl" />
                <div class="absolute inset-0 z-[1] bg-black/22 transition-colors group-hover/video:bg-black/28" />
                <div class="absolute z-[20] flex items-center justify-center" style="inset: 0">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/58 text-white shadow-xl backdrop-blur-sm transition-transform group-hover/video:scale-110"
                  >
                    <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 4l15 8-15 8V4z" />
                    </svg>
                  </div>
                </div>
              </button>
              <p v-if="!videoUrl" class="text-sm text-gray-500 dark:text-gray-400">{{ message.content || '[视频]' }}</p>
            </div>

            <!-- 文件消息 -->
            <button
              v-else-if="isFile && fileInfo"
              type="button"
              class="flex w-[min(20rem,72vw)] items-center gap-3 rounded-2xl bg-gray-100 p-2.5 text-left transition-colors hover:bg-gray-200/90 dark:bg-gray-800 dark:hover:bg-gray-700"
              :disabled="!fileInfo.openPath"
              @click.stop.prevent="openFile(fileInfo.openPath)"
            >
              <div
                class="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-linear-to-br text-white shadow-sm"
                :class="filePreviewMeta.cover"
              >
                <UIcon :name="filePreviewMeta.icon" class="h-6 w-6 opacity-95" />
                <span class="mt-1 text-[10px] font-semibold tracking-[0.08em]">{{ filePreviewMeta.badge }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="line-clamp-2 break-all text-sm font-medium text-gray-800 dark:text-gray-100">
                  {{ fileInfo.isMissing ? '文件缺失' : fileInfo.fileName }}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ filePreviewMeta.description }}
                </p>
              </div>
              <UIcon
                v-if="fileInfo.openPath"
                name="i-heroicons-arrow-top-right-on-square"
                class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
              />
            </button>
            <p v-else-if="isFile" class="text-sm text-gray-500 dark:text-gray-400">{{ message.content || '[文件]' }}</p>

            <!-- 表情包消息 -->
            <div v-else-if="isEmoji" class="flex flex-wrap gap-1 items-center">
              <template v-for="(item, index) in emojiItems" :key="index">
                <span class="flex h-6 items-center justify-center">
                  <img
                    v-if="
                      emojiUrls[index] &&
                      (emojiUrls[index].startsWith('asset://') ||
                        emojiUrls[index].startsWith('http') ||
                        emojiUrls[index].startsWith('assets/'))
                    "
                    :src="emojiUrls[index]"
                    class="w-6 h-6 object-contain shrink-0"
                  />
                  <span
                    v-else
                    class="text-sm leading-none text-gray-700 dark:text-gray-200"
                    v-html="highlightContent(item)"
                  />
                </span>
              </template>
            </div>

            <!-- 转发消息 -->
            <div
              v-else-if="isForward && forwardPreview"
              class="w-[min(20rem,72vw)] cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              @click.stop="
                layoutStore.openForwardMessagePreview({
                  title: forwardPreview.title,
                  messages: forwardPreview.messagePreviews,
                })
              "
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-heroicons-arrow-right-circle" class="h-4 w-4 text-gray-400" />
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">转发消息</span>
              </div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
                {{ forwardPreview.title }}
              </p>
              <div v-if="forwardPreview.messagePreviews.length > 0" class="mt-2 space-y-1.5">
                <div
                  v-for="(preview, idx) in forwardPreview.messagePreviews.slice(0, 2)"
                  :key="idx"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  <span class="font-medium">{{ preview.senderName }}</span>
                  <span class="mx-1">:</span>
                  <span class="line-clamp-1 inline-block max-w-[80%] align-bottom">{{ preview.content }}</span>
                </div>
              </div>
              <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">{{ forwardPreview.messageCount }} 条转发消息</p>
            </div>

            <!-- 引用消息正文中的 emoji 数组 -->
            <div v-else-if="replyBodyEmojiUrls" class="flex flex-wrap gap-1 items-center">
              <img
                v-for="(url, index) in replyBodyEmojiUrls"
                :key="`${url}-${index}`"
                :src="url"
                class="h-6 w-6 shrink-0 object-contain"
              />
            </div>

            <!-- 通话消息 -->
            <div v-else-if="isCall" class="flex items-center gap-2 px-1">
              <UIcon
                :name="callInfo?.callType === 'video' ? 'i-heroicons-video-camera' : 'i-heroicons-phone'"
                class="h-4 w-4 shrink-0"
                :class="
                  callInfo?.callType === 'missed' || callInfo?.callType === 'rejected'
                    ? 'text-red-400'
                    : 'text-gray-400'
                "
              />
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ callDisplayContent }}</span>
            </div>

            <!-- 文本消息 -->
            <p
              v-else
              class="whitespace-pre-wrap break-all text-sm text-gray-700 dark:text-gray-200"
              v-html="highlightContent(message.content || '')"
            />
          </div>

          <!-- 上下文查看按钮 -->
          <button
            v-if="isFiltered"
            class="mt-1 flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-700"
            :title="t('records.messageItem.viewContext')"
            @click="$emit('view-context', message.id)"
          >
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
