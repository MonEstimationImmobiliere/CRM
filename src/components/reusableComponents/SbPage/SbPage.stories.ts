import type { StoryFn } from "@storybook/vue3";
import { ElMain, TabPaneName } from "element-plus";
import { computed, ref } from "vue";

import SbPage, { ISbPageTab } from "./SbPage.vue";

export default {
  title: "Component/SbPage",
  component: SbPage
};

const Template: StoryFn<typeof SbPage> = (args) => ({
  components: {
    ElMain,
    SbPage
  },
  setup() {
    const activeTabName = ref<TabPaneName | null>(null);
    const activeTab = computed<ISbPageTab | null>(() => {
      return activeTabName.value
        ? args.tabs?.find((tab) => tab.name === activeTabName.value) || null
        : null;
    });

    return {
      args,
      activeTab,
      activeTabName
    };
  },
  template: `
    <ElMain style="height: 50vh;">
      <SbPage v-bind="args" v-model:activeTabName="activeTabName">
        <template #header>
          <div style="background-color: lightblue; display:flex; align-items: center; justify-content: center;">HEADER</div>
        </template>

        <div style="height: 200vh; background-color: lightblue">
          <template v-if="args.tabs">
            activeTabName: {{ activeTabName }}<br/>
            activeTab : {{activeTab}}
          </template>
          <template v-else>
            Page content
          </template>
        </div>
      </SbPage>
    </ElMain>
  `
});

export const Default = {
  render: Template,
  args: {}
};

export const StickyHeader = {
  render: Template,

  args: {
    stickyHeader: true
  }
};

export const WithTabs = {
  render: Template,

  args: {
    tabs: [
      {
        label: "Tab 1",
        name: "tab1"
      },
      {
        label: "Tab 2",
        name: "tab2"
      }
    ]
  }
};

export const WithTabsSticky = {
  render: Template,

  args: {
    stickyHeader: true,
    tabs: [
      {
        label: "Tab 1",
        name: "tab1"
      },
      {
        label: "Tab 2",
        name: "tab2"
      }
    ]
  }
};
