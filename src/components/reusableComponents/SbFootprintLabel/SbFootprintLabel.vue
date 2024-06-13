<template>
  <template v-if="scoreMetaData">
    <div class="footprint-label" :class="scoreMetaData.class">
      <span class="badge">
        {{ props.score }}
      </span>
      <span class="title">
        {{ scoreMetaData.title }}
      </span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  score: "A" | "B" | "C" | "D" | "E";
}>();

const scoreMetaData = computed((): { title: string; class: string } | undefined => {
  switch (props.score) {
    case "A":
      return {
        title: "Excellent score environnemental",
        class: "footprint-score-a"
      };

    case "B":
      return {
        title: "Bon score environnemental",
        class: "footprint-score-b"
      };

    case "C":
      return {
        title: "Score environnemental faible",
        class: "footprint-score-c"
      };

    case "D":
      return {
        title: "Mauvais score environnemental",
        class: "footprint-score-d"
      };

    case "E":
      return {
        title: "Mauvais score environnemental",
        class: "footprint-score-e"
      };

    default:
      return undefined;
  }
});

</script>

<style scoped lang="scss">
.footprint-label {
  --color: inherit;
  align-items: center;
  display: inline-flex;
  gap: 4px;
  justify-content: center;

  .badge {
    align-items: center;
    background-color: var(--color);
    border-radius: 50%;
    display: inline-flex;
    height: 1.3em;
    justify-content: center;
    width: 1.3em;
  }

  .title {
    color: var(--color);
  }

  &.footprint-score {
    &-a {
      --color: #2da53f;

      .badge {
        color: #ffffff;
      }
    }

    &-b {
      --color: #77ba3b;

      .badge {
        color: #ffffff;
      }
    }

    &-c {
      --color: #d9c232;

      .badge {
        color: #ffffff;
      }
    }

    &-d {
      --color: #ff8800;

      .badge {
        color: #ffffff;
      }
    }

    &-e {
      --color: #cd4748;

      .badge {
        color: #ffffff;
      }
    }
  }

}
</style>