<template>
  <div class="network-error-page">
    <div class="wrapper">
      <SbIcon icon-path="Element:Warning" :icon-size="100" color="#FFB600" />
      <SbTypography as="h5" bold class="mb-3 mt-3">
        {{ t('common.networkErrorTitle') }}
      </SbTypography>
      <SbTypography as="p1" class="mb-3">
        {{ t('common.networkErrorSubtitle') }}
      </SbTypography>

      <div class="d-flex gap-10">
        <SbButton type="primary" :loading="retrying" @click="handleRetryClick">
          {{ t('common.words.retry') }}
        </SbButton>

        <template v-if="showDisconnect">
          <SbButton type="info" @click="handleLogoutClick">
            {{ t('common.logout') }}
          </SbButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { isUserLoggedIn, logout } from "@confero/common/config/auth";
import env from "@confero/common/config/env";
import { waitFor } from "@confero/common/helpers/common";

import SbButton from "../SbButton/SbButton.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import SbTypography from "../SbTypography/SbTypography.vue";
const props = defineProps<{
  show?: boolean;
}>();

const router = useRouter();
const route = useRoute();

const BASE_PATH = env.VITE_APP_BASE_PATH || "/";
const retrying = ref(false);

const { t } = useI18n();

const showDisconnect = computed((): boolean => {
  return isUserLoggedIn() && navigator.onLine;
});

onMounted((): void => {
  const url = new URL(window.location.href);

  const showFromQuery = !!url.searchParams.get("show");
  if (!showFromQuery && !props.show) {
    // redirect to base path
    window.location.replace(BASE_PATH);
  } else {
    // remove "show" query param from current route
    const query = Object.assign({}, route.query);
    delete query.show;
    router.replace({ query });
  }
});

const handleRetryClick = async (): Promise<void> => {
  if (retrying.value) return;
  retrying.value = true;
  await waitFor(500);
  const reloadDestination = window.history.state?.destination || BASE_PATH;

  if (navigator.onLine) {
    window.location.href = reloadDestination;
  }

  retrying.value = false;
};

const handleLogoutClick = (): void => {
  logout();
};

</script>

<style scoped lang="scss">
.network-error-page {
  background-color: #fff;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;

  .wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    text-align: center;
    width: 100%;
  }
}
</style>

