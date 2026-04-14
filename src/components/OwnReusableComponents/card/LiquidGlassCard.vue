<template>
  <!-- SVG Filter (include once in your document) -->
  <svg width="0" height="0" style="position: absolute">
    <defs>
      <filter :id="filterId" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          :baseFrequency="baseFrequency"
          :numOctaves="numOctaves"
          :seed="seed"
          result="noise"
        />
        <feGaussianBlur in="noise" :stdDeviation="blurIntensity" result="blurred" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurred"
          :scale="distortionScale"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>

  <!-- Liquid Glass Card -->
  <div class="liquid-glass-card" :style="cardStyles" @click="handleClick">
    <div class="card-content">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
      <slot v-if="!title && !description"></slot>
      <button v-if="buttonText" class="glass-button" @click.stop="handleButtonClick">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// Props
interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  width?: string;
  height?: string;
  backgroundColor?: string;
  baseFrequency?: string;
  numOctaves?: number;
  seed?: number;
  blurIntensity?: number;
  distortionScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: '400px',
  height: '300px',
  backgroundColor: 'rgba(112, 112, 112, 0.12)',
  baseFrequency: '0.025 0.025',
  numOctaves: 2,
  seed: 92,
  blurIntensity: 2,
  distortionScale: 91,
});

// Emits
const emit = defineEmits<{
  click: [];
  buttonClick: [];
}>();

// Reactive data
const filterId = ref(`glass-distortion-${Math.random().toString(36).substr(2, 9)}`);

// Computed properties
const cardStyles = computed(() => ({
  width: props.width,
  height: props.height,
  '--bg-color': props.backgroundColor,
}));

// Methods
const handleClick = () => {
  emit('click');
};

const handleButtonClick = () => {
  emit('buttonClick');
};
</script>

<style>
/* Liquid Glass Card */
.liquid-glass-card {
  position: relative;
  width: 400px;
  height: 300px;
  border-radius: 28px;
  isolation: isolate;
  box-shadow: 0px 6px 21px -8px rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

/* Tint and inner shadow layer */
.liquid-glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 28px;
  box-shadow: inset 0 0 12px -4px rgba(255, 255, 255, 0.3);
  background-color: var(--bg-color, rgba(112, 112, 112, 0.2));
  pointer-events: none;
}

/* Backdrop blur and distortion layer */
.liquid-glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 28px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  filter: url(#glass-distortion);
  -webkit-filter: url(#glass-distortion);
  isolation: isolate;
  pointer-events: none;
}

/* Content styling */
.card-content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  color: white;
}

.card-content h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.card-content p {
  opacity: 0.8;
  margin-bottom: 24px;
}

.glass-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
