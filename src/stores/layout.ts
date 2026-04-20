import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatRecordQuery } from '@/types/format'

/**
 * 全局界面状态（侧边栏、弹窗、聊天记录抽屉等）
 */
export const useLayoutStore = defineStore(
  'layout',
  () => {
    const isSidebarCollapsed = ref(false)
    const showScreenCaptureModal = ref(false)
    const screenCaptureImage = ref<string | null>(null)
    const showImagePreviewModal = ref(false)
    const imagePreviewSrc = ref<string | null>(null)
    const imagePreviewKind = ref<'image' | 'audio' | 'video'>('image')
    const showForwardMessagePreview = ref(false)
    const forwardMessagePreviewData = ref<{
      title: string
      messages: { senderName: string; content: string }[]
    } | null>(null)
    const showChatRecordDrawer = ref(false)
    const chatRecordQuery = ref<ChatRecordQuery | null>(null)

    const isToolsPanelLocked = ref(false)

    // 截图设置
    const screenshotMobileAdapt = ref(false) // 截图时开启移动端适配，默认关闭

    /**
     * 切换侧边栏展开/折叠状态
     */
    function toggleSidebar() {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    }

    /**
     * 打开截屏预览弹窗
     */
    function openScreenCaptureModal(imageData: string) {
      screenCaptureImage.value = imageData
      showScreenCaptureModal.value = true
    }

    /**
     * 关闭截屏预览弹窗
     */
    function closeScreenCaptureModal() {
      showScreenCaptureModal.value = false
      setTimeout(() => {
        screenCaptureImage.value = null
      }, 300)
    }

    /**
     * 打开图片预览弹窗
     */
    function openMediaPreviewModal(mediaSrc: string, kind: 'image' | 'audio' | 'video' = 'image') {
      imagePreviewKind.value = kind
      imagePreviewSrc.value = mediaSrc
      showImagePreviewModal.value = true
    }

    /**
     * 打开图片预览弹窗
     */
    function openImagePreviewModal(imageSrc: string) {
      openMediaPreviewModal(imageSrc, 'image')
    }

    /**
     * 打开音频预览弹窗
     */
    function openAudioPreviewModal(audioSrc: string) {
      openMediaPreviewModal(audioSrc, 'audio')
    }

    /**
     * 打开视频预览弹窗
     */
    function openVideoPreviewModal(videoSrc: string) {
      openMediaPreviewModal(videoSrc, 'video')
    }

    /**
     * 关闭图片预览弹窗
     */
    function closeImagePreviewModal() {
      showImagePreviewModal.value = false
      setTimeout(() => {
        imagePreviewSrc.value = null
        imagePreviewKind.value = 'image'
      }, 300)
    }

    /**
     * 打开聊天记录抽屉并设置查询参数
     */
    function openChatRecordDrawer(query: ChatRecordQuery) {
      chatRecordQuery.value = query
      showChatRecordDrawer.value = true
    }

    /**
     * 关闭聊天记录抽屉并重置查询
     */
    function closeChatRecordDrawer() {
      showChatRecordDrawer.value = false
      setTimeout(() => {
        chatRecordQuery.value = null
      }, 300)
    }

    /**
     * 打开转发消息预览弹窗
     */
    function openForwardMessagePreview(data: { title: string; messages: { senderName: string; content: string }[] }) {
      forwardMessagePreviewData.value = data
      showForwardMessagePreview.value = true
    }

    /**
     * 关闭转发消息预览弹窗
     */
    function closeForwardMessagePreview() {
      showForwardMessagePreview.value = false
      setTimeout(() => {
        forwardMessagePreviewData.value = null
      }, 300)
    }

    function toggleToolsPanelLock() {
      isToolsPanelLocked.value = !isToolsPanelLocked.value
    }

    return {
      isSidebarCollapsed,
      isToolsPanelLocked,
      showScreenCaptureModal,
      screenCaptureImage,
      showImagePreviewModal,
      imagePreviewSrc,
      imagePreviewKind,
      showForwardMessagePreview,
      forwardMessagePreviewData,
      showChatRecordDrawer,
      chatRecordQuery,
      screenshotMobileAdapt,
      toggleSidebar,
      toggleToolsPanelLock,
      openScreenCaptureModal,
      closeScreenCaptureModal,
      openMediaPreviewModal,
      openImagePreviewModal,
      openAudioPreviewModal,
      openVideoPreviewModal,
      closeImagePreviewModal,
      openChatRecordDrawer,
      closeChatRecordDrawer,
      openForwardMessagePreview,
      closeForwardMessagePreview,
    }
  },
  {
    persist: [
      {
        pick: ['isSidebarCollapsed'],
        storage: sessionStorage,
      },
      {
        pick: ['screenshotMobileAdapt', 'isToolsPanelLocked'],
        storage: localStorage,
      },
    ],
  }
)
