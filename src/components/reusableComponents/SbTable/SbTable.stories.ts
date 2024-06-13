import type { Story } from "@storybook/vue3";
import { ref } from "vue";

import SbInput from "../SbInput/SbInput.vue";
import SbRefreshButton from "../SbRefreshButton/SbRefreshButton.vue";
import SbTable from "./SbTable.vue";
import SbTableColumn from "./SbTableColumn.vue";

export default {
  title: "Component/SbTable",
  component: SbTable
};

const tableData = [{
  id: "c369275e-471f-4e15-a81a-e7b5b5bf92cb",
  firstname: "Lorianna",
  lastname: "Gobeaux",
  company: "Realbridge",
  age: 25
}, {
  id: "809386e6-ccb3-4bcb-8659-eeff2b8efd47",
  firstname: "Delly",
  lastname: "Perris",
  company: "Viva",
  age: 28
}, {
  id: "c7a6576e-cc2f-4f25-ae7c-ec8ff5784e57",
  firstname: "Kiley",
  lastname: "Faircliffe",
  company: "Youspan",
  age: 40
}, {
  id: "c45e1911-de22-4f9b-b43a-66f1b2a552bc",
  firstname: "Arlina",
  lastname: "Coddington",
  company: "Blogtag",
  age: 30
}, {
  id: "1af78767-d90e-46a1-b2bd-06290737fc76",
  firstname: "Halsey",
  lastname: "Guillond",
  company: "Meezzy",
  age: 35
}, {
  id: "809386e6-ccb3-4bcb-8659-eeff2b8efd47",
  firstname: "Delly",
  lastname: "Perris",
  company: "Viva",
  age: 28
}, {
  id: "c7a6576e-cc2f-4f25-ae7c-ec8ff5784e57",
  firstname: "Kiley",
  lastname: "Faircliffe",
  company: "Youspan",
  age: 40
}, {
  id: "a3996771-e93f-4c53-b291-95bb7fb05beb",
  firstname: "Arlina",
  lastname: "Coddington",
  company: "Blogtag",
  age: 30
}, {
  id: "857b37af-ed69-4787-8fd7-91791753a032",
  firstname: "Halsey",
  lastname: "Guillond",
  company: "Meezzy",
  age: 35
}, {
  id: "1c9c27fd-ea57-4618-83bb-8e18f7633ccb",
  firstname: "Delly",
  lastname: "Perris",
  company: "Viva",
  age: 28
}, {
  id: "b6f8f83e-1d38-438a-9b22-dba4a96c5f56",
  firstname: "Kiley",
  lastname: "Faircliffe",
  company: "Youspan",
  age: 40
}, {
  id: "2f8db18d-1543-424e-8898-009475f6cd41",
  firstname: "Arlina",
  lastname: "Coddington",
  company: "Blogtag",
  age: 30
}, {
  id: "fac3fe9a-7fdf-4db3-bd76-4e3c04c0cc97",
  firstname: "Halsey",
  lastname: "Guillond",
  company: "Meezzy",
  age: 35
}, {
  id: "96e51d71-8d52-4742-877b-d3cce22f4366",
  firstname: "Delly",
  lastname: "Perris",
  company: "Viva",
  age: 28
}, {
  id: "e1da5981-19e0-430f-a613-0b2bd96dbc16",
  firstname: "Kiley",
  lastname: "Faircliffe",
  company: "Youspan",
  age: 40
}, {
  id: "f0d883fd-da68-444b-a7c1-5f0f411b6abd",
  firstname: "Arlina",
  lastname: "Coddington",
  company: "Blogtag",
  age: 30
}, {
  id: "9b021353-19c9-4a47-a0a2-e92e5102247c",
  firstname: "Halsey",
  lastname: "Guillond",
  company: "Meezzy",
  age: 35
}, {
  id: "6fd272eb-0140-415e-9658-6474188a9a57",
  firstname: "Raynell",
  lastname: "Tupman",
  company: "Kamba",
  age: 25
}];

const Template: Story<typeof SbTable> = (args) => ({
  components: {
    SbTable,
    SbTableColumn
  },
  setup() {
    const data = ref(tableData);
    return { args, data };
  },
  template: `
    <SbTable v-bind="args" :data="data">
      <SbTableColumn label="First name">
        <template #default="scope">
          {{ scope.row.firstname }}
        </template>
      </SbTableColumn>
      <SbTableColumn label="Last name">
        <template #default="scope">
          {{ scope.row.lastname }}
        </template>
      </SbTableColumn>
      <SbTableColumn label="Company">
        <template #default="scope">
          {{ scope.row.company }}
        </template>
      </SbTableColumn>
      <SbTableColumn label="Age">
        <template #default="scope">
          {{ scope.row.age }}
        </template>
      </SbTableColumn>
    </SbTable>
  `
});

export const Default = Template.bind({});
Default.args = {};

export const Small = Template.bind({});
Small.args = {
  size: "small"
};

export const Large = Template.bind({});
Large.args = {
  size: "large"
};

export const Clickable = Template.bind({});
Clickable.args = {
  onRowClick: () => { }
};

const FiltersTemplate: Story<typeof SbTable> = (args) => ({
  components: {
    SbTable,
    SbTableColumn,
    SbRefreshButton,
    SbInput
  },
  setup() {
    const data = ref(tableData);
    return { args, data };
  },
  template: `
    <SbTable v-bind="args" row-key="id" :data="data">
      <template #default>
        <SbTableColumn label="First name">
          <template #default="scope">
            {{ scope.row.firstname }}
          </template>
        </SbTableColumn>
        <SbTableColumn label="Last name">
          <template #default="scope">
            {{ scope.row.lastname }}
          </template>
        </SbTableColumn>
        <SbTableColumn label="Company">
          <template #default="scope">
            {{ scope.row.company }}
          </template>
        </SbTableColumn>
        <SbTableColumn label="Age">
          <template #default="scope">
            {{ scope.row.age }}
          </template>
        </SbTableColumn>
      </template>
      <template #filters>
        <SbInput placeholder="Search" />
        <SbRefreshButton/>
      </template>
    </SbTable>
  `
});

export const Filters = FiltersTemplate.bind({});
Filters.args = {
};

export const Sticky = FiltersTemplate.bind({});
Sticky.args = {
  sticky: true
};

