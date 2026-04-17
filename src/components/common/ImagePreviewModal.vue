<script setup lang="ts">
/**
 * 全局图片预览弹窗
 * 使用 UModal 托管全屏预览，避免自定义 Teleport 图层与其他弹层发生点击穿透。
 */
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  imageSrc: string | null
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
      overlay: 'z-[10010] bg-black/92',
      content: 'z-[10010] h-screen w-screen max-w-none rounded-none border-0 bg-transparent shadow-none ring-0',
    }"
  >
    <template #content>
      <div class="relative flex h-screen w-screen items-center justify-center p-6" style="-webkit-app-region: no-drag">
        <img v-if="imageSrc" :src="imageSrc" alt="图片预览" class="max-h-full max-w-full object-contain select-none" />

        <button
          class="absolute bottom-6 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80"
          style="-webkit-app-region: no-drag"
          @click="closeModal"
        >
          <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
          <span>关闭预览</span>
        </button>
      </div>
    </template>
  </UModal>
</template>
