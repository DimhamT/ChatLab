<script setup lang="ts">
/**
 * 转发消息预览弹窗
 */
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  data: {
    title: string
    messages: { senderName: string; content: string }[]
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

function closeModal() {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    fullscreen
    :close="false"
    :ui="{
      overlay: 'z-[10010] bg-black/80',
      content: 'z-[10010] h-screen w-screen max-w-none rounded-none border-0 bg-transparent shadow-none ring-0',
    }"
  >
    <template #content>
      <div
        class="relative flex h-screen w-screen flex-col items-center justify-start overflow-auto p-6 pt-20"
        style="-webkit-app-region: no-drag"
      >
        <button
          class="absolute top-6 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80"
          style="-webkit-app-region: no-drag"
          @click="closeModal"
        >
          <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
          <span>关闭预览</span>
        </button>

        <div
          v-if="data"
          class="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-sm"
        >
          <div class="mb-4 flex items-center gap-3 text-white">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <UIcon name="i-heroicons-arrow-right-circle" class="h-6 w-6" />
            </div>
            <div>
              <h2 class="text-lg font-semibold">转发消息</h2>
              <p class="text-sm text-white/70">{{ data.messages.length }} 条消息</p>
            </div>
          </div>

          <h3 class="mb-4 text-xl font-semibold text-white">{{ data.title }}</h3>

          <div class="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            <div v-for="(msg, index) in data.messages" :key="index" class="rounded-lg bg-white/5 p-3 text-white">
              <div class="mb-1 flex items-center gap-2">
                <span class="font-medium text-white/90">{{ msg.senderName }}</span>
              </div>
              <p class="text-sm text-white/70">{{ msg.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
