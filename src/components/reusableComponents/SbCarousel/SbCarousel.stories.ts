import type { StoryFn } from "@storybook/vue3";

import background1 from "../../assets/images/discounts/discount-1.jpg";
import background2 from "../../assets/images/discounts/discount-2.jpg";
import background3 from "../../assets/images/discounts/discount-3.jpg";
import background4 from "../../assets/images/discounts/discount-4.jpg";
import background5 from "../../assets/images/discounts/discount-5.jpg";
import background6 from "../../assets/images/discounts/discount-6.jpg";
import SbButton from "../SbButton/SbButton.vue";
import SbDiscount from "../SbDiscount/SbDiscount.vue";
import SbCarousel from "./SbCarousel.vue";

export default {
  title: "Component/SbCarousel",
  component: SbCarousel
};

const Template: StoryFn<typeof SbCarousel> = (args) => ({
  components: {
    SbCarousel,
    SbDiscount,
    SbButton
  },
  setup() {
    return { args };
  },
  template: `
  <div style="max-width: 400px;background: #FFFFFF; padding: 5px;">
      <SbCarousel v-bind="args">
        <template #items>
          <template v-for="discount in args.discounts">
            <SbDiscount :discount="discount" />
          </template>
        </template>
      </SbCarousel>
  </div>
  `
});

export const Default = {
  render: Template,

  args: {
    title: "Title",
    discounts: [
      {
        url: "https://www.darty.com/",
        background: background3,
        badge: "-15€",
        title: "15€ de remise immédiate",
        merchant: "Darty",
        type: "barcode"
      },
      {
        url: "https://www.fnac.com/",
        background: background4,
        badge: "-10%",
        title: "-10% sur le prochain achat",
        merchant: "Fnac",
        type: "barcode"
      },
      {
        url: "https://www.carrefour.com/",
        background: background6,
        badge: "5€",
        title: "5€ pour 50€ d'achat",
        merchant: "Carrefour",
        type: "barcode"
      },
      {
        url: "https://www.wedressfair.com/",
        background: background1,
        badge: "20€",
        title: "20€ offert pour la création d'un compte",
        merchant: "Wedressfair",
        type: "code"
      },
      {
        url: "https://www.zalando.com/",
        background: background2,
        badge: "-8%",
        title: "-8% sur les chaussures d'été",
        merchant: "Zalando",
        type: "code"
      },
      {
        url: "https://www.darty.com/",
        background: background5,
        badge: "-10%",
        title: "-10% sur l'électroménager",
        merchant: "Darty",
        type: "barcode"
      }
    ]
  }
};
