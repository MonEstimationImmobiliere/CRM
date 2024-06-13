<template>
  <SbCard radius class="sb-newsletter-card">
    <div class="container w-100 h-100 d-flex flex-column align-items-center text-center">
      <template v-if="logoUrl">
        <img class="logo" :src="logoUrl" alt="company logo">
      </template>

      <template v-if="props.newsletter.textContent">
        <SbTypography as="h4" semi-bold class="title">
          <SbIcon icon-path="Custom:Trumpet2" /> <span>{{ props.newsletter.title }}</span>
        </SbTypography>

        <SbTypography as="h6">
          {{ props.newsletter.textContent }}
        </SbTypography>
      </template>

      <template v-if="props.newsletter.link">
        <SbLink class="link-subscribe" :href="props.newsletter.link" target="_blank">
          <SbButton class="button-subscribe" rounded>
            {{ t("common.receiptDisplaySetting.iSubscribe") }}
          </SbButton>
        </SbLink>
      </template>
    </div>
  </SbCard>
</template>

<script lang="ts" setup>

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { ICompany } from "@confero/common/types/company";
import { INewsletter } from "@confero/common/types/receipt";

import SbButton from "../SbButton/SbButton.vue";
import SbCard from "../SbCard/SbCard.vue";
import SbIcon from "../SbIcon/SbIcon.vue";
import SbLink from "../SbLink/SbLink.vue";
import SbTypography from "../SbTypography/SbTypography.vue";

const props = defineProps<{
  newsletter: INewsletter;
  companyLogo?: ICompany["companyLogo"];
}>();

const logoUrl = computed((): string | null => props.newsletter.imageUrl || props.companyLogo || null);

const { t } = useI18n();

</script>

<style lang="scss">

.sb-newsletter-card {
  width: 100%;

  .container {
    gap: 15px;

    .text-content {
      overflow-wrap: anywhere;
    }

    .logo {
      height: 50px;
      max-width: 80%;
      object-fit: contain;
    }

    .title {
      line-height: 30px;
    }

    .link-subscribe {
      text-decoration: none;

      .button-subscribe {
        background: #000000;
        border-color: #000000;
        color: rgb(255, 255, 255);
        font-weight: bold;
      }
    }
  }
}
</style>