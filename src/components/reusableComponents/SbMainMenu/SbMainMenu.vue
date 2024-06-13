<template>
  <SbMenu
    :alternates-logo="props.alternatesLogo"
    @home-click="handleHomeClick"
  >
    <template #logo>
      <img class="menu-logo" :src="displayedLogoURL" alt="Logo">
    </template>
    <template v-if="props.spaceName">
      <div class="menu-title">
        <SbTypography
          type="info"
          semi-bold
          uppercase
          as="p2"
        >
          {{ props.spaceName }}
        </SbTypography>
      </div>
    </template>
    <template v-for="menuItem in menuItems" :key="menuItem.label">
      <div class="menu-items">
        <template v-if="shownMenuItems.includes(menuItem) ">
          <SbMenuItem
            :to="menuItem"
            :label="menuItem.label"
            :icon-path="menuItem.iconPath"
            :icon-color="menuItem.iconColor"
            :icon-size="24"
            @menu-item-click="handleMenuItemClick"
          />
          <ElDivider class="menu-divider" />
        </template>
      </div>
    </template>
    <template #after-menu>
      <template v-if="props.isUserLoggedIn&&props.user">
        <div class="menu-bottom">
          <SbUserDropdown
            :user="props.user"
            :show-admin-access="props.showAdminAccess"
            :show-retailer-access="props.showRetailerAccess"
            @edit-profile="handleEditProfile"
            @edit-password="handleEditPassword"
            @logout="handleLogout"
            @go-to-admin="handleGoToAdmin"
            @go-to-retailer="handleGoToRetailer"
          />

          <template v-if="helpRoute">
            <RouterLink class="router-link" :to="helpRoute">
              <div class="menu-bottom-item d-flex align-items-center">
                <SbIcon icon-path="Custom:Help" :icon-size="20" />
                <SbTypography
                  class="menu-bottom-item-text"
                  semi-bold
                  as="p2"
                >
                  {{ t('common.words.help') }}
                </SbTypography>
              </div>
            </RouterLink>
          </template>

          <div class="menu-bottom-item d-flex align-items-center" @click="handleLogout">
            <SbIcon icon-path="Custom:Logout" :icon-size="20" />
            <SbTypography
              class="menu-bottom-item-text"
              semi-bold
              as="p2"
            >
              {{ t('common.logout') }}
            </SbTypography>
          </div>

          <template v-if="props.showButtonReturnAdmin">
            <div class="menu-bottom-item d-flex align-items-center" @click="handleGoToAdmin">
              <SbIcon icon-path="Element:ArrowLeftBold" :icon-size="20" />
              <SbTypography
                class="menu-bottom-item-text"
                semi-bold
                as="p2"
              >
                {{ t('common.returnToAdmin') }}
              </SbTypography>
            </div>
          </template>
        </div>
      </template>
      <template v-else>
        <SbButton class="w-100" type="primary" @click="handleAuthButtonClick">
          {{ t("common.login") }}
        </SbButton>
      </template>
    </template>
  </SbMenu>
</template>

<script lang="ts" setup>
import { useCssVar, useMediaQuery } from "@vueuse/core";
import { ElDivider } from "element-plus";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import logoFull from "@confero/common/assets/logo-full.png?url";
import logoFullAlternate from "@confero/common/assets/logo-full-alternate1.png?url";
import logoMinimal from "@confero/common/assets/logo-minimal.png?url";
import logoMinimalAlternate from "@confero/common/assets/logo-minimal-alternate1.png?url";
import env from "@confero/common/config/env";
import { useIsMobileDevice } from "@confero/common/hooks/useIsMobileDevice";
import type { IRoute } from "@confero/common/types/route";

import SbButton from "../SbButton/SbButton.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import SbMenu from "../SbMenu/SbMenu.vue";
import SbMenuItem from "../SbMenuItem/SbMenuItem.vue";
import SbTypography from "../SbTypography/SbTypography.vue";
import SbUserDropdown from "../SbUserDropdown/SbUserDropdown.vue";

const props = defineProps<{
  menuItems: IRoute[];
  isUserLoggedIn: boolean;
  spaceName?: string;
  user?: {
    firstname?: string | null;
    lastname?: string | null;
    email: string;
  };
  showAdminAccess?: boolean;
  showRetailerAccess?: boolean;
  showButtonReturnAdmin?: boolean;
  helpRoute?: IRoute;
  alternatesLogo?: boolean;
}>();

const emit = defineEmits<{
  (e: "redirectToHome"): void;
  (e: "redirectToEditLoggedUserProfile"): void;
  (e: "redirectToEditLoggedUserPassword"): void;
  (e: "logout"): void;
  (e: "login"): void;
  (e: "menuItemClick"): void;
}>();

const { t } = useI18n();

const sbMdMaxWidth = useCssVar("--sb-md-max-width");
const shouldDisplayMinimalLogo = useMediaQuery(`(max-width: ${sbMdMaxWidth.value})`);

const shownMenuItems = computed((): IRoute[] => props.menuItems.filter((menuItem): boolean => menuItem.gestAccess || props.isUserLoggedIn));
const isMobileDevice = useIsMobileDevice();

const displayedLogoURL = computed((): string => {
  if (isMobileDevice.value || !shouldDisplayMinimalLogo.value) {
    return props.alternatesLogo ? logoFullAlternate : logoFull;
  }
  else {
    return props.alternatesLogo ? logoMinimalAlternate : logoMinimal;
  }
});

const handleEditProfile = (): void => emit("redirectToEditLoggedUserProfile");
const handleEditPassword = (): void => emit("redirectToEditLoggedUserPassword");

const handleMenuItemClick = (): void => {
  emit("menuItemClick");
};

const handleHomeClick = (): void => {
  emit("redirectToHome");
};

const handleLogout = (): void => {
  emit("logout");
};

const handleAuthButtonClick = (): void => {
  return emit("login");
};

const handleGoToAdmin = (): void => {
  window.location.replace(env.VITE_APP_ADMIN_BASE_URL);
};

const handleGoToRetailer = (): void => {
  window.location.replace(env.VITE_APP_RETAILERS_BASE_URL);
};

</script>

<style lang="scss" scoped>

.menu-logo {
  object-fit: contain;
}

.menu-title {
  margin-bottom: calc(var(--sb-gap-y) * 2);
  margin-left: calc(var(--sb-gap-x) * 1.5);
}

.menu-divider {
  border-color: var(--el-color-info-light-8);
  margin: var(--sb-gap-y) 0;
  width: calc(100% - var(--el-menu-base-level-padding));
}

.menu-bottom {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--sb-gap-y);

  .sb-user-dropdown {
    width: 100%;
  }

  .router-link {
    color: var(--el-text-color-primary);
    text-decoration: none;
  }

  .menu-bottom-item {
    border-radius: var(--el-border-radius-base);
    padding: var(--sb-gap-y);

    &:hover {
      background-color: var(--el-color-info-light-9);
      cursor: pointer;
    }
  }

  .menu-bottom-item-text {
    margin-left: var(--sb-gap-x);
  }
}

@media screen and (max-width: $sb-md-max-width) and (min-width: $sb-sm-max-width) {
  .menu-divider {
    margin: calc(var(--sb-gap-y) / 2) 0;
    width: 100%;
  }

  .menu-title {
    align-self: center;
    margin-left: unset;
  }

  .menu-bottom {
    align-items: center;

    .sb-user-dropdown {
      width: auto;

      :deep(.sb-user-details) {
        display: none;
      }

    }

    .menu-bottom-item {
      .menu-bottom-item-text {
        display: none;
      }
    }

  }
}

</style>

