import type { StoryFn } from "@storybook/vue3";
import { ref } from "vue";

import SbSelect from "./SbSelect.vue";
import SbSelectOption from "./SbSelectOption.vue";
import SbSelectOptionGroup from "./SbSelectOptionGroup.vue";

export default {
  title: "Component/SbSelect",
  component: SbSelect
};

const options = [
  {
    value: "Option 1",
    label: "Option 1",
    disabled: false
  },
  {
    value: "Option 2",
    label: "Option 2",
    disabled: true
  },
  {
    value: "Option 3",
    label: "Option 3",
    disabled: true
  },
  {
    value: "Option 4",
    label: "Option 4",
    disabled: false
  },
  {
    value: "Option 5",
    label: "Option 5",
    disabled: false
  }
];

const groupedOptions = [
  {
    label: "Group 1",
    options: [
      {
        value: "Group option 1",
        label: "Group option 1",
        disabled: false
      },
      {
        value: "Group option 2",
        label: "Group option 2",
        disabled: false
      }
    ]
  },
  {
    label: "Group 2",
    options: [
      {
        value: "Group option 3",
        label: "Group option 3",
        disabled: false
      },
      {
        value: "Group option 4",
        label: "Group option 4",
        disabled: false
      }
    ]
  },
  {
    label: "",
    options: [
      {
        value: "Group option 5",
        label: "Group option 5",
        disabled: true
      }
    ]
  }
];

const Template: StoryFn<typeof SbSelect> = (args) => ({
  components: {
    SbSelect,
    SbSelectOption,
    SbSelectOptionGroup
  },
  setup() {
    return {
      args,
      model1: ref(""),
      model2: ref(groupedOptions[1]?.options[0]?.value ?? ""),
      options,
      groupedOptions
    };
  },
  template: `
    <SbSelect v-bind="args" placeholder="Small select" size="small" v-model="model1">
      <template v-for="option in options" :key="option.value">
        <SbSelectOption
          :label="option.label"
          :value="option.value"
          :disabled="option.disabled"
        />
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Default select" size="default" v-model="model1">
      <template v-for="option in options" :key="option.value">
        <SbSelectOption
          :label="option.label"
          :value="option.value"
          :disabled="option.disabled"
        />
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Large select" size="large" v-model="model1">
      <template v-for="option in options" :key="option.value">
        <SbSelectOption
          :label="option.label"
          :value="option.value"
          :disabled="option.disabled"
        />
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Small select" size="small" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Default select" size="default" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Large select" size="large" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
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

export const Disabled = {
  render: Template,

  args: {
    disabled: true
  }
};

const MultipleTemplate: StoryFn<typeof SbSelect> = (args) => ({
  components: {
    SbSelect,
    SbSelectOption,
    SbSelectOptionGroup
  },
  setup() {
    const group2Option1 = groupedOptions[1]?.options[0]?.value;
    const group2Option2 = groupedOptions[1]?.options[1]?.value;

    const model2InitialValues: string[] = [];
    if (group2Option1) model2InitialValues.push(group2Option1);
    if (group2Option2) model2InitialValues.push(group2Option2);

    return {
      args,
      model1: ref([]),
      model2: ref(model2InitialValues),
      groupedOptions
    };
  },
  template: `
    <SbSelect v-bind="args" placeholder="Small select" size="small" v-model="model1">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Default select" size="default" v-model="model1">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Large select" size="large" v-model="model1">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Small select" size="small" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Default select" size="default" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
    <br/>
    <br/>
    <SbSelect v-bind="args" placeholder="Large select" size="large" v-model="model2">
      <template v-for="group in groupedOptions" :key="group.label">
        <SbSelectOptionGroup :label="group.label">
          <template v-for="option in group.options" :key="option.value">
            <SbSelectOption
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </template>
        </SbSelectOptionGroup>
      </template>
    </SbSelect>
  `
});

export const Multiple = {
  render: MultipleTemplate,

  args: {
    multiple: true
  }
};
