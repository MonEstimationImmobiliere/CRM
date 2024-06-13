import { Search } from "@element-plus/icons-vue";
import type { StoryFn } from "@storybook/vue3";
import { ElIcon } from "element-plus";

import SbIcon from "../SbIcon/SbIcon.vue";
import SbAutocomplete from "./SbAutocomplete.vue";

export default {
  title: "Component/SbAutocomplete",
  component: SbAutocomplete
};

const Template: StoryFn<typeof SbAutocomplete> = (args) => ({
  components: {
    SbAutocomplete,
    SbIcon,
    Search,
    ElIcon
  },
  setup() {
    const fetchSuggestions = () => {
      return [
        { value: "Darty" },
        { value: "Monoprix" },
        { value: "Carrefour" },
        { value: "Boulanger" }
      ];
    };
    return { args, fetchSuggestions };
  },
  template: `
      <div>
        <SbAutocomplete v-bind="args" placeholder="Rechercher" :fetch-suggestions="fetchSuggestions">
          <template #prefix>
            <ElIcon>
              <Search />
            </ElIcon>
          </template>
      </SbAutocomplete>
    </div>
      `
});

export const Default = {
  render: Template,

  args: {}
};

export const WithShadow = {
  render: Template,

  args: {
    shadow: true
  }
};
