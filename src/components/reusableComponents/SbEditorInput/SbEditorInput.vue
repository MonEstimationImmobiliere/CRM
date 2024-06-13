<template>
  <div class="sb-editor-input">
    <template v-if="editor">
      <div class="sb-editor-input-params">
        <div class="d-flex justify-content-space-between w-100">
          <ElRadioGroup :model-value="textLevel" @change="handleTextLevelChange">
            <ElRadioButton :label="2">
              {{ t('common.words.title') }}
            </ElRadioButton>
            <ElRadioButton :label="3">
              {{ t('common.words.subtitle') }}
            </ElRadioButton>
            <ElRadioButton :label="0">
              {{ t('common.words.normal') }}
            </ElRadioButton>
          </ElRadioGroup>
          <ElCheckboxGroup :model-value="textStyle">
            <ElCheckboxButton
              label="bold"
              :disabled="!editor.can().chain().focus().toggleBold().run()"
              @change="editor.chain().focus().toggleBold().run()"
            >
              <b>{{ t('common.textStyle.bold') }}</b>
            </ElCheckboxButton>
            <ElCheckboxButton
              label="italic"
              :disabled="!editor.can().chain().focus().toggleItalic().run()"
              @change="editor.chain().focus().toggleItalic().run()"
            >
              <i>{{ t('common.textStyle.italic') }}</i>
            </ElCheckboxButton>
            <ElCheckboxButton
              label="underline"
              :disabled="!editor.can().chain().focus().toggleUnderline().run()"
              @change="editor.chain().focus().toggleUnderline().run()"
            >
              <u>{{ t('common.textStyle.underline') }}</u>
            </ElCheckboxButton>
          </ElCheckboxGroup>
        </div>

        <ElRadioGroup :model-value="textAlign" @change="handleTextAlignChange">
          <ElRadioButton label="left">
            <SbIcon icon-path="Custom:TextLeft" icon-color-fill />
          </ElRadioButton>
          <ElRadioButton label="center">
            <SbIcon icon-path="Custom:TextCenter" icon-color-fill />
          </ElRadioButton>
          <ElRadioButton label="right">
            <SbIcon icon-path="Custom:TextRight" icon-color-fill />
          </ElRadioButton>
          <ElRadioButton label="justify">
            <SbIcon icon-path="Custom:TextJustify" icon-color-fill />
          </ElRadioButton>
        </ElRadioGroup>
      </div>
    </template>
    <EditorContent :editor="editor" class="sb-editor-input-content" />
    <template v-if="characterLimit">
      <SbTypography :type="characterCountType" class="sb-editor-input-character-count">
        {{ `${characterCount}/${characterLimit}` }}
      </SbTypography>
    </template>
  </div>
</template>

<script setup lang="ts">
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, JSONContent, useEditor } from "@tiptap/vue-3";
import { ElCheckboxButton, ElCheckboxGroup, ElRadioButton, ElRadioGroup } from "element-plus";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { ComponentType } from "@confero/common/types/common";

import SbIcon from "../SbIcon/SbIcon.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = defineProps<{
  modelValue?: JSONContent;
  characterLimit?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: JSONContent): void;
}>();

const { t } = useI18n();

const characterCount = computed((): number => {
  return editor.value?.storage.characterCount.characters() ?? 0;
});

const characterCountType = computed((): ComponentType | undefined => {
  if (!props.characterLimit) return;
  if (characterCount.value >= props.characterLimit) return "danger";
  return "info";
});

const textAlign = computed((): string | undefined => {
  if (editor.value?.isActive("heading")) {
    return editor.value.getAttributes("heading").textAlign;
  }
  if (editor.value?.isActive("paragraph")) {
    return editor.value.getAttributes("paragraph").textAlign;
  }
  return "left";
});

const textLevel = computed((): number | undefined => editor.value?.getAttributes("heading").level ?? 0);
const textStyle = computed((): string[] => getTextStyle());

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ["paragraph", "heading"]
    }),
    CharacterCount.configure({
      limit: props.characterLimit
    })
  ],
  onUpdate: (value): void => {
    emit("update:modelValue", value.editor.getJSON());
  },
  autofocus: false,
  injectCSS: false
});

const getTextStyle = (): string[] => {
  const result: string[] = [];
  if (editor.value?.isActive("bold")) result.push("bold");
  if (editor.value?.isActive("italic")) result.push("italic");
  if (editor.value?.isActive("underline")) result.push("underline");
  return result;
};

const handleTextAlignChange = (value): void => {
  editor.value?.chain().focus().setTextAlign(value).run();
};

const handleTextLevelChange = (value): void => {
  if (value === 0) {
    editor.value?.chain().focus().setParagraph().run();
  } else {
    editor.value?.chain().focus().setHeading({ level: value }).run();
  }
};
</script>

<style scoped lang="scss">
.sb-editor-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  .sb-editor-input-params {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: space-between;
  }

  .sb-editor-input-content {
    :deep(.tiptap) {
      background-color: #ffffff;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      min-height: 200px;
      padding: 10px;

      &.ProseMirror-focused {
        border-color: var(--el-input-focus-border-color);
        outline: none;
      }

      p {
        margin: 0;
      }
    }
  }

  .sb-editor-input-character-count {
    float: right;
  }
}
</style>