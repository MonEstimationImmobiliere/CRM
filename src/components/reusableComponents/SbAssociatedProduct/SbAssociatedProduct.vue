<template>
  <div class="associated-product">
    <div class="associated-product-background">
      <img :src="`/assets/products/product_${props.associatedProduct.id}.jpeg`">
    </div>
    <div class="associated-product-title ellipsis ellipsis-2">
      {{ props.associatedProduct.title }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IAssociatedProduct } from "@confero/common/types/ticket";

const props = defineProps<{
  associatedProduct: IAssociatedProduct;
}>();

</script>

<style lang="scss" scoped>
.associated-product {
  --item-size: 200px;
  cursor: pointer;
  width: var(--item-size);

  .associated-product-background {
    border-radius: 14px;
    box-shadow: var(--el-box-shadow-lighter);
    overflow: hidden;
    padding-bottom: var(--item-size);
    position: relative;
    width: var(--item-size);

    img {
      height: 100%;
      object-fit: cover;
      position: absolute;
      width: 100%;
    }
  }

  .associated-product-title {
    font-weight: 500;
    height: 50px;
    line-height: 20px;
    padding-left: 10px;
    padding-top: 10px;
  }
}

</style>